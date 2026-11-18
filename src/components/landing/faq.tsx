"use client";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/cn";
import { SectionHeading } from "./section-heading";

export function Faq() {
  const t = useTranslations("landing.faq");
  const [open, setOpen] = React.useState<number | null>(0);
  const items = Array.from({ length: 6 }, (_, i) => ({ q: t(`q${i + 1}`), a: t(`a${i + 1}`) }));
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-[var(--container-reading)] px-4 sm:px-6">
        <SectionHeading id="faq-title" eyebrow={t("eyebrow")} title={t("title")} />
        <ul className="mt-12 space-y-3">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <li key={i} className={cn("rounded-[20px] border bg-surface transition-colors", isOpen ? "border-line-strong shadow-[var(--shadow-sm)]" : "border-line")}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex min-h-16 w-full items-center gap-4 px-5 py-4 text-left text-body font-medium text-ink sm:px-6"
                  >
                    <span className="flex-1 text-pretty">{it.q}</span>
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full transition-all duration-300", isOpen ? "rotate-45 bg-primary text-primary-ink" : "bg-surface-2 text-ink-2")}>
                      <Plus className="size-4" aria-hidden />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-body text-ink-2 text-pretty sm:px-6">{it.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
