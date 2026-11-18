/** Tiny in-memory sliding-window limiter for unauthenticated endpoints (OTP). */
const g = globalThis as unknown as { __lwRl?: Map<string, number[]> };
const hits: Map<string, number[]> = (g.__lwRl ??= new Map());

export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  return true;
}
