import "server-only";
import { aiProvider } from "@/server/env";
import { asService } from "@/server/db/client";
import { anthropicProvider } from "./anthropic";
import { localProvider } from "./local";
import type { AiProvider, Usage } from "./types";

export * from "./types";

export function getAi(): AiProvider {
  return aiProvider() === "anthropic" ? anthropicProvider() : localProvider();
}

/** Token/cost logging per report stage. Never stores prompts or outputs. */
export async function logUsage(userId: string, documentId: string, stage: string, u: Usage, cached = false) {
  await asService((sql) =>
    sql.query(
      `insert into public.ai_usage (user_id, document_id, stage, provider, model, input_tokens, output_tokens, cost_usd_micros, cached)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [userId, documentId, stage, u.provider, u.model, u.inputTokens, u.outputTokens, u.costUsdMicros, cached],
    ),
  );
}
