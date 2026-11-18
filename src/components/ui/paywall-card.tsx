import { Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export interface PlanOption {
  id: "single_report" | "monthly";
  name: string;
  price: string;
  cadence: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

export function PaywallCard({
  plan,
  onSelect,
  loading,
  className,
}: {
  plan: PlanOption;
  onSelect?: () => void;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-[var(--radius-xl)] border bg-surface p-6",
        plan.highlighted ? "border-primary shadow-[var(--shadow-md)] ring-1 ring-primary" : "border-line shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-h3 font-semibold text-ink">{plan.name}</h3>
        {plan.badge && (
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-caption font-medium text-primary-soft-ink">{plan.badge}</span>
        )}
      </div>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="text-[2.25rem] font-semibold leading-none tracking-[-0.03em] tabular text-ink">{plan.price}</span>
        <span className="text-small text-ink-3">{plan.cadence}</span>
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5 text-small text-ink-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      {onSelect && (
        <Button className="mt-6" block variant={plan.highlighted ? "primary" : "secondary"} onClick={onSelect} loading={loading}>
          {plan.cta}
        </Button>
      )}
    </div>
  );
}

export function PaymentTrust({ methods, note, className }: { methods: readonly string[]; note: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", className)}>
      <div className="flex flex-wrap justify-center gap-1.5">
        {methods.map((m) => (
          <span key={m} className="rounded-[8px] border border-line bg-surface px-2.5 py-1 text-caption font-medium text-ink-2">
            {m}
          </span>
        ))}
      </div>
      <p className="inline-flex items-center gap-1.5 text-caption text-ink-3">
        <ShieldCheck className="size-3.5" aria-hidden /> {note}
      </p>
    </div>
  );
}
