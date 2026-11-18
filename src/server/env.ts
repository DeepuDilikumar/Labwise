import "server-only";
import { z } from "zod";

/**
 * Server environment. LABWISE_MODE=local runs every flow with zero third-party
 * keys (PGlite, encrypted disk storage, dev OTP, fixture AI, fake payments).
 * LABWISE_MODE=cloud uses Supabase, Anthropic and Razorpay.
 */
const schema = z.object({
  LABWISE_MODE: z.enum(["local", "cloud"]).default("local"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(32).default("dev-only-insecure-session-secret-change-me-please"),
  STORAGE_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "32-byte hex key")
    .default("0".repeat(63) + "1"),
  LOCAL_DATA_DIR: z.string().default(".data"),

  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("documents"),

  AI_PROVIDER: z.enum(["anthropic", "local"]).optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5-5"),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  ADMIN_EMAILS: z.string().default(""),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;
export function env(): Env {
  if (!cached) {
    const parsed = schema.parse(process.env);
    if (parsed.LABWISE_MODE === "cloud") {
      const missing = (["DATABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const).filter(
        (k) => !parsed[k],
      );
      if (missing.length) throw new Error(`LABWISE_MODE=cloud requires: ${missing.join(", ")}`);
      if (parsed.SESSION_SECRET.startsWith("dev-only")) throw new Error("Set SESSION_SECRET in cloud mode");
    }
    cached = parsed;
  }
  return cached;
}

export const isLocal = () => env().LABWISE_MODE === "local";

/** AI runs on Anthropic only when a key is present (or explicitly forced). */
export function aiProvider(): "anthropic" | "local" {
  const e = env();
  if (e.AI_PROVIDER) return e.AI_PROVIDER;
  return e.ANTHROPIC_API_KEY ? "anthropic" : "local";
}
