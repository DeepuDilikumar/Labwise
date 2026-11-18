"use client";
import { Cpu, Info } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { RangeGauge } from "@/components/ui/range-gauge";
import { Segmented } from "@/components/ui/segmented";
import { StatusPill } from "@/components/ui/status-pill";
import { toneFor } from "@/lib/domain/gauge";
import { directionOf } from "@/lib/domain/status";
import { cn } from "@/lib/cn";
import { computeStatus } from "@/lib/status/compute";
import { SectionHeading } from "./section-heading";

/** Synthetic demo markers. Ranges are typical printed examples; each lab prints its own. */
const MARKERS = {
  glucose: { name: "Fasting glucose", unit: "mg/dL", low: 70, high: 100, min: 50, max: 160, step: 1, start: 108, decimals: 0, si: { unit: "mmol/L", factor: 1 / 18.016 } },
  hb: { name: "Haemoglobin", unit: "g/dL", low: 12, high: 15.5, min: 8, max: 18, step: 0.1, start: 11.4, decimals: 1, si: { unit: "g/L", factor: 10 } },
  tsh: { name: "TSH", unit: "µIU/mL", low: 0.4, high: 4, min: 0.05, max: 8, step: 0.05, start: 2.4, decimals: 2, si: null },
} as const;
type Key = keyof typeof MARKERS;

export function Playground() {
  const t = useTranslations("landing.play");
  const [key, setKey] = React.useState<Key>("glucose");
  const m = MARKERS[key];
  const [value, setValue] = React.useState<number>(m.start);
  const [si, setSi] = React.useState(false);

  const status = computeStatus({ value, low: m.low, high: m.high });
  const tone = toneFor(status, value, { low: m.low, high: m.high });
  const dir = directionOf(status);
  const f = si && m.si ? m.si.factor : 1;
  const d = si && m.si ? (m.si.factor < 1 ? 1 : 0) : m.decimals;
  const fmt = (n: number) => (n * f).toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
  const unit = si && m.si ? m.si.unit : m.unit;
  const msgKey = status === "in_range" ? "inRange" : dir === "high" ? "high" : "low";

  return (
    <section id="try" aria-labelledby="try-title" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6">
        <SectionHeading id="try-title" eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="relative mx-auto mt-14 max-w-3xl"
        >
          <div aria-hidden className="absolute -inset-y-6 inset-x-0 rounded-[3rem] sm:-inset-6 bg-[conic-gradient(from_90deg,var(--mint),var(--sky),var(--lilac),var(--peach),var(--mint))] opacity-70 blur-2xl" />
          <div className="relative rounded-[var(--radius-2xl)] border border-line bg-surface p-5 shadow-[var(--shadow-lg)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented
                label={t("pickMarker")}
                value={key}
                onChange={(k) => {
                  setKey(k);
                  setValue(MARKERS[k].start);
                }}
                options={(Object.keys(MARKERS) as Key[]).map((k) => ({ value: k, label: MARKERS[k].name }))}
                className="max-w-full overflow-x-auto no-scrollbar"
              />
              {m.si && (
                <Segmented
                  label={t("units")}
                  value={si ? "si" : "conv"}
                  onChange={(v) => setSi(v === "si")}
                  options={[
                    { value: "conv", label: m.unit },
                    { value: "si", label: m.si.unit },
                  ]}
                />
              )}
            </div>

            <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_1.1fr] sm:items-center">
              <div>
                <p className="text-small text-ink-3">{m.name}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <motion.span key={`${key}-${si}`} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="text-[3.5rem] font-semibold leading-none tracking-[-0.04em] tabular text-ink">
                    {fmt(value)}
                  </motion.span>
                  <span className="text-body text-ink-3">{unit}</span>
                </div>
                <div className="mt-4 h-7">
                  <AnimatePresence mode="wait">
                    <motion.div key={status + tone} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                      <StatusPill status={status} tone={tone} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              <div>
                <RangeGauge
                  value={value}
                  range={{ low: m.low, high: m.high }}
                  tone={tone}
                  lowLabel={fmt(m.low)}
                  highLabel={fmt(m.high)}
                  unit={unit}
                  animate={false}
                />
                <label htmlFor="pg-slider" className="sr-only">
                  {t("sliderLabel", { name: m.name })}
                </label>
                <input
                  id="pg-slider"
                  type="range"
                  min={m.min}
                  max={m.max}
                  step={m.step}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="mt-5 h-11 w-full cursor-grab accent-[var(--primary)] active:cursor-grabbing"
                  aria-valuetext={`${fmt(value)} ${unit}`}
                />
                <p className="text-center text-caption text-ink-3">{t("drag")}</p>
              </div>
            </div>

            <div className={cn("mt-6 flex gap-3 rounded-[14px] p-4 transition-colors duration-300", status === "in_range" ? "bg-ok-soft" : tone === "borderline" ? "bg-warn-soft" : "bg-out-soft")}>
              <Info className="mt-0.5 size-4 shrink-0 text-ink-2" aria-hidden />
              <p className="text-small text-ink-2 text-pretty" aria-live="polite">
                {t(`explain.${msgKey}`, { name: m.name, low: fmt(m.low), high: fmt(m.high), unit })}
              </p>
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 text-caption text-ink-3">
              <Cpu className="size-3.5" aria-hidden /> {t("engineNote")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
