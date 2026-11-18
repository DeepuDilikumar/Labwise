import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Avatar } from "@/components/app/avatar";
import { Button } from "@/components/ui/button";
import { requireApp } from "@/server/context";
import { listReports } from "@/server/data/documents";
import { listPeople } from "@/server/data/people";

export default async function PeoplePage() {
  const { session } = await requireApp("/people");
  const t = await getTranslations("people");
  const [people, reports] = await Promise.all([listPeople(session.userId), listReports(session.userId, { limit: 500 })]);
  return (
    <div className="mx-auto max-w-[46rem] px-4 pb-16 pt-8 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.5rem] leading-[1.05] text-ink">{t("title")}</h1>
          <p className="mt-2 text-body text-ink-2">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/people/new"><Plus aria-hidden /> {t("add")}</Link>
        </Button>
      </div>
      <ul className="mt-8 space-y-3">
        {people.map((p) => {
          const count = reports.filter((r) => r.person_id === p.id).length;
          return (
            <li key={p.id}>
              <Link href={`/people/${p.id}`} className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-line bg-surface p-4 shadow-[var(--shadow-xs)] transition-colors hover:bg-surface-2">
                <Avatar name={p.name} color={p.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{p.name}</p>
                  <p className="text-small text-ink-3">{t(`relations.${p.relation}`)} · {t("reports", { count })}</p>
                </div>
                <ChevronRight className="size-5 text-ink-3" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
