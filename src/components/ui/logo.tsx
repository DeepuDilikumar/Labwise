import { cn } from "@/lib/cn";

/** Wordmark: a calm ring-and-dot glyph (a value sitting inside its range) + name. */
export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
        <rect x="1" y="1" width="26" height="26" rx="8" className="fill-primary" />
        <path d="M6.5 14h15" stroke="white" strokeOpacity="0.35" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M10 14h8" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="15.5" cy="14" r="3.4" className="fill-primary" stroke="white" strokeWidth="2.2" />
      </svg>
      {showWord && <span className="text-[1.0625rem] font-semibold tracking-[-0.02em]">Labwise</span>}
    </span>
  );
}
