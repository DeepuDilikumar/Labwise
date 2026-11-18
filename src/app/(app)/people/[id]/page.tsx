import { ChartLine } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Avatar } from "@/components/app/avatar";
import { PersonForm } from "@/components/app/person-form";
import { requireApp } from "@/server/context";
import { getPerson } from "@/server/data/people";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session } = await requireApp(`/people/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const person = await getPerson(session.userId, id);
  if (!person) notFound();
  const t = await getTranslations("people");
  return (
    <div className="mx-auto max-w-[36rem] px-4 pb-16 pt-8 sm:px-6">
      <div className="flex items-center gap-4">
        <Avatar name={person.name} color={person.color} size="lg" />
        <div>
          <h1 className="font-display text-[2.25rem] leading-[1.05] text-ink">{person.name}</h1>
          <Link href={`/trends?person=${person.id}`} className="mt-1 inline-flex items-center gap-1.5 text-small font-medium text-primary hover:underline">
            <ChartLine className="size-4" aria-hidden /> {t("seeTrends")}
          </Link>
        </div>
      </div>
      <PersonForm person={person} />
    </div>
  );
}
