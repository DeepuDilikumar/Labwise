import { z } from "zod";
import type { Locale } from "@regions";
import type { Extraction } from "@/lib/domain/extraction";

export interface InputFile {
  bytes: Buffer;
  contentType: string;
}

export interface Usage {
  provider: "anthropic" | "local";
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsdMicros: number;
}

/** What the explainer receives: no names, no IDs — only test names, values and the curated text. */
export interface ExplainItem {
  key: string;
  name: string;
  valueLabel: string;
  unit: string | null;
  rangeLabel: string | null;
  status: string;
  knowledge: { description: string; reasons: string[]; questions: string[] } | null;
}

export const explainOutput = z.object({
  markers: z.array(
    z.object({
      key: z.string(),
      measures: z.string().max(600),
      reasons: z.array(z.string().max(240)).max(4),
      questions: z.array(z.string().max(240)).max(3),
    }),
  ),
});
export type ExplainOutput = z.infer<typeof explainOutput>;

export interface AiProvider {
  name: "anthropic" | "local";
  extract(files: InputFile[], fileHash: string): Promise<{ extraction: Extraction; usage: Usage }>;
  explain(items: ExplainItem[], locale: Locale): Promise<{ output: ExplainOutput; usage: Usage } | null>;
}

export class AiError extends Error {
  constructor(public code: "ai_unavailable" | "ai_refused" | "ai_failed" | "unreadable") {
    super(code);
  }
}
