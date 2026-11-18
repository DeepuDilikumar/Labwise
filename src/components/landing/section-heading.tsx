"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "center",
  className,
  id,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body?: string;
  align?: "center" | "left";
  className?: string;
  id?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl", className)}
    >
      <p className="text-small font-semibold text-primary">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-display text-[2.5rem] leading-[1.05] tracking-[-0.015em] text-ink text-balance sm:text-[3.25rem]">
        {title}
      </h2>
      {body && <p className="mt-4 text-lead text-ink-2 text-pretty">{body}</p>}
    </motion.div>
  );
}
