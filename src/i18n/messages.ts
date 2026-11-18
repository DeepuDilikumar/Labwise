import type { Locale, RegionConfig } from "@regions";

type Messages = Record<string, unknown>;

function deepMerge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = v && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object" ? deepMerge(out[k] as Messages, v as Messages) : v;
  }
  return out;
}

function setPath(obj: Messages, dotted: string, value: string) {
  const parts = dotted.split(".");
  let cur = obj;
  for (const p of parts.slice(0, -1)) cur = (cur[p] = { ...((cur[p] as Messages) ?? {}) }) as Messages;
  cur[parts[parts.length - 1]] = value;
}

/**
 * English is the source of truth. Other languages are merged on top of it, so a
 * missing translation degrades to English instead of a raw key. Region copy
 * overrides are applied last.
 */
export async function loadMessages(locale: Locale, region: RegionConfig): Promise<Messages> {
  const en = (await import("../../messages/en.json")).default as Messages;
  let messages = en;
  if (locale !== "en") {
    const local = (await import(`../../messages/${locale}.json`)).default as Messages;
    messages = deepMerge(en, local);
  }
  messages = structuredClone(messages);
  for (const [k, v] of Object.entries(region.copyOverrides[locale] ?? {})) setPath(messages, k, v);
  return messages;
}
