"use client";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { removePerson, savePerson } from "@/app/actions/people";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";

const RELATIONS = ["self", "mother", "father", "partner", "child", "sibling", "grandparent", "other"] as const;

export function PersonForm({ person }: { person?: { id: string; name: string; relation: string; birth_year: number | null; sex: string | null } }) {
  const t = useTranslations("people");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const isSelf = person?.relation === "self";
  return (
    <form
      className="mt-8 space-y-5"
      action={(fd) =>
        start(async () => {
          const r = await savePerson(person?.id ?? null, {
            name: fd.get("name"),
            relation: isSelf ? "self" : fd.get("relation"),
            birth_year: fd.get("birth_year") ? Number(fd.get("birth_year")) : null,
            sex: fd.get("sex") || null,
          });
          if (r && !r.ok) setError(t(`errors.${r.error}`));
        })
      }
    >
      <Field label={t("name")} htmlFor="name" error={error ?? undefined}>
        <Input name="name" defaultValue={person?.name} required maxLength={60} />
      </Field>
      {!isSelf && (
        <Field label={t("relation")} htmlFor="relation">
          <Select name="relation" defaultValue={person?.relation ?? "mother"}>
            {RELATIONS.filter((r) => r !== "self").map((r) => (
              <option key={r} value={r}>{t(`relations.${r}`)}</option>
            ))}
          </Select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label={t("birthYear")} htmlFor="birth_year" optional={t("optional")}>
          <Input name="birth_year" type="number" inputMode="numeric" min={1900} max={new Date().getFullYear()} defaultValue={person?.birth_year ?? ""} />
        </Field>
        <Field label={t("sex")} htmlFor="sex" optional={t("optional")}>
          <Select name="sex" defaultValue={person?.sex ?? ""}>
            <option value="">{t("preferNot")}</option>
            <option value="female">{t("female")}</option>
            <option value="male">{t("male")}</option>
            <option value="other">{t("otherSex")}</option>
          </Select>
        </Field>
      </div>
      <p className="text-caption text-ink-3">{t("whyAsk")}</p>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex gap-2">
          <Button type="submit" loading={pending}>{t("save")}</Button>
          <Button asChild variant="ghost"><Link href="/people">{t("cancel")}</Link></Button>
        </div>
        {person && !isSelf && (
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="danger"><Trash2 aria-hidden /> {t("delete")}</Button>
            </DialogTrigger>
            <DialogContent title={t("deleteTitle", { name: person.name })} description={t("deleteBody")}>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DialogClose asChild><Button variant="secondary">{t("cancel")}</Button></DialogClose>
                <Button variant="danger" onClick={() => start(() => removePerson(person.id))}>{t("deleteConfirm")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </form>
  );
}
