"use client";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { signOut } from "@/app/actions/auth";
import { setPref } from "@/app/actions/prefs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import type { Prefs } from "@/lib/prefs";
import type { Locale } from "@regions";

const NATIVE: Record<Locale, string> = { en: "English", hi: "हिन्दी", ml: "മലയാളം" };

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-ink">{label}</p>
        {hint && <p className="text-small text-ink-3">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsClient({ prefs, contact, locales, allowUnits }: { prefs: Prefs; contact: string; locales: readonly Locale[]; allowUnits: boolean }) {
  const t = useTranslations("settings");
  const tp = useTranslations("prefs");
  const router = useRouter();
  const [p, setP] = React.useState(prefs);
  const [, start] = React.useTransition();
  const save = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setP((x) => ({ ...x, [key]: value }));
    if (key === "theme") {
      const d = document.documentElement;
      d.dataset.themePref = String(value);
      d.dataset.theme = value === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : String(value);
    }
    if (key === "text") document.documentElement.dataset.text = String(value);
    start(async () => {
      await setPref(key, value);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-[46rem] px-4 pb-16 pt-8 sm:px-6">
      <h1 className="font-display text-[2.5rem] leading-[1.05] text-ink">{t("title")}</h1>
      <Card className="mt-6 divide-y divide-line p-5 sm:p-6">
        {locales.length > 1 && (
          <Row label={tp("language")} hint={t("languageHint")}>
            <Segmented label={tp("language")} value={p.locale} onChange={(v) => save("locale", v)} options={locales.map((l) => ({ value: l, label: <span lang={l}>{NATIVE[l]}</span> }))} />
          </Row>
        )}
        <Row label={tp("region")} hint={t("regionHint")}>
          <Segmented label={tp("region")} value={p.region} onChange={(v) => save("region", v)} options={[{ value: "in", label: tp("regions.in") }, { value: "us", label: tp("regions.us") }]} />
        </Row>
        {allowUnits && (
          <Row label={tp("units")} hint={t("unitsHint")}>
            <Segmented label={tp("units")} value={p.units} onChange={(v) => save("units", v)} options={[{ value: "conventional", label: tp("unitSystems.conventional") }, { value: "si", label: tp("unitSystems.si") }]} />
          </Row>
        )}
        <Row label={tp("textSize")} hint={t("textHint")}>
          <Segmented label={tp("textSize")} value={p.text} onChange={(v) => save("text", v)} options={[{ value: "default", label: tp("textSizes.default") }, { value: "large", label: tp("textSizes.large") }]} />
        </Row>
        <Row label={tp("theme")}>
          <Segmented label={tp("theme")} value={p.theme} onChange={(v) => save("theme", v)} options={(["system", "light", "dark"] as const).map((v) => ({ value: v, label: tp(`themes.${v}`) }))} />
        </Row>
      </Card>
      <Card className="mt-4 flex items-center justify-between gap-3 p-5 sm:p-6">
        <div className="min-w-0">
          <p className="font-medium text-ink">{t("account")}</p>
          <p className="truncate text-small text-ink-3">{contact}</p>
        </div>
        <form action={signOut}>
          <Button variant="secondary" type="submit"><LogOut aria-hidden /> {t("signOut")}</Button>
        </form>
      </Card>
    </div>
  );
}
