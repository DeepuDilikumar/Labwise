import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ActionBar } from "@/components/results/action-bar";
import { DeleteReportButton } from "@/components/results/delete-report";
import { DocumentStatus } from "@/components/results/document-status";
import { ResultsView } from "@/components/results/results-view";
import { ReviewForm } from "@/components/results/review-form";
import { RxView } from "@/components/results/rx-view";
import { audit } from "@/server/audit";
import { requireApp } from "@/server/context";
import { getDocument, getLab } from "@/server/data/documents";
import { listPeople } from "@/server/data/people";
import { loadReport } from "@/server/views/report";

export const maxDuration = 120;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("results");
  return { title: t("metaTitle") };
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { session, prefs, region } = await requireApp(`/reports/${id}`);
  const doc = await getDocument(session.userId, id);
  if (!doc) notFound();
  const t = await getTranslations("results");
  const people = await listPeople(session.userId);
  const person = people.find((p) => p.id === doc.person_id) ?? null;

  const header = (
    <div className="mb-5 flex items-center justify-between">
      <Link href="/home" className="inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {t("back")}
      </Link>
      <DeleteReportButton id={id} />
    </div>
  );

  if (doc.status === "needs_review") {
    const lab = await getLab(session.userId, id);
    return (
      <div className="mx-auto max-w-[46rem] px-4 pb-32 pt-6 sm:px-6">
        {header}
        <ReviewForm
          documentId={id}
          markers={(lab?.markers ?? []).map((m) => ({ position: m.position, marker: m.raw_name, value: m.value_text, unit: m.unit, referenceRangeText: m.ref_text, confidence: m.confidence }))}
        />
      </div>
    );
  }
  if (doc.status !== "ready") {
    return (
      <div className="mx-auto max-w-[46rem] px-4 pb-32 pt-6 sm:px-6">
        {header}
        <DocumentStatus id={id} status={doc.status} error={doc.error_code} region={region.id} locale={prefs.locale} />
      </div>
    );
  }

  const loaded = await loadReport({ userId: session.userId, doc, personName: person?.name ?? null, locale: prefs.locale, units: prefs.units, region });
  if (!loaded) notFound();
  await audit(session.userId, "document.view", { type: "document", id });
  const actions = (
    <ActionBar
      shareCard={loaded.card}
      pdfUrl={`/print/${id}`}
      fileBase={`labwise-${(person?.name ?? "report").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      documentId={id}
      people={people.map((p) => ({ id: p.id, name: p.name }))}
      personId={doc.person_id}
    />
  );
  return loaded.kind === "prescription" ? (
    <RxView view={loaded.view} meta={loaded.meta} header={header} actions={actions} />
  ) : (
    <ResultsView view={loaded.view} meta={loaded.meta} units={prefs.units} allowUnitToggle={region.units.allowToggle} header={header} actions={actions} />
  );
}
