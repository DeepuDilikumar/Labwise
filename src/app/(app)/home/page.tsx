import { ArrowRight, Camera, ChevronRight, FileText, Pill, Plus, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Avatar } from "@/components/app/avatar";
import { SampleButton } from "@/components/app/sample-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { requireApp } from "@/server/context";
import { listReports } from "@/server/data/documents";
import { listPeople } from "@/server/data/people";
import { purgeExpiredOriginals } from "@/server/retention";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return { title: t("metaTitle") };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const { person: personFilter } = await searchParams;
  const { session, profile, prefs, region } = await requireApp("/home");
  await purgeExpiredOriginals(session.userId);
  const [t, people, reports] = await Promise.all([
    getTranslations("home"),
    listPeople(session.userId),
    listReports(session.userId, { personId: personFilter, limit: 40 }),
  ]);
  const intl = region.intlLocale[prefs.locale];
  const date = (d: string | null, fallback: string) =>
    new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric" }).format(new Date(d ?? fallback));
  const hour = new Date().getHours();
  const greet = hour < 12 ? t("morning") : hour < 17 ? t("afternoon") : t("evening");

  return (
    <div className="mx-auto max-w-[var(--container-wide)] px-4 pb-16 pt-8 sm:px-6">
      <header>
        <p className="text-small text-ink-3">{greet}</p>
        <h1 className="mt-1 font-display text-[2.5rem] leading-[1.05] text-ink">{profile.display_name ?? t("there")}</h1>
      </header>

      <section aria-labelledby="people-h" className="mt-8">
        <div className="flex items-center justify-between">
          <h2 id="people-h" className="text-h3 font-semibold text-ink">{t("people")}</h2>
          <Link href="/people" className="text-small font-medium text-primary hover:underline">{t("manage")}</Link>
        </div>
        <ul className="no-scrollbar -mx-4 mt-3 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <li>
            <Link href="/home" className="flex w-16 flex-col items-center gap-1.5 text-center">
              <span className={cn("grid size-16 place-items-center rounded-full border-2 text-small font-semibold", !personFilter ? "border-primary bg-primary-soft text-primary-soft-ink" : "border-line bg-surface text-ink-3")}>
                {t("all")}
              </span>
              <span className="text-caption text-ink-2">{t("everyone")}</span>
            </Link>
          </li>
          {people.map((p) => (
            <li key={p.id}>
              <Link href={`/home?person=${p.id}`} className="flex w-16 flex-col items-center gap-1.5 text-center" aria-current={personFilter === p.id ? "true" : undefined}>
                <Avatar name={p.name} color={p.color} size="lg" className={cn("ring-2 ring-offset-2 ring-offset-bg", personFilter === p.id ? "ring-primary" : "ring-transparent")} />
                <span className="w-full truncate text-caption text-ink-2">{p.relation === "self" ? t("me") : p.name}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/people/new" className="flex w-16 flex-col items-center gap-1.5 text-center">
              <span className="grid size-16 place-items-center rounded-full border-2 border-dashed border-line-strong text-ink-3 hover:border-primary hover:text-primary">
                <Plus className="size-5" aria-hidden />
              </span>
              <span className="text-caption text-ink-2">{t("addPerson")}</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <Link
          href="/add"
          className="group relative overflow-hidden rounded-[var(--radius-2xl)] bg-primary p-6 text-primary-ink shadow-[0_16px_40px_-16px_var(--primary)] transition-transform hover:-translate-y-0.5"
        >
          <div aria-hidden className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
          <span className="relative grid size-12 place-items-center rounded-[16px] bg-white/15">
            <Camera className="size-6" aria-hidden />
          </span>
          <h2 className="relative mt-5 text-h2 font-semibold">{t("addTitle")}</h2>
          <p className="relative mt-1 text-small opacity-90">{t("addBody")}</p>
          <span className="relative mt-5 inline-flex items-center gap-1.5 text-small font-semibold">
            {t("addCta")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
        <div className="rounded-[var(--radius-2xl)] border border-line bg-lilac p-6">
          <span className="grid size-12 place-items-center rounded-[16px] bg-surface/70 text-lilac-ink">
            <Sparkles className="size-6" aria-hidden />
          </span>
          <h2 className="mt-5 text-h3 font-semibold text-ink">{t("sampleTitle")}</h2>
          <p className="mt-1 text-small text-ink-2">{t("sampleBody")}</p>
          <SampleButton className="mt-4" label={t("sampleCta")} />
        </div>
      </section>

      <section aria-labelledby="reports-h" className="mt-10">
        <h2 id="reports-h" className="text-h3 font-semibold text-ink">{t("recent")}</h2>
        {reports.length === 0 ? (
          <Card className="mt-3">
            <EmptyState icon={<FileText />} title={t("emptyTitle")} body={t("emptyBody")} />
          </Card>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {reports.map((r) => {
              const isRx = r.kind === "prescription";
              const statusLine =
                r.status !== "ready"
                  ? t(`status.${r.status}`)
                  : isRx
                    ? t("medicines", { count: r.item_count })
                    : r.critical_count
                      ? t("speakSoon")
                      : r.discuss_count
                        ? t("discuss", { count: r.discuss_count })
                        : t("allInRange");
              const tone = r.status !== "ready" ? "text-ink-3" : r.critical_count ? "text-crit" : r.discuss_count ? "text-out" : isRx ? "text-ink-2" : "text-ok";
              return (
                <li key={r.id}>
                  <Link
                    href={`/reports/${r.id}`}
                    className="group flex items-center gap-4 rounded-[var(--radius-xl)] border border-line bg-surface p-4 shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                  >
                    <span className={cn("grid size-12 shrink-0 place-items-center rounded-[14px]", isRx ? "bg-lilac text-lilac-ink" : "bg-mint text-mint-ink")}>
                      {isRx ? <Pill className="size-5" aria-hidden /> : <FileText className="size-5" aria-hidden />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">
                        {isRx ? t("prescription") : r.lab_name ?? t("labReport")}
                        {r.is_sample && <span className="ml-2 rounded-full bg-lilac px-2 py-0.5 align-middle text-caption font-medium text-lilac-ink">{t("sample")}</span>}
                      </p>
                      <p className="mt-0.5 truncate text-small text-ink-3">
                        {[r.person_name, date(r.report_date, r.created_at)].filter(Boolean).join(" · ")}
                      </p>
                      <p className={cn("mt-1 text-small font-medium", tone)}>{statusLine}</p>
                    </div>
                    <ChevronRight className="size-5 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
