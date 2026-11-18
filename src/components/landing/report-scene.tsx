"use client";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { RangeGauge } from "@/components/ui/range-gauge";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/cn";

const ease = [0.25, 1, 0.5, 1] as const;
const ROWS = [
  { w: "w-16", v: "13.8" },
  { w: "w-20", v: "6.1", hot: true },
  { w: "w-12", v: "92" },
  { w: "w-24", v: "2.4" },
  { w: "w-14", v: "182" },
  { w: "w-20", v: "0.9" },
  { w: "w-16", v: "18" },
];

/**
 * A looping, real-component demo: a synthetic report gets scanned, ranges are
 * checked, and plain-language cards appear. Pauses when off-screen.
 */
export function ReportScene({ className }: { className?: string }) {
  const t = useTranslations("landing.scene");
  const [phase, setPhase] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    const durations = [2600, 1900, 6200];
    const id = setTimeout(() => setPhase((p) => (p + 1) % 3), durations[phase]);
    return () => clearTimeout(id);
  }, [phase, visible]);

  return (
    <div ref={ref} className={cn("relative h-full w-full", className)} aria-hidden>
      <div className="flex h-full flex-col px-4 pb-4 pt-11">
        <div className="flex items-center justify-between text-[0.6875rem] text-ink-3">
          <span className="font-semibold text-ink">Labwise</span>
          <span>{t("person")}</span>
        </div>
        <div className="relative mt-3 flex-1">
          <AnimatePresence mode="wait">
            {phase === 0 && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, scale: 0.96, rotate: -1.5 }}
                animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
                exit={{ opacity: 0, scale: 0.94, y: -10 }}
                transition={{ duration: 0.4, ease }}
                className="relative overflow-hidden rounded-[14px] border border-line bg-surface p-3.5 shadow-[var(--shadow-md)]"
              >
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-20 rounded-full bg-ink/80" />
                  <div className="h-2 w-10 rounded-full bg-surface-3" />
                </div>
                <div className="mt-1.5 h-1.5 w-28 rounded-full bg-surface-3" />
                <div className="mt-4 space-y-2.5">
                  {ROWS.map((r, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between rounded-md px-1 py-0.5"
                      initial={{ backgroundColor: "rgba(0,0,0,0)" }}
                      animate={{ backgroundColor: ["rgba(14,124,102,0)", "rgba(14,124,102,0.14)", "rgba(14,124,102,0)"] }}
                      transition={{ duration: 0.6, delay: 0.25 + i * 0.28 }}
                    >
                      <div className={cn("h-1.5 rounded-full bg-ink-3/40", r.w)} />
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[0.6875rem] font-semibold tabular", r.hot ? "text-out" : "text-ink-2")}>{r.v}</span>
                        <div className="h-1.5 w-8 rounded-full bg-surface-3" />
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-primary/25 to-transparent [animation:scan_2.4s_ease-in-out_forwards]" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary shadow-[0_0_12px_2px_var(--primary)] [animation:scan_2.4s_ease-in-out_forwards]" />
              </motion.div>
            )}
            {phase === 1 && (
              <motion.div
                key="steps"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease }}
                className="flex h-full flex-col justify-center gap-3 px-2"
              >
                {[t("step1"), t("step2"), t("step3")].map((s, i) => (
                  <motion.div
                    key={s}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0.35 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.5, duration: 0.3 }}
                  >
                    <motion.span
                      className="grid size-7 place-items-center rounded-full border border-primary text-primary"
                      initial={{ backgroundColor: "rgba(0,0,0,0)" }}
                      animate={{ backgroundColor: "var(--primary)", color: "var(--primary-ink)" }}
                      transition={{ delay: 0.35 + i * 0.5, duration: 0.25 }}
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </motion.span>
                    <span className="text-[0.8125rem] font-medium text-ink">{s}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
            {phase === 2 && (
              <motion.div key="results" className="space-y-2.5" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease }}
                  className="relative overflow-hidden rounded-[16px] border border-line bg-surface p-3.5 shadow-[var(--shadow-sm)]"
                >
                  <div className="ambient-glow absolute inset-0" />
                  <p className="relative text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-primary">{t("bigPicture")}</p>
                  <p className="relative mt-1 font-display text-[1.375rem] leading-[1.1] text-ink">{t("headline")}</p>
                  <div className="relative mt-2 space-y-1">
                    {[t("b1"), t("b2")].map((b, i) => (
                      <motion.p
                        key={b}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.15 }}
                        className="flex gap-1.5 text-[0.6875rem] leading-snug text-ink-2"
                      >
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                        {b}
                      </motion.p>
                    ))}
                  </div>
                </motion.div>
                {[
                  { name: "HbA1c", v: 6.1, unit: "%", low: 4, high: 5.6, status: "high" as const, tone: "out" as const },
                  { name: "TSH", v: 2.4, unit: "µIU/mL", low: 0.4, high: 4, status: "in_range" as const, tone: "ok" as const },
                ].map((m, i) => (
                  <motion.div
                    key={m.name}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.45 + i * 0.18, ease }}
                    className="rounded-[16px] border border-line bg-surface p-3.5 shadow-[var(--shadow-xs)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[0.75rem] font-semibold text-ink">{m.name}</p>
                        <p className="mt-0.5 text-[1.25rem] font-semibold leading-none tracking-tight tabular text-ink">
                          {m.v} <span className="text-[0.625rem] font-normal text-ink-3">{m.unit}</span>
                        </p>
                      </div>
                      <StatusPill size="sm" status={m.status} tone={m.tone} />
                    </div>
                    <RangeGauge className="mt-1 [&_.text-caption]:text-[0.5625rem]" value={m.v} range={{ low: m.low, high: m.high }} tone={m.tone} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
