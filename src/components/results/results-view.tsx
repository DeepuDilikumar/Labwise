import { Languages, Repeat2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Disclaimer } from "@/components/ui/disclaimer";
import { MarkerCard } from "@/components/ui/marker-card";
import { OverviewStrip } from "@/components/ui/overview-strip";
import { SpecialistCard } from "@/components/ui/specialist-card";
import { InlineNotice } from "@/components/ui/states";
import { SummaryCard } from "@/components/ui/summary-card";
import { UrgencyBanner } from "@/components/ui/urgency-banner";
import type { LabView } from "@/server/views/lab-view";
import { PanelNav } from "./panel-nav";
import { UnitToggle } from "./unit-toggle";

export async function ResultsView({
  view,
  meta,
  units,
  allowUnitToggle,
  actions,
  header,
}: {
  view: LabView;
  meta: string;
  units: "conventional" | "si";
  allowUnitToggle: boolean;
  actions: React.ReactNode;
  header?: React.ReactNode;
}) {
  const t = await getTranslations("results");
  return (
    <div className="mx-auto max-w-[46rem] px-4 pb-40 pt-6 sm:px-6 md:pb-24">
      {header}
      <div className="space-y-4">
        {view.urgent && <UrgencyBanner title={t("urgentTitle")} body={t("urgentBody", { names: view.urgent.names.join(", ") })} />}
        <SummaryCard
          eyebrow={t("bigPicture")}
          title={view.bigPicture.headline}
          meta={meta}
          bullets={view.bigPicture.bullets}
          reassurance={view.bigPicture.reassurance}
        />
        <OverviewStrip items={view.overview} />
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PanelNav groups={view.groups.map((g) => ({ id: g.panel, title: g.title, count: g.markers.length }))} />
        {allowUnitToggle && <UnitToggle value={units} />}
      </div>
      {view.converted && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-caption text-ink-3">
          <Repeat2 className="size-3.5" aria-hidden /> {t("convertedNote")}
        </p>
      )}
      {view.englishFallback && (
        <InlineNotice tone="info" icon={<Languages />} className="mt-4">
          {t("englishFallback")}
        </InlineNotice>
      )}

      <div className="mt-6 space-y-10">
        {view.groups.map((g) => (
          <section key={g.panel} id={`panel-${g.panel}`} aria-labelledby={`h-${g.panel}`} className="scroll-mt-36">
            <h2 id={`h-${g.panel}`} className="mb-3 flex items-baseline gap-2 text-h2 font-semibold text-ink">
              {g.title}
              <span className="text-small font-normal text-ink-3">{g.markers.length}</span>
            </h2>
            <div className="space-y-3">
              {g.markers.map((m, i) => (
                <MarkerCard key={m.id} data={m} index={i} compact={m.tone === "ok"} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <SpecialistCard className="mt-10" title={t("whoToSee")} intro={t("whoToSeeIntro")} findLabel={t("findNearMe")} items={view.specialists} />

      <Disclaimer className="mt-10">{t("disclaimer")}</Disclaimer>
      {actions}
    </div>
  );
}
