import * as React from "react";
import { cn } from "@/lib/cn";

export const inputBase = cn(
  "block w-full rounded-[12px] border border-line-strong bg-surface px-3.5 text-body text-ink",
  "placeholder:text-ink-3 shadow-[var(--shadow-xs)] transition-[border-color,box-shadow] duration-150",
  "hover:border-ink-3/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/12",
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3",
  "aria-[invalid=true]:border-crit aria-[invalid=true]:focus:ring-crit/12",
);

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { leading?: React.ReactNode }
>(function Input({ className, leading, ...props }, ref) {
  if (!leading) return <input ref={ref} className={cn(inputBase, "h-11", className)} {...props} />;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-body text-ink-3">{leading}</span>
      <input ref={ref} className={cn(inputBase, "h-11 pl-14", className)} {...props} />
    </div>
  );
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(inputBase, "min-h-24 py-3", className)} {...props} />;
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(inputBase, "h-11 appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});

interface FieldProps {
  label: React.ReactNode;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  optional?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + hint/error with the right aria wiring. */
export function Field({ label, htmlFor, hint, error, optional, className, children }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errId = error ? `${htmlFor}-error` : undefined;
  const control = React.isValidElement<Record<string, unknown>>(children)
    ? React.cloneElement(children, {
        id: htmlFor,
        "aria-describedby": [hintId, errId].filter(Boolean).join(" ") || undefined,
        "aria-invalid": error ? true : undefined,
      })
    : children;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between text-small font-medium text-ink">
        <span>{label}</span>
        {optional && <span className="text-caption font-normal text-ink-3">{optional}</span>}
      </label>
      {control}
      {error ? (
        <p id={errId} className="text-small text-crit" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-small text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
