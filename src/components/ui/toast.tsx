"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  title: string;
  body?: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

type Listener = (t: ToastItem[]) => void;
let items: ToastItem[] = [];
const listeners = new Set<Listener>();
let nextId = 1;
const emit = () => listeners.forEach((l) => l(items));

export function toast(t: Omit<ToastItem, "id" | "tone"> & { tone?: ToastTone; duration?: number }) {
  const id = nextId++;
  items = [...items.slice(-2), { id, tone: t.tone ?? "info", title: t.title, body: t.body, action: t.action }];
  emit();
  setTimeout(() => dismiss(id), t.duration ?? 4500);
  return id;
}
export function dismiss(id: number) {
  items = items.filter((i) => i.id !== id);
  emit();
}

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const iconTone = { success: "text-ok", error: "text-out", info: "text-info" };

export function Toaster() {
  const [list, setList] = React.useState<ToastItem[]>([]);
  const reduce = useReducedMotion();
  React.useEffect(() => {
    listeners.add(setList);
    return () => void listeners.delete(setList);
  }, []);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-auto sm:top-0 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {list.map((t) => {
          const Icon = icons[t.tone];
          return (
            <motion.div
              key={t.id}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              role={t.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[14px] border border-line bg-surface p-3.5 shadow-[var(--shadow-lg)]"
            >
              <Icon className={cn("mt-0.5 size-[18px] shrink-0", iconTone[t.tone])} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-small font-medium text-ink">{t.title}</p>
                {t.body && <p className="mt-0.5 text-small text-ink-3">{t.body}</p>}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action!.onClick();
                      dismiss(t.id);
                    }}
                    className="mt-1.5 text-small font-medium text-primary hover:underline"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="-m-1 grid size-8 place-items-center rounded-full text-ink-3 hover:bg-surface-2"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
