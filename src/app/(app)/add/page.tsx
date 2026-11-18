import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireApp } from "@/server/context";
import { getEntitlement } from "@/server/data/credits";
import { listPeople } from "@/server/data/people";
import { UploadFlow } from "./upload-flow";

export const maxDuration = 120;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("upload");
  return { title: t("metaTitle") };
}

export default async function AddPage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const { person } = await searchParams;
  const { session, region } = await requireApp("/add");
  const [people, ent] = await Promise.all([listPeople(session.userId), getEntitlement(session.userId, region)]);
  return (
    <UploadFlow
      people={people.map((p) => ({ id: p.id, name: p.name, relation: p.relation }))}
      defaultPerson={person ?? people.find((p) => p.relation === "self")?.id ?? null}
      canProcess={ent.canProcess}
    />
  );
}
