"use client";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
  closeLabel = "Close",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  closeLabel?: string;
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-[2px] data-[state=open]:animate-[fade-in_160ms_ease-out]" />
      <D.Content
        className={cn(
          "fixed z-50 w-full bg-surface p-6 shadow-[var(--shadow-lg)] focus:outline-none",
          "inset-x-0 bottom-0 rounded-t-[var(--radius-2xl)] pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--radius-2xl)] sm:pb-6",
          "data-[state=open]:animate-[sheet-in_240ms_cubic-bezier(0.25,1,0.5,1)] sm:data-[state=open]:animate-[pop-in_200ms_cubic-bezier(0.25,1,0.5,1)]",
          className,
        )}
      >
        <div aria-hidden className="mx-auto -mt-2 mb-4 h-1 w-10 rounded-full bg-line-strong sm:hidden" />
        <D.Title className="pr-8 text-h2 font-semibold text-ink">{title}</D.Title>
        {description ? (
          <D.Description className="mt-1.5 text-small text-ink-3 text-pretty">{description}</D.Description>
        ) : (
          <D.Description className="sr-only">{title}</D.Description>
        )}
        <div className="mt-5">{children}</div>
        <D.Close
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label={closeLabel}
        >
          <X className="size-4" />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
