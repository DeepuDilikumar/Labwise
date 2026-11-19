"use client";
import { Camera, FileText, ScanLine, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { ProcessingSteps } from "@/components/ui/processing-steps";
import { RangeGauge } from "@/components/ui/range-gauge";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/cn";
import { Phone } from "./phone";
import { SectionHeading } from "./section-heading";

const ease = [0.25, 1, 0.5, 1] as const;

function UploadScreen() {
  const t = useTranslations("landing.how");
  return (
    <div className="relative flex h-full flex-col bg-[#101614] px-4 pb-6 pt-12 text-white">
      <p className="text-center text-[0.75rem] text-white/70">{t("screenUpload")}</p>
      <div className="relative mx-auto mt-4 aspect-[3/4] w-full overflow-hidden rounded-[14px] bg-gradient-to-br from-[#e9e6dc] to-[#d9d5c8]">
        {/* paper */}
        <div className="absolute inset-4 rotate-[-2deg] rounded-[6px] bg-white p-3 shadow-lg">
          <div className="h-2 w-16 rounded-full bg-black/70" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-1.5 rounded-full bg-black/25" style={{ width: `${30 + ((i * 17) % 35)}%` }} />
                <div className="h-1.5 w-6 rounded-full bg-black/40" />
              </div>
            ))}
          </div>
        </div>
        {/* edge guide */}
        {[
          "left-2 top-2 border-l-2 border-t-2 rounded-tl-lg",
          "right-2 top-2 border-r-2 border-t-2 rounded-tr-lg",
          "left-2 bottom-2 border-l-2 border-b-2 rounded-bl-lg",
          "right-2 bottom-2 border-r-2 border-b-2 rounded-br-lg",
        ].map((c) => (
          <motion.span
            key={c}
            className={cn("absolute size-7 border-[var(--primary)]", c)}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        ))}
        <ScanLine className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-primary opacity-70" />
      </div>
      <div className="mt-auto flex items-center justify-center gap-6">
        <div className="size-10 rounded-[10px] bg-white/15" />
        <div className="grid size-16 place-items-center rounded-full border-4 border-white/80">
          <div className="size-12 rounded-full bg-white" />
        </div>
        <Camera className="size-6 text-white/70" />
      </div>
    </div>
  );
}

function ProcessingScreen() {
  const t = useTranslations("landing.scene");
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 1100);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex h-full flex-col justify-center px-6">
      <div className="mx-auto mb-8 grid size-16 place-items-center rounded-[20px] bg-primary-soft text-primary-soft-ink">
        <FileText className="size-7" />
      </div>
      <ProcessingSteps steps={[t("step1"), t("step2"), t("step3")]} active={step} />
    </div>
  );
}

function ResultScreen() {
  const t = useTranslations("landing.scene");
  return (
    <div className="space-y-2.5 px-4 pt-12">
      <div className="relative overflow-hidden rounded-[16px] border border-line bg-surface p-4">
        <div className="ambient-glow absolute inset-0" />
        <p className="relative text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-primary">{t("bigPicture")}</p>
        <p className="relative mt-1 font-display text-[1.5rem] leading-[1.1] text-ink">{t("headline")}</p>
        <p className="relative mt-2 text-[0.75rem] leading-snug text-ink-2">{t("b1")}</p>
      </div>
      {[
        { n: "Fasting glucose", v: 108, u: "mg/dL", lo: 70, hi: 100, s: "high" as const, tone: "out" as const },
        { n: "Haemoglobin", v: 13.8, u: "g/dL", lo: 12, hi: 15.5, s: "in_range" as const, tone: "ok" as const },
        { n: "Vitamin B12", v: 412, u: "pg/mL", lo: 200, hi: 900, s: "in_range" as const, tone: "ok" as const },
      ].map((m) => (
        <div key={m.n} className="rounded-[16px] border border-line bg-surface p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[0.75rem] font-semibold text-ink">{m.n}</p>
            <StatusPill size="sm" status={m.s} tone={m.tone} />
          </div>
          <p className="mt-1 text-[1.125rem] font-semibold tabular text-ink">
            {m.v} <span className="text-[0.625rem] font-normal text-ink-3">{m.u}</span>
          </p>
          <RangeGauge className="[&_.text-caption]:text-[0.5625rem]" value={m.v} range={{ low: m.lo, high: m.hi }} tone={m.tone} />
        </div>
      ))}
    </div>
  );
}

const SCREENS = [UploadScreen, ProcessingScreen, ResultScreen];
const ICONS = [Camera, Sparkles, FileText];
const TINTS = ["bg-peach text-peach-ink", "bg-lilac text-lilac-ink", "bg-mint text-mint-ink"];

export function HowItWorks() {
  const t = useTranslations("landing.how");
  const ref = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(2, Math.max(0, Math.floor(v * 3)))));
  const steps = [0, 1, 2].map((i) => ({ title: t(`s${i + 1}Title`), body: t(`s${i + 1}Body`) }));
  const Screen = SCREENS[active];

  return (
    <section id="how" aria-labelledby="how-title" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6">
        <SectionHeading id="how-title" eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
        <div ref={ref} className="relative mt-16 lg:mt-24 lg:grid lg:grid-cols-2 lg:gap-16">
          <ol className="space-y-6 lg:space-y-0">
            {steps.map((s, i) => {
              const Icon = ICONS[i];
              return (
                <li key={i} className="lg:flex lg:min-h-[70vh] lg:items-center">
                  <div
                    data-active={active === i}
                    className="group/step rounded-[var(--radius-2xl)] border border-line bg-surface p-6 shadow-[var(--shadow-sm)] transition-colors duration-300 sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("grid size-12 place-items-center rounded-[16px]", TINTS[i])}>
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="text-small font-semibold tabular text-ink-3">0{i + 1}</span>
                    </div>
                    {/* Inactive steps recede by colour (still AA), never by opacity. */}
                    <h3 className="mt-5 text-h1 font-semibold text-ink text-balance transition-colors lg:group-data-[active=false]/step:text-ink-3">{s.title}</h3>
                    <p className="mt-3 max-w-md text-lead text-ink-2 text-pretty transition-colors lg:group-data-[active=false]/step:text-ink-3">{s.body}</p>
                    <div className="mt-8 flex justify-center lg:hidden">
                      <Phone className="!w-[15rem]">{React.createElement(SCREENS[i])}</Phone>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="hidden lg:block">
            <div className="sticky top-[12vh] flex h-[76vh] items-center justify-center">
              <div aria-hidden className={cn("absolute size-[28rem] rounded-full blur-3xl transition-colors duration-700", ["bg-peach", "bg-lilac", "bg-mint"][active])} />
              <Phone className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    className="h-full"
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -24, scale: 0.98 }}
                    transition={{ duration: 0.35, ease }}
                  >
                    <Screen />
                  </motion.div>
                </AnimatePresence>
              </Phone>
              <div className="absolute -right-2 top-1/2 flex -translate-y-1/2 flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={cn("h-8 w-1.5 rounded-full transition-colors duration-300", i === active ? "bg-primary" : "bg-line-strong")} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
