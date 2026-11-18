"use client";
import { Check, Globe, Languages, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import * as DM from "@radix-ui/react-dropdown-menu";
import { setPref } from "@/app/actions/prefs";
import { cn } from "@/lib/cn";
import type { Locale, RegionId } from "@regions";

const LOCALE_NAMES: Record<Locale, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  hi: { native: "हिन्दी", english: "Hindi" },
  ml: { native: "മലയാളം", english: "Malayalam" },
};

function Menu({
  trigger,
  label,
  items,
  value,
  onSelect,
  align = "end",
}: {
  trigger: React.ReactNode;
  label: string;
  items: { value: string; label: React.ReactNode; hint?: string; lang?: string }[];
  value: string;
  onSelect: (v: string) => void;
  align?: "start" | "end";
}) {
  return (
    <DM.Root>
      <DM.Trigger
        aria-label={label}
        className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-2.5 text-small font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink data-[state=open]:bg-surface-2"
      >
        {trigger}
      </DM.Trigger>
      <DM.Portal>
        <DM.Content
          align={align}
          sideOffset={6}
          className="z-50 min-w-48 rounded-[14px] border border-line bg-surface p-1.5 shadow-[var(--shadow-lg)] data-[state=open]:animate-[fade-in_120ms_ease-out]"
        >
          <DM.Label className="px-2.5 pb-1 pt-1.5 text-caption text-ink-3">{label}</DM.Label>
          {items.map((it) => (
            <DM.Item
              key={it.value}
              onSelect={() => onSelect(it.value)}
              lang={it.lang}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-2.5 text-small text-ink outline-none data-[highlighted]:bg-surface-2"
            >
              <span className="flex-1">
                {it.label}
                {it.hint && <span className="ml-2 text-ink-3">{it.hint}</span>}
              </span>
              <Check className={cn("size-4 text-primary", it.value === value ? "opacity-100" : "opacity-0")} aria-hidden />
            </DM.Item>
          ))}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}

export function LanguageSwitcher({ locales, compact }: { locales: readonly Locale[]; compact?: boolean }) {
  const t = useTranslations("prefs");
  const current = useLocale() as Locale;
  const router = useRouter();
  const [, start] = React.useTransition();
  if (locales.length < 2) return null;
  return (
    <Menu
      label={t("language")}
      value={current}
      trigger={
        <>
          <Languages className="size-4" aria-hidden />
          <span className={cn(compact && "sr-only sm:not-sr-only")}>{LOCALE_NAMES[current].native}</span>
        </>
      }
      items={locales.map((l) => ({
        value: l,
        label: LOCALE_NAMES[l].native,
        hint: l === "en" ? undefined : LOCALE_NAMES[l].english,
        lang: l,
      }))}
      onSelect={(v) => start(async () => {
        await setPref("locale", v as Locale);
        router.refresh();
      })}
    />
  );
}

export function RegionSwitcher({ region }: { region: RegionId }) {
  const t = useTranslations("prefs");
  const router = useRouter();
  const [, start] = React.useTransition();
  return (
    <Menu
      label={t("region")}
      value={region}
      trigger={
        <>
          <MapPin className="size-4" aria-hidden />
          <span>{t(`regions.${region}`)}</span>
        </>
      }
      items={(["in", "us"] as const).map((r) => ({ value: r, label: t(`regions.${r}`) }))}
      onSelect={(v) => start(async () => {
        await setPref("region", v as RegionId);
        router.refresh();
      })}
    />
  );
}

export { Globe };
