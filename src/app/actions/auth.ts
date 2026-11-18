"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getRegion } from "@regions";
import { otpProvider, type Channel } from "@/server/auth/otp";
import { createSession, destroySession } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { getPrefs } from "@/server/prefs";
import { allow } from "@/lib/rate-limit";

export type AuthResult = { ok: true; target: string; devCode?: string } | { ok: false; error: string };

async function normalise(channel: Channel, raw: string): Promise<string | null> {
  if (channel === "email") {
    const r = z.string().trim().toLowerCase().email().max(254).safeParse(raw);
    return r.success ? r.data : null;
  }
  const region = getRegion((await getPrefs()).region);
  const digits = raw.replace(/[^\d]/g, "").replace(new RegExp(`^${region.phone.countryCode.slice(1)}`), "");
  return region.phone.pattern.test(digits) ? `${region.phone.countryCode}${digits}` : null;
}

export async function sendCode(channel: Channel, raw: string): Promise<AuthResult> {
  const target = await normalise(channel, raw);
  if (!target) return { ok: false, error: channel === "phone" ? "invalidPhone" : "invalidEmail" };
  if (!allow(`send:${target}`, 3, 60_000) || !allow(`send-h:${target}`, 10, 3_600_000)) return { ok: false, error: "tooMany" };
  try {
    const { devCode } = await otpProvider().send(channel, target);
    return { ok: true, target, devCode };
  } catch {
    return { ok: false, error: "sendFailed" };
  }
}

export async function verifyCode(channel: Channel, target: string, code: string, next?: string): Promise<{ ok: false; error: string }> {
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "invalidCode" };
  if (!allow(`verify:${target}`, 8, 10 * 60_000)) return { ok: false, error: "tooMany" };
  const userId = await otpProvider().verify(channel, target, code);
  if (!userId) return { ok: false, error: "invalidCode" };
  await createSession({ userId, contact: target });
  await audit(userId, "auth.sign_in");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
  redirect(safeNext);
}

export async function signOut() {
  await destroySession();
  redirect("/");
}
