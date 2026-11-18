import { cn } from "@/lib/cn";

export function OverviewStrip({
  items,
  className,
}: {
  items: { label: string; value: number; tone: "ok" | "attention" | "neutral" }[];
  className?: string;
}) {
  return (
    <dl className={cn("grid grid-cols-3 divide-x divide-line rounded-[var(--radius-lg)] border border-line bg-surface", className)}>
      {items.map((it) => (
        <div key={it.label} className="px-3 py-3.5 text-center sm:px-5">
          <dd
            className={cn(
              "text-h1 font-semibold tabular",
              it.tone === "ok" ? "text-ok" : it.tone === "attention" ? "text-out" : "text-ink-2",
            )}
          >
            {it.value}
          </dd>
          <dt className="mt-0.5 text-caption text-ink-3">{it.label}</dt>
        </div>
      ))}
    </dl>
  );
}
