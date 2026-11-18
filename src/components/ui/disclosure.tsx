"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";

interface Props {
  title: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Disclosure({ title, icon, defaultOpen = false, children, className }: Props) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();
  const reduce = useReducedMotion();
  return (
    <div className={cn("border-t border-line first:border-t-0", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="group flex min-h-12 w-full items-center gap-3 py-3 text-left text-small font-medium text-ink"
      >
        {icon && <span className="text-ink-3 [&_svg]:size-4">{icon}</span>}
        <span className="flex-1">{title}</span>
        <ChevronDown
          aria-hidden
          className={cn("size-4 text-ink-3 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-small leading-relaxed text-ink-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
