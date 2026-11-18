import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/cn";

/** Calm, prominent, never alarmist. No emoji. Wording comes from messages. */
export function UrgencyBanner({ title, body, className }: { title: string; body?: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn("flex items-start gap-3.5 rounded-[var(--radius-lg)] border border-crit-line bg-crit-soft p-4 sm:p-5", className)}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-crit">
        <Stethoscope className="size-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-ink">{title}</p>
        {body && <p className="mt-0.5 text-small text-ink-2 text-pretty">{body}</p>}
      </div>
    </div>
  );
}
