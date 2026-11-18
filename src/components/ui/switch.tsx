"use client";
import * as S from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

export function Switch({ className, ...props }: React.ComponentProps<typeof S.Root>) {
  return (
    <S.Root
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent bg-surface-3 transition-colors",
        "data-[state=checked]:bg-primary disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <S.Thumb className="block size-6 translate-x-0.5 rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform duration-200 data-[state=checked]:translate-x-[1.375rem]" />
    </S.Root>
  );
}
