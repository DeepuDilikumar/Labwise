"use client";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

/** Reassuring 3-step progress: Reading → Checking ranges → Writing it plainly. */
export function ProcessingSteps({ steps, active, className }: { steps: string[]; active: number; className?: string }) {
  return (
    <ol className={cn("space-y-1", className)} aria-live="polite">
      {steps.map((s, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={s} className="flex items-center gap-3.5 py-2" aria-current={current ? "step" : undefined}>
            <span
              className={cn(
                "relative grid size-8 shrink-0 place-items-center rounded-full border text-caption font-semibold transition-colors duration-300",
                done && "border-transparent bg-primary text-primary-ink",
                current && "border-primary text-primary",
                !done && !current && "border-line-strong text-ink-3",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={2.6} aria-hidden /> : i + 1}
              {current && (
                <motion.span
                  aria-hidden
                  className="absolute inset-[-4px] rounded-full border-2 border-primary/25 border-t-primary motion-reduce:hidden"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.1, ease: "linear", repeat: Infinity }}
                />
              )}
            </span>
            <span className={cn("text-body transition-colors", current ? "font-medium text-ink" : done ? "text-ink-2" : "text-ink-3")}>
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
