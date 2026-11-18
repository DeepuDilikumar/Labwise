import "server-only";
import { getTranslations } from "next-intl/server";
import type { Locale, RegionConfig } from "@regions";
import { mapsUrl, routeDrugs, SPECIALIST_SEARCH } from "@content/specialist-rules";
import type { SpecialistSuggestion } from "@/components/ui/specialist-card";
import { allDrugs, type DrugClass } from "@/lib/drugs";
import type { RxItemRow } from "@/server/data/documents";

export interface RxItemView {
  id: string;
  written: string;
  generic: string | null;
  brandNote: string | null;
  howToTake: { label: string; value: string }[];
  usedFor: string | null;
  precautions: string[];
  confirmWithPharmacist: boolean;
}
export interface RxView {
  items: RxItemView[];
  specialists: SpecialistSuggestion[];
}

export async function buildRxView(opts: { items: RxItemRow[]; region: RegionConfig; locale: Locale }): Promise<RxView> {
  const t = await getTranslations("rx");
  const ts = await getTranslations("specialists");
  const drugs = allDrugs();
  const items = opts.items.map((i) => {
    const d = drugs.find((x) => x.id === i.generic_name) ?? null;
    const howToTake = [
      i.strength && { label: t("strength"), value: i.strength },
      i.form && { label: t("form"), value: i.form },
      i.frequency && { label: t("frequency"), value: i.frequency },
      i.duration && { label: t("duration"), value: i.duration },
      i.instructions && { label: t("instructions"), value: i.instructions },
    ].filter(Boolean) as { label: string; value: string }[];
    return {
      id: i.id,
      written: i.medicine,
      generic: d?.generic ?? null,
      brandNote: d && !i.medicine.toLowerCase().includes(d.generic.toLowerCase().split(" ")[0]) ? t("brandOf", { generic: d.generic }) : null,
      howToTake,
      usedFor: d?.usedFor ?? null,
      precautions: d?.precautions ?? [],
      confirmWithPharmacist: i.confidence < 0.8 || !d,
    };
  });
  const routes = routeDrugs(opts.items.map((i) => (i.drug_class as DrugClass) ?? null));
  const specialists = routes.map((r) => ({
    id: r.specialist,
    label: opts.region.specialistLabels[r.specialist] ?? ts(`names.${r.specialist}`),
    reason: ts(`reasons.${r.reasons[0]}`),
    mapsUrl: mapsUrl(opts.region.mapsQuery[r.specialist] ?? SPECIALIST_SEARCH[r.specialist]),
    primary: r.specialist === "primary_care",
  }));
  return { items, specialists };
}
