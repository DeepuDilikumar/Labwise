"use client";
import { AlertTriangle, ArrowDown, ArrowUp, Check, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { directionOf, type MarkerStatus, type Tone } from "@/lib/domain/status";
import { statusLabelKey } from "@/lib/domain/status-label";

export { statusLabelKey };

export const toneClasses: Record<Tone, { pill: string; text: string; soft: string; dot: string; line: string }> = {
  ok: { pill: "bg-ok-soft text-ok border-ok-line", text: "text-ok", soft: "bg-ok-soft", dot: "bg-ok", line: "border-ok-line" },
  borderline: { pill: "bg-warn-soft text-warn border-warn-line", text: "text-warn", soft: "bg-warn-soft", dot: "bg-warn", line: "border-warn-line" },
  out: { pill: "bg-out-soft text-out border-out-line", text: "text-out", soft: "bg-out-soft", dot: "bg-out", line: "border-out-line" },
  critical: { pill: "bg-crit-soft text-crit border-crit-line", text: "text-crit", soft: "bg-crit-soft", dot: "bg-crit", line: "border-crit-line" },
  neutral: { pill: "bg-surface-2 text-ink-2 border-line", text: "text-ink-2", soft: "bg-surface-2", dot: "bg-ink-3", line: "border-line" },
};


interface Props {
  status: MarkerStatus;
  tone: Tone;
  size?: "sm" | "md";
  className?: string;
}

/** Status is always icon + label + colour — never colour alone. */
export function StatusPill({ status, tone, size = "md", className }: Props) {
  const t = useTranslations("status");
  const dir = directionOf(status);
  const Icon = tone === "critical" ? AlertTriangle : tone === "ok" ? Check : dir === "high" ? ArrowUp : dir === "low" ? ArrowDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "h-6 px-2 text-caption" : "h-7 px-2.5 text-small",
        toneClasses[tone].pill,
        className,
      )}
    >
      <Icon aria-hidden className={size === "sm" ? "size-3" : "size-3.5"} strokeWidth={2.4} />
      {t(statusLabelKey(status, tone))}
    </span>
  );
}
