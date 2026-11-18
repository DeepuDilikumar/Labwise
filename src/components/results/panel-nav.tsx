"use client";
import { cn } from "@/lib/cn";

export function PanelNav({ groups }: { groups: { id: string; title: string; count: number }[] }) {
  return (
    <nav aria-label="Sections" className="no-scrollbar -mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {groups.map((g) => (
        <a
          key={g.id}
          href={`#panel-${g.id}`}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-small font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink",
          )}
        >
          {g.title}
          <span className="text-caption text-ink-3">{g.count}</span>
        </a>
      ))}
    </nav>
  );
}
