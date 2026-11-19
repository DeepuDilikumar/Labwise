import "server-only";
import { getTranslations } from "next-intl/server";
import type { ShareCardData } from "@/components/results/share-card";
import { statusLabelKey } from "@/lib/domain/status-label";
import { directionOf } from "@/lib/domain/status";
import type { LabView } from "./lab-view";
import type { RxView } from "./rx-view";

export async function labShareCard(view: LabView, meta: string): Promise<ShareCardData> {
  const t = await getTranslations("share");
  const ts = await getTranslations("status");
  const tr = await getTranslations("results");
  const all = view.groups.flatMap((g) => g.markers);
  const discuss = all.filter((m) => m.tone !== "ok" && m.tone !== "neutral");
  const items = (discuss.length ? discuss : all).slice(0, 4);
  const rest = (discuss.length ? discuss.length : all.length) - items.length;
  return {
    eyebrow: tr("bigPicture"),
    headline: view.bigPicture.headline,
    meta,
    counts: view.overview.slice(0, 2).map((o) => ({ label: o.label, value: o.value })),
    items: items.map((m) => ({
      name: m.name,
      value: `${m.valueLabel}${m.unit ? ` ${m.unit}` : ""}`,
      status: ts(statusLabelKey(m.status, m.tone)),
      tone: m.tone,
      dir: directionOf(m.status),
    })),
    moreLabel: rest > 0 ? t("more", { count: rest }) : null,
    disclaimer: t("disclaimer"),
    watermark: t("watermark"),
  };
}

export async function rxShareCard(view: RxView, meta: string): Promise<ShareCardData> {
  const t = await getTranslations("share");
  const tr = await getTranslations("rx");
  return {
    eyebrow: tr("eyebrow"),
    headline: tr("title", { count: view.items.length }),
    meta,
    counts: [],
    items: view.items.slice(0, 4).map((i) => ({
      name: i.written,
      value: i.howToTake.find((h) => h.label)?.value ?? "",
      status: i.generic ?? tr("asWrittenShort"),
      tone: "neutral",
      dir: null,
    })),
    moreLabel: view.items.length > 4 ? t("more", { count: view.items.length - 4 }) : null,
    disclaimer: `${tr("followDoctor")} ${t("disclaimer")}`,
    watermark: t("watermark"),
  };
}
