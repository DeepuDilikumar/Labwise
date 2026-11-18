import type { MarkerStatus, Tone } from "./status";

/** Message key under "status.*" for a status/tone pair. Shared by server and client. */
export function statusLabelKey(status: MarkerStatus, tone: Tone): string {
  if (status === "low" || status === "high") return tone === "borderline" ? `slightly_${status}` : status;
  return status;
}
