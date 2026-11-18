import * as React from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[var(--radius-xl)] border border-line bg-surface shadow-[var(--shadow-sm)]", className)}
      {...props}
    />
  );
}

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-caption font-medium uppercase tracking-[0.08em] text-ink-3", className)} {...props} />;
}
