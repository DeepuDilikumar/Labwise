import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Locale } from "@regions";
import { extraction } from "@/lib/domain/extraction";
import { env } from "@/server/env";
import { EXPLAIN_SYSTEM, EXTRACT_SYSTEM } from "./prompts";
import { AiError, explainOutput, type AiProvider, type InputFile, type Usage } from "./types";

/** USD per 1M tokens (input, output). Used only for the admin cost view. */
const PRICING: Record<string, [number, number]> = {
  "claude-opus-5-5": [4, 20],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
  "claude-fable-5-2": [8, 40],
};
const LANG: Record<Locale, string> = { en: "English", hi: "Hindi (Devanagari script)", ml: "Malayalam (Malayalam script)" };

function usageOf(model: string, u: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null }): Usage {
  const [pin, pout] = PRICING[model] ?? PRICING["claude-opus-5-5"];
  const inTok = u.input_tokens + (u.cache_read_input_tokens ?? 0);
  // $/1M tokens == micro-dollars per token. Cache reads billed at ~10%.
  const cost = u.input_tokens * pin + (u.cache_read_input_tokens ?? 0) * pin * 0.1 + u.output_tokens * pout;
  return { provider: "anthropic", model, inputTokens: inTok, outputTokens: u.output_tokens, costUsdMicros: Math.round(cost) };
}

function fileBlock(f: InputFile): Anthropic.Beta.BetaContentBlockParam {
  const data = f.bytes.toString("base64");
  if (f.contentType === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data } };
  }
  const media = (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.contentType) ? f.contentType : "image/jpeg") as
    | "image/jpeg"
    | "image/png"
    | "image/webp"
    | "image/gif";
  return { type: "image", source: { type: "base64", media_type: media, data } };
}

export function anthropicProvider(): AiProvider {
  const client = new Anthropic({ apiKey: env().ANTHROPIC_API_KEY, maxRetries: 2, timeout: 120_000 });
  const model = env().ANTHROPIC_MODEL;
  // Refusal fallbacks are on by default (server picks a fallback model by refusal category).
  const common = { betas: ["server-side-fallback-2026-07-01"] as Anthropic.Beta.AnthropicBeta[], fallbacks: "default" as const };

  return {
    name: "anthropic",
    async extract(files) {
      try {
        const res = await client.beta.messages.parse({
          ...common,
          model,
          max_tokens: 16000,
          output_config: { effort: "medium", format: betaZodOutputFormat(extraction) },
          system: [{ type: "text", text: EXTRACT_SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [
            {
              role: "user",
              content: [...files.map(fileBlock), { type: "text", text: "Transcribe this document. Pages are in order." }],
            },
          ],
        });
        if (res.stop_reason === "refusal") throw new AiError("ai_refused");
        if (!res.parsed_output) throw new AiError("unreadable");
        return { extraction: res.parsed_output, usage: usageOf(model, res.usage) };
      } catch (e) {
        if (e instanceof AiError) throw e;
        if (e instanceof Anthropic.BadRequestError) throw new AiError("unreadable");
        throw new AiError("ai_failed");
      }
    },
    async explain(items, locale) {
      try {
        const res = await client.beta.messages.parse({
          ...common,
          model,
          max_tokens: 16000,
          output_config: { effort: "low", format: betaZodOutputFormat(explainOutput) },
          system: [{ type: "text", text: EXPLAIN_SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [
            {
              role: "user",
              content: `Language: ${LANG[locale]}\n\nItems (JSON data):\n${JSON.stringify(items)}`,
            },
          ],
        });
        if (res.stop_reason === "refusal" || !res.parsed_output) return null;
        return { output: res.parsed_output, usage: usageOf(model, res.usage) };
      } catch {
        // Explanations degrade to the curated template; never block results on the LLM.
        return null;
      }
    },
  };
}
