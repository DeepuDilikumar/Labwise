import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { extraction, type Extraction } from "@/lib/domain/extraction";
import { AiError, type AiProvider } from "./types";

/**
 * Zero-key provider. Recognises the bundled synthetic fixtures by file hash and returns
 * their ground truth, so the whole pipeline (validation, units, status, explanations,
 * trends, sharing) runs for real without an AI key. Anything else → "ai_unavailable",
 * which the UI explains honestly (and offers the sample report).
 */
type Manifest = Record<string, { id: string; file: string; contentType: string; kind: string; truth: Extraction }>;
let manifest: Manifest | null = null;

export async function loadManifest(): Promise<Manifest> {
  if (!manifest) {
    manifest = JSON.parse(await readFile(path.join(process.cwd(), "fixtures/golden/manifest.json"), "utf8")) as Manifest;
  }
  return manifest;
}

export async function fixtureFile(id: string) {
  const m = await loadManifest();
  const entry = Object.values(m).find((e) => e.id === id);
  if (!entry) throw new Error("unknown fixture");
  return { bytes: await readFile(path.join(process.cwd(), "fixtures/golden", entry.file)), contentType: entry.contentType, entry };
}

export function localProvider(): AiProvider {
  return {
    name: "local",
    async extract(files) {
      const m = await loadManifest();
      for (const f of files) {
        const hit = m[createHash("sha256").update(f.bytes).digest("hex")];
        if (hit) {
          return {
            extraction: extraction.parse(hit.truth),
            usage: { provider: "local", model: "fixture", inputTokens: 0, outputTokens: 0, costUsdMicros: 0 },
          };
        }
      }
      throw new AiError("ai_unavailable");
    },
    async explain() {
      return null; // pipeline falls back to the curated template explainer
    },
  };
}
