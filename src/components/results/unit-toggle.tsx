"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { setPref } from "@/app/actions/prefs";
import { Segmented } from "@/components/ui/segmented";

export function UnitToggle({ value }: { value: "conventional" | "si" }) {
  const t = useTranslations("prefs");
  const router = useRouter();
  const [v, setV] = React.useState(value);
  const [, start] = React.useTransition();
  return (
    <Segmented
      label={t("units")}
      value={v}
      onChange={(n) => {
        setV(n);
        start(async () => {
          await setPref("units", n);
          router.refresh();
        });
      }}
      options={[
        { value: "conventional", label: t("unitSystems.conventional") },
        { value: "si", label: t("unitSystems.si") },
      ]}
    />
  );
}
