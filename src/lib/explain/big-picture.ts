import { isCritical, isWorthDiscussing, type MarkerStatus } from "@/lib/domain/status";
import { PANEL_ORDER, type Panel } from "@/lib/markers";

type T = (key: string, values?: Record<string, string | number>) => string;

export interface BigPictureInput {
  name: string;
  panel: Panel | null;
  status: MarkerStatus;
}
export interface BigPicture {
  headline: string;
  bullets: string[];
  reassurance: string | null;
  counts: { inRange: number; discuss: number; noRange: number; total: number; critical: number };
}

/**
 * Deterministic "big picture" — counts and groupings come from the status engine, wording
 * from translated messages. No LLM needed, so it is always correct and always localised.
 */
export function buildBigPicture(items: BigPictureInput[], t: T, panelName: (p: Panel) => string): BigPicture {
  const counts = {
    inRange: items.filter((i) => i.status === "in_range").length,
    discuss: items.filter((i) => isWorthDiscussing(i.status)).length,
    noRange: items.filter((i) => i.status === "no_range" || i.status === "unparsed").length,
    total: items.length,
    critical: items.filter((i) => isCritical(i.status)).length,
  };
  const ranged = counts.inRange + counts.discuss;
  const headline =
    counts.critical > 0
      ? t("headlineCritical", { count: counts.critical })
      : counts.discuss === 0
        ? t("headlineAllClear")
        : counts.inRange / Math.max(ranged, 1) >= 0.75
          ? t("headlineMostly")
          : t("headlineSome");

  const bullets: string[] = [];
  if (ranged > 0) bullets.push(t("countLine", { inRange: counts.inRange, total: ranged }));

  const byPanel = new Map<Panel, BigPictureInput[]>();
  for (const i of items) if (i.panel) byPanel.set(i.panel, [...(byPanel.get(i.panel) ?? []), i]);
  const outPanels = PANEL_ORDER.filter((p) => byPanel.get(p)?.some((i) => isWorthDiscussing(i.status)));
  const clearPanels = PANEL_ORDER.filter((p) => byPanel.get(p)?.length && byPanel.get(p)!.every((i) => i.status === "in_range"));

  for (const p of outPanels.slice(0, 2)) {
    const out = byPanel.get(p)!.filter((i) => isWorthDiscussing(i.status));
    const names = out.slice(0, 3).map((i) => i.name).join(", ");
    const allHigh = out.every((i) => i.status === "high" || i.status === "critical_high");
    const allLow = out.every((i) => i.status === "low" || i.status === "critical_low");
    bullets.push(t(allHigh ? "panelHigh" : allLow ? "panelLow" : "panelMixed", { panel: panelName(p), names }));
  }
  if (outPanels.length > 2) bullets.push(t("morePanels", { count: outPanels.length - 2 }));
  if (clearPanels.length) {
    const list = clearPanels.slice(0, 4).map(panelName);
    bullets.push(t("panelsClear", { panels: list.join(", ") }));
  }
  if (counts.noRange > 0) bullets.push(t("noRangeLine", { count: counts.noRange }));

  const reassurance = counts.critical > 0 ? null : counts.discuss > 0 ? t("reassureSome") : t("reassureAll");
  return { headline, bullets: bullets.slice(0, 4), reassurance, counts };
}
