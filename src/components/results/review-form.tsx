"use client";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { submitReview } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { InlineNotice } from "@/components/ui/states";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

interface Row {
  position: number;
  marker: string;
  value: string;
  unit: string | null;
  referenceRangeText: string | null;
  confidence: number;
}

/** Editable list (not a cramped table): low-confidence rows are highlighted and need a tap to confirm. */
export function ReviewForm({ documentId, markers }: { documentId: string; markers: Row[] }) {
  const t = useTranslations("review");
  const router = useRouter();
  const [rows, setRows] = React.useState(markers);
  const [confirmed, setConfirmed] = React.useState<Set<number>>(new Set());
  const [showAll, setShowAll] = React.useState(false);
  const [pending, start] = React.useTransition();
  const unsure = rows.filter((r) => r.confidence < 0.8);
  const remaining = unsure.filter((r) => !confirmed.has(r.position)).length;
  const visible = showAll ? rows : unsure;

  const update = (pos: number, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.position === pos ? { ...r, ...patch } : r)));
    setConfirmed((c) => new Set(c).add(pos));
  };

  const submit = () =>
    start(async () => {
      const edits = rows
        .filter((r) => confirmed.has(r.position) || r.confidence < 0.8)
        .map(({ position, marker, value, unit, referenceRangeText }) => ({ position, marker, value, unit, referenceRangeText }));
      const res = await submitReview(documentId, edits);
      if (!res.ok) toast({ title: t("error"), tone: "error" });
      router.refresh();
    });

  return (
    <div>
      <p className="text-small font-semibold text-primary">{t("eyebrow")}</p>
      <h1 className="mt-2 font-display text-[2.25rem] leading-[1.05] text-ink text-balance">{t("title")}</h1>
      <p className="mt-2 text-body text-ink-2">{t("body", { count: unsure.length })}</p>
      <InlineNotice tone="warn" icon={<AlertCircle />} className="mt-5">
        {t("notice")}
      </InlineNotice>

      <ul className="mt-6 space-y-3">
        {visible.map((r, i) => {
          const low = r.confidence < 0.8;
          const ok = confirmed.has(r.position);
          return (
            <motion.li
              key={r.position}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.03 }}
              className={cn(
                "rounded-[var(--radius-xl)] border p-4 transition-colors",
                low && !ok ? "border-warn-line bg-warn-soft/50" : "border-line bg-surface",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">{t("name")}</span>
                  <input
                    value={r.marker}
                    onChange={(e) => update(r.position, { marker: e.target.value })}
                    className="w-full bg-transparent text-body font-semibold text-ink outline-none focus:underline"
                  />
                </label>
                {low && (
                  <button
                    type="button"
                    onClick={() => setConfirmed((c) => new Set(c).add(r.position))}
                    aria-pressed={ok}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-small font-medium transition-colors",
                      ok ? "bg-ok-soft text-ok" : "bg-surface text-warn ring-1 ring-warn-line",
                    )}
                  >
                    {ok ? <CheckCircle2 className="size-4" aria-hidden /> : <AlertCircle className="size-4" aria-hidden />}
                    {ok ? t("confirmed") : t("confirm")}
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_7rem_1.4fr]">
                <label>
                  <span className="mb-1 block text-caption text-ink-3">{t("value")}</span>
                  <Input value={r.value} onChange={(e) => update(r.position, { value: e.target.value })} inputMode="decimal" className="tabular" />
                </label>
                <label>
                  <span className="mb-1 block text-caption text-ink-3">{t("unit")}</span>
                  <Input value={r.unit ?? ""} onChange={(e) => update(r.position, { unit: e.target.value || null })} className="w-24 sm:w-full" />
                </label>
                <label className="col-span-2 sm:col-span-1">
                  <span className="mb-1 block text-caption text-ink-3">{t("range")}</span>
                  <Input value={r.referenceRangeText ?? ""} placeholder={t("rangePlaceholder")} onChange={(e) => update(r.position, { referenceRangeText: e.target.value || null })} />
                </label>
              </div>
            </motion.li>
          );
        })}
      </ul>
      {!showAll && rows.length > unsure.length && (
        <button type="button" onClick={() => setShowAll(true)} className="mt-4 text-small font-medium text-primary hover:underline">
          {t("showAll", { count: rows.length })}
        </button>
      )}

      <div className="glass safe-bottom fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 border-t border-line px-4 pt-3 md:bottom-0 md:pb-3">
        <div className="mx-auto flex max-w-[46rem] items-center justify-between gap-3">
          <p className="text-small text-ink-3">{remaining > 0 ? t("remaining", { count: remaining }) : t("allConfirmed")}</p>
          <Button onClick={submit} disabled={remaining > 0} loading={pending}>
            {t("submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
