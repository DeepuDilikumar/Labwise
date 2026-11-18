import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegion } from "@regions";
import { legalDoc, type LegalDoc } from "@content/legal";
import { InlineNotice } from "@/components/ui/states";
import { Logo } from "@/components/ui/logo";
import { getPrefs } from "@/server/prefs";

const DOCS: LegalDoc[] = ["privacy", "terms", "disclaimer"];

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  if (!DOCS.includes(doc as LegalDoc)) return {};
  return { title: legalDoc(doc as LegalDoc, getRegion((await getPrefs()).region)).title };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!DOCS.includes(doc as LegalDoc)) notFound();
  const region = getRegion((await getPrefs()).region);
  const d = legalDoc(doc as LegalDoc, region);
  return (
    <div className="mx-auto max-w-[var(--container-reading)] px-4 pb-24 pt-6 sm:px-6">
      <Link href="/" aria-label="Labwise home">
        <Logo />
      </Link>
      <h1 className="mt-12 font-display text-display text-ink">{d.title}</h1>
      <p className="mt-2 text-small text-ink-3">
        {region.name} · {region.legal.policyVersion}
      </p>
      <InlineNotice tone="warn" className="mt-6">
        Draft — needs legal review before launch.
      </InlineNotice>
      <div className="mt-10 space-y-10">
        {d.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-h2 font-semibold text-ink">{s.heading}</h2>
            <div className="mt-3 space-y-3 text-body text-ink-2">
              {s.body.map((p) => (
                <p key={p} className="text-pretty">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
