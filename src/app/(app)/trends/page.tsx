import { ChartLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Avatar } from "@/components/app/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { TrendChart } from "@/components/ui/trend-chart";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/cn";
import { requireApp } from "@/server/context";
import { listPeople } from "@/server/data/people";
import { getTrends, labCounts } from "@/server/data/trends";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("trendsPage");
  return { title: t("title") };
}

export default async function TrendsPage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const sp = await searchParams;
  const { session, prefs, region } = await requireApp("/trends");
  const t = await getTranslations("trendsPage");
  const people = await listPeople(session.userId);
  // Default to whoever has the most lab reports, so the page opens on something useful.
  const counts = await labCounts(session.userId);
  const busiest = [...people].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))[0];
  const person = people.find((p) => p.id === sp.person) ?? ((counts[busiest?.id] ?? 0) > 1 ? busiest : people.find((p) => p.relation === "self")) ?? people[0];
  const series = person ? await getTrends(session.userId, person.id, prefs.units) : [];
  const intl = region.intlLocale[prefs.locale];
  const fmt = (d: string) => new Intl.DateTimeFormat(intl, { month: "short", year: "numeric" }).format(new Date(d));
  const charted = series.filter((s) => s.points.length >= 2);
  const single = series.filter((s) => s.points.length === 1);

  return (
    <div className="mx-auto max-w-[var(--container-wide)] px-4 pb-16 pt-8 sm:px-6">
      <h1 className="font-display text-[2.5rem] leading-[1.05] text-ink">{t("title")}</h1>
      <p className="mt-2 text-body text-ink-2">{t("subtitle")}</p>

      <nav aria-label={t("people")} className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {people.map((p) => (
          <Link
            key={p.id}
            href={`/trends?person=${p.id}`}
            aria-current={p.id === person?.id ? "page" : undefined}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border pl-1.5 pr-4 text-small font-medium transition-colors",
              p.id === person?.id ? "border-primary bg-primary-soft text-primary-soft-ink" : "border-line bg-surface text-ink-2 hover:bg-surface-2",
            )}
          >
            <Avatar name={p.name} color={p.color} size="sm" /> {p.name}
          </Link>
        ))}
      </nav>

      {charted.length === 0 ? (
        <Card className="mt-6">
          <EmptyState
            icon={<ChartLine />}
            title={t("emptyTitle")}
            body={t("emptyBody")}
            action={
              <Button asChild>
                <Link href={`/add${person ? `?person=${person.id}` : ""}`}>{t("addReport")}</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {charted.map((s) => (
            <TrendChart
              key={s.id}
              title={s.name}
              unit={s.unit}
              bandLow={s.bandLow}
              bandHigh={s.bandHigh}
              points={s.points.map((p) => ({ date: `${p.date}-${p.documentId.slice(0, 4)}`, dateLabel: fmt(p.date), value: p.value, valueLabel: p.valueLabel, status: p.status, tone: p.tone }))}
            />
          ))}
        </div>
      )}

      {single.length > 0 && (
        <section className="mt-10">
          <h2 className="text-h3 font-semibold text-ink">{t("singleTitle")}</h2>
          <p className="mt-1 text-small text-ink-3">{t("singleBody")}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {single.map((s) => (
              <li key={s.id}>
                <Link href={`/reports/${s.points[0].documentId}`} className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface px-4 py-3 hover:bg-surface-2">
                  <span className="min-w-0">
                    <span className="block truncate text-small font-medium text-ink">{s.name}</span>
                    <span className="text-caption tabular text-ink-3">{s.points[0].valueLabel} {s.unit} · {fmt(s.points[0].date)}</span>
                  </span>
                  <StatusPill size="sm" status={s.points[0].status} tone={s.points[0].tone} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
