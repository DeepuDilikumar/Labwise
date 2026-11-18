"use client";
import { ArrowLeft, ArrowRight, BookOpenText, Brain, History, Lock, ShieldCheck, Stethoscope, UserRoundSearch } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { LivingBackdrop } from "@/components/landing/living-backdrop";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Logo } from "@/components/ui/logo";
import { Switch } from "@/components/ui/switch";
import { LanguageSwitcher } from "@/components/ui/switchers";
import { cn } from "@/lib/cn";
import type { Locale } from "@regions";

const ease = [0.25, 1, 0.5, 1] as const;

export function OnboardingFlow({ locales }: { locales: readonly Locale[] }) {
  const t = useTranslations("onboarding");
  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [consents, setConsents] = React.useState({ process_reports: false, ai_processing: false, store_history: true });
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };
  const canContinue = step === 0 || (step === 1 ? consents.process_reports && consents.ai_processing : name.trim().length > 0);

  const finish = () =>
    start(async () => {
      setError(null);
      const r = await completeOnboarding({
        name: name.trim(),
        consents: { process_reports: true, ai_processing: true, store_history: consents.store_history },
      });
      if (r && !r.ok) setError(t("error"));
    });

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
      <LivingBackdrop className="opacity-70" />
      <header className="relative mx-auto flex h-16 w-full max-w-[34rem] items-center justify-between px-4">
        <Logo />
        <LanguageSwitcher locales={locales} compact />
      </header>
      <main id="main" className="relative mx-auto flex w-full max-w-[34rem] flex-1 flex-col px-4 pb-6">
        <div className="mt-2 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} aria-label={t("progress", { step: step + 1 })}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <motion.span className="block h-full bg-primary" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.35, ease }} />
            </span>
          ))}
        </div>

        <div className="relative mt-10 flex-1">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.section
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -28 }}
              transition={{ duration: 0.28, ease }}
              aria-labelledby={`ob-${step}`}
            >
              {step === 0 && (
                <>
                  <p className="text-small font-semibold text-primary">{t("s1Eyebrow")}</p>
                  <h1 id="ob-0" className="mt-3 font-display text-[2.75rem] leading-[1.02] text-ink text-balance">{t("s1Title")}</h1>
                  <ul className="mt-10 space-y-3">
                    {[
                      { icon: BookOpenText, tint: "bg-mint text-mint-ink", title: t("s1a"), body: t("s1aBody") },
                      { icon: UserRoundSearch, tint: "bg-lilac text-lilac-ink", title: t("s1b"), body: t("s1bBody") },
                      { icon: Stethoscope, tint: "bg-peach text-peach-ink", title: t("s1c"), body: t("s1cBody") },
                    ].map(({ icon: Icon, tint, title, body }, i) => (
                      <motion.li
                        key={title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08, duration: 0.3, ease }}
                        className="flex gap-4 rounded-[20px] border border-line bg-surface/90 p-4 shadow-[var(--shadow-xs)] backdrop-blur"
                      >
                        <span className={cn("grid size-11 shrink-0 place-items-center rounded-[14px]", tint)}>
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <div>
                          <p className="font-semibold text-ink">{title}</p>
                          <p className="mt-0.5 text-small text-ink-3">{body}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </>
              )}

              {step === 1 && (
                <>
                  <p className="text-small font-semibold text-primary">{t("s2Eyebrow")}</p>
                  <h1 id="ob-1" className="mt-3 font-display text-[2.75rem] leading-[1.02] text-ink text-balance">{t("s2Title")}</h1>
                  <p className="mt-3 text-body text-ink-2">{t("s2Body")}</p>
                  <div className="mt-8 space-y-3">
                    {(
                      [
                        { key: "process_reports", icon: Lock, required: true },
                        { key: "ai_processing", icon: Brain, required: true },
                        { key: "store_history", icon: History, required: false },
                      ] as const
                    ).map(({ key, icon: Icon, required }) => (
                      <label
                        key={key}
                        htmlFor={`c-${key}`}
                        className={cn(
                          "flex cursor-pointer gap-4 rounded-[20px] border bg-surface/90 p-4 backdrop-blur transition-colors",
                          consents[key] ? "border-primary/40 shadow-[var(--shadow-sm)]" : "border-line",
                        )}
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-2 text-ink-2">
                          <Icon className="size-[18px]" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-ink">{t(`c.${key}`)}</span>
                            <span className={cn("rounded-full px-2 py-0.5 text-caption font-medium", required ? "bg-surface-2 text-ink-3" : "bg-mint text-mint-ink")}>
                              {required ? t("required") : t("optional")}
                            </span>
                          </span>
                          <span className="mt-1 block text-small text-ink-3">{t(`c.${key}Body`)}</span>
                        </span>
                        <Switch id={`c-${key}`} checked={consents[key]} onCheckedChange={(v) => setConsents((c) => ({ ...c, [key]: v }))} className="mt-1" />
                      </label>
                    ))}
                  </div>
                  <p className="mt-4 flex items-center gap-1.5 text-small text-ink-3">
                    <ShieldCheck className="size-4 text-primary" aria-hidden />
                    {t.rich("s2Note", { link: (c) => <Link href="/legal/privacy" target="_blank" className="font-medium text-primary underline-offset-2 hover:underline">{c}</Link> })}
                  </p>
                </>
              )}

              {step === 2 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (canContinue) finish();
                  }}
                >
                  <p className="text-small font-semibold text-primary">{t("s3Eyebrow")}</p>
                  <h1 id="ob-2" className="mt-3 font-display text-[2.75rem] leading-[1.02] text-ink text-balance">{t("s3Title")}</h1>
                  <p className="mt-3 text-body text-ink-2">{t("s3Body")}</p>
                  <Field className="mt-8" label={t("nameLabel")} htmlFor="ob-name" hint={t("nameHint")} error={error ?? undefined}>
                    <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={60} className="h-12 text-lead" autoFocus />
                  </Field>
                </form>
              )}
            </motion.section>
          </AnimatePresence>
        </div>

        <div className="safe-bottom sticky bottom-0 mt-8 flex gap-3 pt-4">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => go(step - 1)} aria-label={t("back")} className="px-4">
              <ArrowLeft aria-hidden />
            </Button>
          )}
          <Button size="lg" block disabled={!canContinue} loading={pending} onClick={() => (step < 2 ? go(step + 1) : finish())} className="group">
            {step < 2 ? t("continue") : t("finish")}
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Button>
        </div>
      </main>
    </div>
  );
}
