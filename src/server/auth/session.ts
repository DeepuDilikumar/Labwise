import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { env } from "@/server/env";

/**
 * Our own short, signed session cookie. In cloud mode the user id comes from a
 * verified Supabase Auth OTP; in local mode from the dev OTP provider. Either way
 * every DB call runs as that user with Postgres RLS (see db/client.ts asUser).
 */
const COOKIE = "lw_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export interface Session {
  userId: string;
  contact: string;
}

const key = () => new TextEncoder().encode(env().SESSION_SECRET);

export async function createSession(s: Session) {
  const token = await new SignJWT({ contact: s.contact })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { userId: payload.sub, contact: String(payload.contact ?? "") };
  } catch {
    return null;
  }
});

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new AuthError();
  return s;
}

export class AuthError extends Error {
  constructor() {
    super("Not signed in");
  }
}
