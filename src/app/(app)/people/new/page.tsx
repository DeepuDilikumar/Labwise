import { getTranslations } from "next-intl/server";
import { PersonForm } from "@/components/app/person-form";
import { requireApp } from "@/server/context";

export default async function NewPersonPage() {
  await requireApp("/people/new");
  const t = await getTranslations("people");
  return (
    <div className="mx-auto max-w-[36rem] px-4 pb-16 pt-8 sm:px-6">
      <h1 className="font-display text-[2.5rem] leading-[1.05] text-ink">{t("newTitle")}</h1>
      <p className="mt-2 text-body text-ink-2">{t("newSubtitle")}</p>
      <PersonForm />
    </div>
  );
}
