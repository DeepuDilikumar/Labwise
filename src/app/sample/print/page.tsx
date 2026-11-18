import { getRegion } from "@regions";
import { PrintView } from "@/components/results/print-view";
import { fixtureFile } from "@/server/ai/local";
import { getPrefs } from "@/server/prefs";
import { SAMPLE_FIXTURE } from "@/server/sample";
import { loadSampleView } from "@/server/views/report";

export default async function SamplePrint() {
  const prefs = await getPrefs();
  const { entry } = await fixtureFile(SAMPLE_FIXTURE);
  const { view, meta, card } = await loadSampleView(entry.truth, { locale: prefs.locale, units: prefs.units, region: getRegion(prefs.region) });
  return <PrintView report={{ kind: "lab", view, meta, card }} />;
}
