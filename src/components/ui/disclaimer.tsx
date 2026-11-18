import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

export function Disclaimer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start justify-center gap-1.5 text-caption text-ink-3", className)}>
      <Info className="mt-px size-3.5 shrink-0" aria-hidden />
      <span className="text-pretty">{children}</span>
    </p>
  );
}
