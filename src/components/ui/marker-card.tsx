"use client";
import { BookOpen, ChevronDown, HelpCircle, MessageCircleQuestion, PencilLine } from "lucide-react";
import * as React from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { Range } from "@/lib/domain/gauge";
import { directionOf, type MarkerStatus, type Tone } from "@/lib/domain/status";
import { Disclosure } from "./disclosure";
import { RangeGauge } from "./range-gauge";
import { StatusPill } from "./status-pill";

export interface MarkerCardData {
  id: string;
  name: string;
  /** Value as displayed (already formatted in the chosen unit system). */
  valueLabel: string;
  value: number | null;
  unit?: string | null;
  status: MarkerStatus;
  tone: Tone;
  range: Range;
  rangeLabel?: string | null;
  lowLabel?: string;
  highLabel?: string;
  labFlag?: string | null;
  edited?: boolean;
  explanation?: {
    measures: string;
    reasons?: string[];
    questions: string[];
  };
}

export function MarkerCard({ data, index = 0, className, compact = false }: { data: MarkerCardData; index?: number; className?: string; compact?: boolean }) {
  const t = useTranslations("marker");
  const [open, setOpen] = React.useState(!compact);
  if (!open) {
    // Compact row for in-range results: calm, scannable, one tap to expand.
    return (
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: Math.min(index, 6) * 0.03 }}
        aria-expanded={false}
        className={cn(
          "flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-surface px-4 py-3.5 text-left transition-colors hover:bg-surface-2",
          className,
        )}
      >
        <span className="min-w-0 flex-1 font-medium leading-snug text-ink text-pretty">{data.name}</span>
        <span className="shrink-0 text-small font-semibold tabular text-ink">
          {data.valueLabel} <span className="font-normal text-ink-3">{data.unit}</span>
        </span>
        <StatusPill size="sm" status={data.status} tone={data.tone} />
        <ChevronDown className="size-4 shrink-0 text-ink-3" aria-hidden />
        <span className="sr-only">{t("showDetails")}</span>
      </motion.button>
    );
  }
  const dir = directionOf(data.status);
  const hasGauge = data.value != null && (data.range.low != null || data.range.high != null);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.04, ease: [0.25, 1, 0.5, 1] }}
      className={cn("rounded-[var(--radius-xl)] border border-line bg-surface p-5 shadow-[var(--shadow-xs)] sm:p-6", className)}
      aria-labelledby={`m-${data.id}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`m-${data.id}`} className="text-h3 font-semibold text-ink">
            {data.name}
          </h3>
          {data.edited && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-caption text-ink-3">
              <PencilLine className="size-3" aria-hidden /> {t("editedByYou")}
            </p>
          )}
        </div>
        <StatusPill status={data.status} tone={data.tone} />
      </header>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-value font-semibold tabular text-ink">{data.valueLabel}</span>
        {data.unit && <span className="text-small text-ink-3">{data.unit}</span>}
      </div>

      {hasGauge ? (
        <RangeGauge
          className="mt-4"
          value={data.value!}
          range={data.range}
          tone={data.tone}
          lowLabel={data.lowLabel}
          highLabel={data.highLabel}
          unit={data.unit ?? undefined}
        />
      ) : null}

      <p className="mt-2 text-small text-ink-3">
        {data.status === "no_range"
          ? t("noRange")
          : data.rangeLabel
            ? t("yourLabRange", { range: data.rangeLabel })
            : null}
        {data.labFlag && <span className="ml-1.5">· {t("labFlag", { flag: data.labFlag })}</span>}
      </p>

      {data.explanation && (
        <div className="mt-4">
          <Disclosure title={t("whatItMeasures")} icon={<BookOpen />}>
            <p className="text-pretty">{data.explanation.measures}</p>
          </Disclosure>
          {dir && data.explanation.reasons && data.explanation.reasons.length > 0 && (
            <Disclosure title={dir === "high" ? t("reasonsHigh") : t("reasonsLow")} icon={<HelpCircle />}>
              <ul className="space-y-1.5">
                {data.explanation.reasons.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-ink-3" />
                    <span className="text-pretty">{r}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-caption text-ink-3">{t("reasonsNote")}</p>
            </Disclosure>
          )}
          <Disclosure title={t("questions")} icon={<MessageCircleQuestion />}>
            <ul className="space-y-2">
              {data.explanation.questions.map((q) => (
                <li key={q} className="rounded-[10px] bg-surface-2 px-3 py-2 text-ink text-pretty">
                  “{q}”
                </li>
              ))}
            </ul>
          </Disclosure>
        </div>
      )}
    </motion.article>
  );
}
