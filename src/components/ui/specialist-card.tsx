import { ExternalLink, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SpecialistSuggestion {
  id: string;
  label: string;
  reason: string;
  mapsUrl: string;
  primary?: boolean;
}

export function SpecialistCard({
  title,
  intro,
  findLabel,
  items,
  className,
}: {
  title: string;
  intro?: string;
  findLabel: string;
  items: SpecialistSuggestion[];
  className?: string;
}) {
  return (
    <section className={cn("rounded-[var(--radius-xl)] border border-line bg-surface p-5 shadow-[var(--shadow-xs)] sm:p-6", className)}>
      <h2 className="text-h3 font-semibold text-ink">{title}</h2>
      {intro && <p className="mt-1 text-small text-ink-3 text-pretty">{intro}</p>}
      <ul className="mt-4 divide-y divide-line">
        {items.map((s) => (
          <li key={s.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 gap-3">
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full",
                  s.primary ? "bg-primary-soft text-primary-soft-ink" : "bg-surface-2 text-ink-2",
                )}
              >
                <UserRound className="size-[18px]" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-ink">{s.label}</p>
                <p className="text-small text-ink-3 text-pretty">{s.reason}</p>
              </div>
            </div>
            <a
              href={s.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-[10px] border border-line-strong bg-surface px-3.5 text-small font-medium text-ink transition-colors hover:bg-surface-2 sm:self-center"
            >
              {findLabel}
              <ExternalLink className="size-3.5 text-ink-3" aria-hidden />
              <span className="sr-only"> — {s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
