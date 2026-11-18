"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

/** "The big picture" — the one moment that uses the display face. */
export function SummaryCard({
  eyebrow,
  title,
  bullets,
  reassurance,
  meta,
  className,
}: {
  eyebrow: string;
  title: string;
  bullets: string[];
  reassurance?: string | null;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-2xl)] border border-line bg-surface p-6 shadow-[var(--shadow-md)] sm:p-8",
        className,
      )}
    >
      <div aria-hidden className="ambient-glow pointer-events-none absolute inset-0 opacity-90" />
      <div className="relative">
        <p className="text-caption font-medium uppercase tracking-[0.08em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 font-display text-[2rem] leading-[1.1] tracking-[-0.01em] text-ink text-balance sm:text-[2.5rem]">
          {title}
        </h2>
        {meta && <div className="mt-2 text-small text-ink-3">{meta}</div>}
        <ul className="mt-6 space-y-3.5">
          {bullets.map((b, i) => (
            <motion.li
              key={b}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.07, ease: [0.25, 1, 0.5, 1] }}
              className="flex gap-3 text-body text-ink-2"
            >
              <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-pretty">{b}</span>
            </motion.li>
          ))}
        </ul>
        {reassurance && (
          <p className="mt-6 border-t border-line pt-5 text-small text-ink-2 text-pretty">{reassurance}</p>
        )}
      </div>
    </section>
  );
}
