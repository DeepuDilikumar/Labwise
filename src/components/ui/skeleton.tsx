import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton h-4", className)} />;
}

export function MarkerCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-surface p-5" aria-hidden>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-9 w-28" />
      <Skeleton className="mt-5 h-1.5 w-full rounded-full" />
      <Skeleton className="mt-6 h-3 w-full" />
    </div>
  );
}
