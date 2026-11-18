"use client";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { gaugeGeometry, type Range } from "@/lib/domain/gauge";
import type { Tone } from "@/lib/domain/status";
import { toneClasses } from "./status-pill";

interface Props {
  value: number;
  range: Range;
  tone: Tone;
  /** Formatted bounds as printed on the report, e.g. "70" / "100". */
  lowLabel?: string;
  highLabel?: string;
  unit?: string;
  className?: string;
  animate?: boolean;
}

/**
 * Horizontal gauge: shaded band = the lab's printed reference range,
 * dot = this value. Animates in once; respects reduced motion.
 */
export function RangeGauge({ value, range, tone, lowLabel, highLabel, unit, className, animate = true }: Props) {
  const t = useTranslations("gauge");
  const g = gaugeGeometry(value, range);
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
  const run = animate;
  const ariaRange =
    range.low != null && range.high != null
      ? t("ariaBetween", { low: lowLabel ?? String(range.low), high: highLabel ?? String(range.high), unit: unit ?? "" })
      : range.high != null
        ? t("ariaBelow", { high: highLabel ?? String(range.high), unit: unit ?? "" })
        : t("ariaAbove", { low: lowLabel ?? String(range.low), unit: unit ?? "" });

  return (
    <div className={cn("w-full", className)} role="img" aria-label={ariaRange}>
      <div className="relative h-8">
        {/* track */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-3" />
        {/* reference band */}
        <motion.div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ok/35 dark:bg-ok/40"
          style={{ left: pct(g.bandStart), width: pct(g.bandEnd - g.bandStart) }}
          initial={run ? { opacity: 0, scaleX: 0.6 } : false}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        />
        {/* band edges */}
        {range.low != null && <span className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ok/60" style={{ left: pct(g.bandStart) }} />}
        {range.high != null && <span className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ok/60" style={{ left: pct(g.bandEnd) }} />}
        {/* value marker */}
        {/* Full-width layer translated by a % of the track, so the motion is a transform. */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={run ? { x: pct(g.bandStart + (g.bandEnd - g.bandStart) / 2) } : false}
          animate={{ x: pct(g.value) }}
          transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1], delay: run ? 0.12 : 0 }}
        >
          <span
            className={cn(
              "absolute left-0 top-1/2 block size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface shadow-[var(--shadow-sm)]",
              toneClasses[tone].dot,
            )}
          />
        </motion.div>
      </div>
      <div className="relative h-4 text-caption tabular text-ink-3">
        {range.low != null && (
          <span className="absolute -translate-x-1/2" style={{ left: pct(g.bandStart) }}>
            {lowLabel ?? range.low}
          </span>
        )}
        {range.high != null && (
          <span className="absolute -translate-x-1/2" style={{ left: pct(g.bandEnd) }}>
            {highLabel ?? range.high}
          </span>
        )}
      </div>
    </div>
  );
}
