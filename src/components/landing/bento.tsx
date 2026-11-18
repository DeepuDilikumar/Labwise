"use client";
import { Lock, MapPin, Share2, Trash2, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/cn";
import { SectionHeading } from "./section-heading";

const ease = [0.25, 1, 0.5, 1] as const;

function Tile({ className, children, delay = 0 }: { className?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease }}
      whileHover={{ y: -4 }}
      className={cn("group relative overflow-hidden rounded-[var(--radius-2xl)] p-6 sm:p-8", className)}
    >
      {children}
    </motion.div>
  );
}

function TrendArt() {
  const pts = [[0, 12], [60, 20], [120, 34], [180, 30], [240, 42], [300, 46]];
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <svg viewBox="-8 0 316 70" className="mt-8 w-full" aria-hidden>
      <rect x="-8" y="26" width="316" height="30" rx="6" className="fill-mint-ink/10" />
      <motion.path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: "easeInOut", delay: 0.2 }}
      />
      {pts.map(([x, y], i) => (
        <motion.circle
          key={x}
          cx={x}
          cy={y}
          r="4.5"
          className={y < 26 || y > 56 ? "fill-[var(--out)]" : "fill-[var(--ok)]"}
          stroke="var(--mint)"
          strokeWidth="2"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.25, type: "spring", stiffness: 300 }}
        />
      ))}
    </svg>
  );
}

function LanguageArt({ lines }: { lines: { lang: string; text: string }[] }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % lines.length), 2400);
    return () => clearInterval(id);
  }, [lines.length]);
  return (
    <div className="mt-6 h-24 rounded-[16px] bg-surface/70 p-4 backdrop-blur">
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          lang={lines[i].lang}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.35 }}
          className="text-body font-medium text-ink"
        >
          {lines[i].text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function DeleteArt({ label, done }: { label: string; done: string }) {
  const [state, setState] = React.useState<"idle" | "run" | "done">("idle");
  React.useEffect(() => {
    const seq = { idle: 1800, run: 1400, done: 2000 }[state];
    const id = setTimeout(() => setState((s) => (s === "idle" ? "run" : s === "run" ? "done" : "idle")), seq);
    return () => clearTimeout(id);
  }, [state]);
  return (
    <div className="mt-6 rounded-[16px] border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-crit-soft text-crit">
          <Trash2 className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-small font-medium text-ink">{state === "done" ? done : label}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: state === "idle" ? "0%" : "100%" }}
              transition={{ duration: state === "run" ? 1.3 : 0.2, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Bento() {
  const t = useTranslations("landing.bento");
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6">
        <SectionHeading id="features-title" eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Tile className="bg-mint text-mint-ink md:col-span-4">
            <p className="text-small font-semibold">{t("trendsKicker")}</p>
            <h3 className="mt-2 max-w-md font-display text-[2rem] leading-[1.1] text-ink">{t("trendsTitle")}</h3>
            <p className="mt-2 max-w-md text-body text-ink-2">{t("trendsBody")}</p>
            <TrendArt />
          </Tile>
          <Tile className="bg-peach text-peach-ink md:col-span-2" delay={0.08}>
            <Users className="size-6" aria-hidden />
            <h3 className="mt-4 text-h2 font-semibold text-ink">{t("familyTitle")}</h3>
            <p className="mt-2 text-body text-ink-2">{t("familyBody")}</p>
            <div className="mt-6 flex -space-x-3">
              {[["bg-primary", "Y"], ["bg-[hsl(24_80%_55%)]", "M"], ["bg-[hsl(250_60%_60%)]", "F"], ["bg-[hsl(200_70%_45%)]", "+"]].map(([c, l], i) => (
                <motion.span
                  key={l}
                  initial={{ x: -16, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 260, damping: 20 }}
                  className={cn("grid size-12 place-items-center rounded-full border-[3px] border-peach text-body font-semibold text-white transition-transform group-hover:-translate-y-1", c)}
                  style={{ transitionDelay: `${i * 40}ms` }}
                  aria-hidden
                >
                  {l}
                </motion.span>
              ))}
            </div>
          </Tile>
          <Tile className="bg-sky text-sky-ink md:col-span-2" delay={0.04}>
            <p className="text-small font-semibold">{t("langKicker")}</p>
            <h3 className="mt-2 text-h2 font-semibold text-ink">{t("langTitle")}</h3>
            <LanguageArt
              lines={[
                { lang: "en", text: "Your thyroid result is within your lab's range." },
                { lang: "hi", text: "आपका थायरॉइड रिज़ल्ट आपकी लैब की सीमा में है।" },
                { lang: "ml", text: "നിങ്ങളുടെ തൈറോയ്ഡ് ഫലം ലാബിന്റെ പരിധിക്കുള്ളിലാണ്." },
              ]}
            />
          </Tile>
          <Tile className="bg-lilac text-lilac-ink md:col-span-2" delay={0.08}>
            <MapPin className="size-6" aria-hidden />
            <h3 className="mt-4 text-h2 font-semibold text-ink">{t("whoTitle")}</h3>
            <p className="mt-2 text-body text-ink-2">{t("whoBody")}</p>
            <ul className="mt-5 space-y-2">
              {[t("who1"), t("who2")].map((s, i) => (
                <li key={s} className="flex items-center gap-2.5 rounded-[12px] bg-surface/80 px-3 py-2.5 text-small font-medium text-ink">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full rounded-full bg-lilac-ink animate-ping-soft" style={{ animationDelay: `${i * 0.6}s` }} />
                    <span className="relative inline-flex size-2.5 rounded-full bg-lilac-ink" />
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </Tile>
          <Tile className="bg-sun text-sun-ink md:col-span-2" delay={0.12}>
            <Share2 className="size-6" aria-hidden />
            <h3 className="mt-4 text-h2 font-semibold text-ink">{t("shareTitle")}</h3>
            <p className="mt-2 text-body text-ink-2">{t("shareBody")}</p>
            <div className="relative mt-6 h-24">
              {[2, 1, 0].map((i) => (
                <div
                  key={i}
                  className="absolute inset-x-4 top-0 h-20 rounded-[14px] border border-line bg-surface p-3 shadow-[var(--shadow-md)] transition-transform duration-500 ease-out group-hover:rotate-0"
                  style={{ transform: `translateY(${i * 8}px) rotate(${(i - 1) * 4}deg) scale(${1 - i * 0.04})` }}
                >
                  <div className="h-2 w-16 rounded-full bg-primary/70" />
                  <div className="mt-2 h-1.5 w-32 rounded-full bg-surface-3" />
                  <div className="mt-1.5 h-1.5 w-24 rounded-full bg-surface-3" />
                </div>
              ))}
            </div>
          </Tile>
          <Tile className="border border-line bg-surface md:col-span-6 lg:col-span-6" delay={0.06}>
            <div className="grid items-center gap-6 md:grid-cols-2">
              <div>
                <Lock className="size-6 text-primary" aria-hidden />
                <h3 className="mt-4 font-display text-[2rem] leading-[1.1] text-ink">{t("privacyTitle")}</h3>
                <p className="mt-2 max-w-md text-body text-ink-2">{t("privacyBody")}</p>
              </div>
              <DeleteArt label={t("privacyDeleting")} done={t("privacyDone")} />
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}
