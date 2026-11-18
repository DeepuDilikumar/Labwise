import { ClipboardCheck, Info, Pill, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Disclaimer } from "@/components/ui/disclaimer";
import { SpecialistCard } from "@/components/ui/specialist-card";
import { InlineNotice } from "@/components/ui/states";
import type { RxView as RxViewModel } from "@/server/views/rx-view";

export async function RxView({ view, meta, header, actions }: { view: RxViewModel; meta: string; header?: React.ReactNode; actions: React.ReactNode }) {
  const t = await getTranslations("rx");
  return (
    <div className="mx-auto max-w-[46rem] px-4 pb-40 pt-6 sm:px-6 md:pb-24">
      {header}
      <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-line bg-surface p-6 shadow-[var(--shadow-md)] sm:p-8">
        <div aria-hidden className="ambient-glow absolute inset-0" />
        <div className="relative">
          <p className="text-caption font-medium uppercase tracking-[0.08em] text-primary">{t("eyebrow")}</p>
          <h1 className="mt-2 font-display text-[2rem] leading-[1.1] text-ink sm:text-[2.5rem]">{t("title", { count: view.items.length })}</h1>
          {meta && <p className="mt-2 text-small text-ink-3">{meta}</p>}
          <p className="mt-5 flex gap-2.5 rounded-[14px] bg-primary-soft p-4 text-small font-medium text-primary-soft-ink">
            <ClipboardCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("followDoctor")}
          </p>
        </div>
      </section>

      <ul className="mt-6 space-y-3">
        {view.items.map((i) => (
          <li key={i.id} className="rounded-[var(--radius-xl)] border border-line bg-surface p-5 shadow-[var(--shadow-xs)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-lilac text-lilac-ink">
                <Pill className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-h3 font-semibold text-ink">{i.written}</h2>
                {i.brandNote && <p className="text-small text-ink-3">{i.brandNote}</p>}
              </div>
              {i.confirmWithPharmacist && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warn-line bg-warn-soft px-2.5 py-1 text-caption font-medium text-warn">
                  <ShieldAlert className="size-3.5" aria-hidden /> {t("confirmBadge")}
                </span>
              )}
            </div>

            <h3 className="mt-5 text-caption font-semibold uppercase tracking-[0.06em] text-ink-3">{t("asWritten")}</h3>
            {i.howToTake.length ? (
              <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {i.howToTake.map((h) => (
                  <div key={h.label} className="rounded-[12px] bg-surface-2 px-3 py-2.5">
                    <dt className="text-caption text-ink-3">{h.label}</dt>
                    <dd className="mt-0.5 text-small font-medium text-ink">{h.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-small text-ink-3">{t("noInstructions")}</p>
            )}

            <h3 className="mt-5 text-caption font-semibold uppercase tracking-[0.06em] text-ink-3">{t("generallyFor")}</h3>
            <p className="mt-1.5 text-body text-ink-2">{i.usedFor ?? t("unknownDrug")}</p>
            {i.precautions.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {i.precautions.map((p) => (
                  <li key={p} className="flex gap-2 text-small text-ink-2">
                    <Info className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden /> {p}
                  </li>
                ))}
              </ul>
            )}
            {i.confirmWithPharmacist && (
              <InlineNotice tone="warn" className="mt-4">
                {t("confirmNote")}
              </InlineNotice>
            )}
          </li>
        ))}
      </ul>

      <SpecialistCard className="mt-8" title={t("whoToSee")} intro={t("whoToSeeIntro")} findLabel={t("findNearMe")} items={view.specialists} />
      <p className="mt-8 text-center text-small font-medium text-ink-2">{t("followDoctor")}</p>
      <Disclaimer className="mt-3">{t("disclaimer")}</Disclaimer>
      {actions}
    </div>
  );
}
