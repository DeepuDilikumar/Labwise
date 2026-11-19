"use client";
import { ArrowRight, Languages, MessageCircleQuestion, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/cn";
import { LivingBackdrop } from "./living-backdrop";
import { Phone } from "./phone";
import { ReportScene } from "./report-scene";

const ease = [0.25, 1, 0.5, 1] as const;

function RotatingWord({ words }: { words: string[] }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % words.length), 2600);
    return () => clearInterval(id);
  }, [words.length]);
  return (
    <span className="relative inline-grid align-baseline">
      {/* Reserve the width of the longest word so nothing reflows. */}
      {words.map((w) => (
        <span key={w} className="invisible col-start-1 row-start-1" aria-hidden>
          {w}
        </span>
      ))}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[i]}
          className="col-start-1 row-start-1 bg-gradient-to-r from-primary via-[hsl(170_70%_38%)] to-[hsl(190_70%_40%)] bg-clip-text italic text-transparent dark:from-primary dark:to-[hsl(190_70%_60%)]"
          initial={{ opacity: 0, y: "0.35em", filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: "-0.35em", filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only">{words[0]}</span>
    </span>
  );
}

function FloatChip({
  children,
  className,
  mx,
  my,
  depth,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  depth: number;
  delay: number;
}) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth);
  return (
    <motion.div
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease }}
      className={cn("absolute z-10", className)}
    >
      <div className="animate-float" style={{ animationDelay: `${delay * -2}s` }}>
        <div className="rounded-[16px] border border-white/60 bg-surface/90 p-3 shadow-[var(--shadow-lg)] backdrop-blur-md dark:border-white/5">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  const t = useTranslations("landing.hero");
  const mxRaw = useMotionValue(0);
  const myRaw = useMotionValue(0);
  const mx = useSpring(mxRaw, { stiffness: 60, damping: 18 });
  const my = useSpring(myRaw, { stiffness: 60, damping: 18 });

  const phoneX = useTransform(mx, (v) => v * -0.3);
  const phoneY = useTransform(my, (v) => v * -0.3);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mxRaw.set(((e.clientX - r.left) / r.width - 0.5) * 30);
    myRaw.set(((e.clientY - r.top) / r.height - 0.5) * 30);
  };

  return (
    <section onPointerMove={onMove} className="relative isolate overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-36">
      <LivingBackdrop />
      <div className="relative mx-auto grid max-w-[var(--container-wide)] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="text-center lg:text-left">
          <p
            className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 py-1 pl-1.5 pr-3 text-small text-ink-2 shadow-[var(--shadow-xs)] backdrop-blur"
          >
            <span className="relative flex size-5 items-center justify-center rounded-full bg-primary-soft">
              <span className="absolute inline-flex size-2 rounded-full bg-primary animate-ping-soft" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            {t("eyebrow")}
          </p>
          <h1
            className="mt-6 font-display text-[3rem] leading-[1] tracking-[-0.02em] text-ink sm:text-[4.25rem] lg:text-[5rem]"
          >
            {t("titleA")}
            <br />
            <RotatingWord words={[t("word1"), t("word2"), t("word3")]} />
          </h1>
          <p
            className="mx-auto mt-6 max-w-xl text-lead text-ink-2 text-pretty lg:mx-0"
          >
            {t("subtitle")}
          </p>
          <div
            className="animate-fade-up [animation-delay:120ms] mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
          >
            <Button asChild size="lg" className="group h-14 rounded-[16px] px-7 text-lead shadow-[0_8px_24px_-8px_var(--primary)]">
              <Link href="/sign-in?next=/home">
                {t("ctaPrimary")}
                <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-14 rounded-[16px] px-7 text-lead">
              <Link href="/sample">
                <Sparkles aria-hidden /> {t("ctaSecondary")}
              </Link>
            </Button>
          </div>
          <ul
            className="animate-fade-up [animation-delay:200ms] mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-small text-ink-3 lg:justify-start"
          >
            {[t("trust1"), t("trust2"), t("trust3")].map((s) => (
              <li key={s} className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" aria-hidden /> {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto flex h-[38rem] w-full max-w-[34rem] items-center justify-center sm:h-[42rem]">
          <div aria-hidden className="absolute size-[26rem] rounded-full bg-[conic-gradient(from_180deg,hsl(160_70%_45%/0.25),hsl(24_100%_70%/0.25),hsl(250_90%_75%/0.25),hsl(160_70%_45%/0.25))] blur-3xl sm:size-[30rem]" />
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.9, ease }}
            style={{ x: phoneX, y: phoneY }}
          >
            <Phone>
              <ReportScene />
            </Phone>
          </motion.div>

          <FloatChip mx={mx} my={my} depth={1.1} delay={0.7} className="-left-2 top-24 sm:-left-8">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-peach text-peach-ink">
                <span className="text-small font-semibold">A1c</span>
              </span>
              <div>
                <p className="text-caption text-ink-3">{t("chipValue")}</p>
                <StatusPill size="sm" status="high" tone="borderline" className="mt-0.5" />
              </div>
            </div>
          </FloatChip>
          <FloatChip mx={mx} my={my} depth={1.6} delay={0.9} className="-right-1 top-36 max-w-[13rem] sm:-right-10">
            <div className="flex gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lilac text-lilac-ink">
                <MessageCircleQuestion className="size-4" aria-hidden />
              </span>
              <p className="text-caption leading-snug text-ink-2">“{t("chipQuestion")}”</p>
            </div>
          </FloatChip>
          <FloatChip mx={mx} my={my} depth={0.8} delay={1.1} className="-left-4 bottom-28 sm:-left-12">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-sky text-sky-ink">
                <Languages className="size-4" aria-hidden />
              </span>
              <p className="text-small font-medium text-ink">
                {/* System fonts here, so the landing page doesn't download ~200KB of Indic web fonts up front. */}
                English · <span lang="hi" style={{ fontFamily: "system-ui, sans-serif" }}>हिन्दी</span> · <span lang="ml" style={{ fontFamily: "system-ui, sans-serif" }}>മലയാളം</span>
              </p>
            </div>
          </FloatChip>
          <FloatChip mx={mx} my={my} depth={1.3} delay={1.3} className="-right-2 bottom-16 sm:-right-6">
            <div className="flex items-center gap-2.5">
              <span className="relative grid size-8 place-items-center rounded-full bg-mint text-mint-ink">
                <span className="absolute inset-0 rounded-full bg-mint animate-ping-soft" />
                <Stethoscope className="relative size-4" aria-hidden />
              </span>
              <div>
                <p className="text-small font-medium text-ink">{t("chipSpecialist")}</p>
                <p className="text-caption text-primary">{t("chipFind")}</p>
              </div>
            </div>
          </FloatChip>
        </div>
      </div>
    </section>
  );
}
