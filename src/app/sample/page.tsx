import { ArrowLeft, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getRegion } from "@regions";
import { Logo } from "@/components/ui/logo";
import { ActionBar } from "@/components/results/action-bar";
import { ResultsView } from "@/components/results/results-view";
import { fixtureFile } from "@/server/ai/local";
import { getPrefs } from "@/server/prefs";
import { SAMPLE_FIXTURE } from "@/server/sample";
import { loadSampleView } from "@/server/views/report";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sample");
  return { title: t("metaTitle") };
}

/** Zero-friction demo: no sign-in, no keys, no database. Same view code as real reports. */
export default async function SamplePage() {
  const prefs = await getPrefs();
  const region = getRegion(prefs.region);
  const t = await getTranslations("sample");
  const { entry } = await fixtureFile(SAMPLE_FIXTURE);
  const { view, meta, card } = await loadSampleView(entry.truth, { locale: prefs.locale, units: prefs.units, region });
  return (
    <div className="min-h-dvh">
      <header className="glass sticky top-0 z-30 border-b border-line">
        <div className="mx-auto flex h-16 max-w-[46rem] items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Labwise home"><Logo /></Link>
          <Link href="/sign-in?next=/add" className="text-small font-semibold text-primary hover:underline">{t("uploadYours")}</Link>
        </div>
      </header>
      <main id="main">
        <ResultsView
          view={view}
          meta={meta}
          units={prefs.units}
          allowUnitToggle={region.units.allowToggle}
          header={
            <div className="mb-5">
              <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-ink-3 hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden /> {t("back")}
              </Link>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-lilac px-3 py-1.5 text-small font-medium text-lilac-ink">
                <Sparkles className="size-4" aria-hidden /> {t("banner")}
              </p>
            </div>
          }
          actions={<ActionBar sample shareCard={card} pdfUrl="/sample/print" fileBase="labwise-sample" />}
        />
      </main>
    </div>
  );
}
