import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getRegion } from "@regions";
import { PrintView } from "@/components/results/print-view";
import { getSession } from "@/server/auth/session";
import { getDocument } from "@/server/data/documents";
import { getPerson } from "@/server/data/people";
import { getPrefs } from "@/server/prefs";
import { loadReport } from "@/server/views/report";

export const metadata: Metadata = { title: "Report summary", robots: { index: false } };

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=/print/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const doc = await getDocument(session.userId, id);
  if (!doc || doc.status !== "ready") notFound();
  const prefs = await getPrefs();
  const person = doc.person_id ? await getPerson(session.userId, doc.person_id) : null;
  const report = await loadReport({ userId: session.userId, doc, personName: person?.name ?? null, locale: prefs.locale, units: prefs.units, region: getRegion(prefs.region) });
  if (!report) notFound();
  return <PrintView report={report} />;
}
