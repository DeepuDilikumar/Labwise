import { AlertTriangle, ArrowDown, ArrowUp, Check } from "lucide-react";
import * as React from "react";

export interface ShareCardData {
  headline: string;
  meta: string;
  counts: { label: string; value: number }[];
  items: { name: string; value: string; status: string; tone: "ok" | "borderline" | "out" | "critical" | "neutral"; dir: "high" | "low" | null }[];
  moreLabel: string | null;
  disclaimer: string;
  watermark: string;
  eyebrow: string;
}

const TONE: Record<ShareCardData["items"][number]["tone"], [string, string]> = {
  ok: ["#e7f3eb", "#1d6f47"],
  borderline: ["#fbf1dc", "#855400"],
  out: ["#fbebe6", "#ad3f2b"],
  critical: ["#f9e2e4", "#9c1726"],
  neutral: ["#f3f3ee", "#3d4945"],
};

/**
 * 1080×1350 share image, drawn with fixed light colours (independent of the viewer's theme)
 * and rendered to PNG in the browser so Hindi and Malayalam shape correctly.
 */
export const ShareCard = React.forwardRef<HTMLDivElement, { data: ShareCardData }>(function ShareCard({ data }, ref) {
  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 1350, background: "#fafaf7", color: "#0f1a17", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden", padding: 80, boxSizing: "border-box" }}
    >
      <div style={{ position: "absolute", top: -220, right: -180, width: 720, height: 720, borderRadius: 9999, background: "radial-gradient(circle, rgba(14,124,102,0.18), transparent 65%)" }} />
      <div style={{ position: "absolute", bottom: -260, left: -200, width: 760, height: 760, borderRadius: 9999, background: "radial-gradient(circle, rgba(255,160,110,0.16), transparent 65%)" }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
        <svg width="56" height="56" viewBox="0 0 28 28">
          <rect x="1" y="1" width="26" height="26" rx="8" fill="#0e7c66" />
          <path d="M6.5 14h15" stroke="white" strokeOpacity="0.35" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M10 14h8" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="15.5" cy="14" r="3.4" fill="#0e7c66" stroke="white" strokeWidth="2.2" />
        </svg>
        <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>Labwise</span>
      </div>
      <p style={{ position: "relative", marginTop: 64, fontSize: 26, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0e7c66" }}>{data.eyebrow}</p>
      <h1 style={{ position: "relative", marginTop: 14, fontFamily: "var(--font-display)", fontSize: 88, lineHeight: 1.05, fontWeight: 400 }}>{data.headline}</h1>
      <p style={{ position: "relative", marginTop: 18, fontSize: 28, color: "#5f6b67" }}>{data.meta}</p>
      <div style={{ position: "relative", marginTop: 48, display: "flex", gap: 20 }}>
        {data.counts.map((c) => (
          <div key={c.label} style={{ flex: 1, background: "#fff", border: "2px solid #e7e7e0", borderRadius: 28, padding: "26px 28px" }}>
            <div style={{ fontSize: 64, fontWeight: 600, letterSpacing: "-0.03em" }}>{c.value}</div>
            <div style={{ marginTop: 4, fontSize: 24, color: "#5f6b67" }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
        {data.items.map((i) => {
          const [bg, fg] = TONE[i.tone];
          const Icon = i.tone === "critical" ? AlertTriangle : i.tone === "ok" ? Check : i.dir === "high" ? ArrowUp : ArrowDown;
          return (
            <div key={i.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "2px solid #e7e7e0", borderRadius: 24, padding: "22px 28px" }}>
              <span style={{ fontSize: 30, fontWeight: 600 }}>{i.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <span style={{ fontSize: 30, fontWeight: 600 }}>{i.value}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: bg, color: fg, borderRadius: 999, padding: "8px 18px", fontSize: 24, fontWeight: 600 }}>
                  <Icon size={22} strokeWidth={2.6} /> {i.status}
                </span>
              </span>
            </div>
          );
        })}
        {data.moreLabel && <p style={{ fontSize: 24, color: "#5f6b67", paddingLeft: 8 }}>{data.moreLabel}</p>}
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 70 }}>
        <p style={{ fontSize: 24, color: "#3d4945", lineHeight: 1.45 }}>{data.disclaimer}</p>
        <p style={{ marginTop: 14, fontSize: 22, color: "#5f6b67" }}>{data.watermark}</p>
      </div>
    </div>
  );
});
