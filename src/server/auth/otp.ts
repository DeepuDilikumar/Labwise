import "server-only";
import { createHash, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { asService } from "@/server/db/client";
import { env, isLocal } from "@/server/env";

export type Channel = "phone" | "email";

export interface OtpProvider {
  /** Returns devCode only in local mode, so the UI can show it. */
  send(channel: Channel, target: string): Promise<{ devCode?: string }>;
  /** Returns the auth user id on success. */
  verify(channel: Channel, target: string, code: string): Promise<string | null>;
}

// ---------- local (dev) provider ----------
interface Pending {
  hash: Buffer;
  expires: number;
  attempts: number;
}
const g = globalThis as unknown as { __lwOtp?: Map<string, Pending> };
const pending = (g.__lwOtp ??= new Map());
const hash = (s: string) => createHash("sha256").update(s).digest();

const localProvider: OtpProvider = {
  async send(channel, target) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    pending.set(`${channel}:${target}`, { hash: hash(code), expires: Date.now() + 10 * 60_000, attempts: 0 });
    return { devCode: code };
  },
  async verify(channel, target, code) {
    const k = `${channel}:${target}`;
    const p = pending.get(k);
    if (!p || p.expires < Date.now() || p.attempts >= 5) return null;
    p.attempts++;
    if (!timingSafeEqual(p.hash, hash(code))) return null;
    pending.delete(k);
    return asService(async (sql) => {
      const col = channel === "phone" ? "phone" : "email";
      const existing = await sql.query<{ id: string }>(`select id from auth.users where ${col} = $1`, [target]);
      if (existing[0]) return existing[0].id;
      const id = randomUUID();
      await sql.query(`insert into auth.users (id, ${col}) values ($1, $2)`, [id, target]);
      return id;
    });
  },
};

// ---------- Supabase Auth provider ----------
async function supabase() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(env().NEXT_PUBLIC_SUPABASE_URL!, env().NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
const supabaseProvider: OtpProvider = {
  async send(channel, target) {
    const sb = await supabase();
    const { error } = channel === "phone" ? await sb.auth.signInWithOtp({ phone: target }) : await sb.auth.signInWithOtp({ email: target });
    if (error) throw new Error("otp_send_failed");
    return {};
  },
  async verify(channel, target, code) {
    const sb = await supabase();
    const { data, error } =
      channel === "phone"
        ? await sb.auth.verifyOtp({ phone: target, token: code, type: "sms" })
        : await sb.auth.verifyOtp({ email: target, token: code, type: "email" });
    if (error || !data.user) return null;
    return data.user.id;
  },
};

export const otpProvider = (): OtpProvider => (isLocal() ? localProvider : supabaseProvider);
