"use client";
import { motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/cn";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label: string;
  className?: string;
}) {
  const id = React.useId();
  const reduce = useReducedMotion();
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-[12px] bg-surface-2 p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative min-h-9 flex-1 whitespace-nowrap rounded-[9px] px-3.5 text-small font-medium transition-colors",
              active ? "text-ink" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {active && (
              <motion.span
                layoutId={reduce ? undefined : `seg-${id}`}
                className="absolute inset-0 rounded-[9px] bg-surface shadow-[var(--shadow-sm)]"
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
