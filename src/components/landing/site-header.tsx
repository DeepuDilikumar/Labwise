"use client";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/ui/switchers";
import { cn } from "@/lib/cn";
import type { Locale } from "@regions";

export function SiteHeader({ locales, signedIn }: { locales: readonly Locale[]; signedIn: boolean }) {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 12));
  const links = [
    { href: "/#how", label: t("howItWorks") },
    { href: "/#try", label: t("tryIt") },
    { href: "/#pricing", label: t("pricing") },
    { href: "/#faq", label: t("faq") },
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-[var(--container-wide)] items-center justify-between rounded-[18px] px-3 transition-all duration-300 sm:px-4",
          scrolled || open ? "glass border border-line shadow-[var(--shadow-md)]" : "border border-transparent",
        )}
      >
        <Link href="/" aria-label="Labwise home" className="rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="rounded-[10px] px-3 py-2 text-small font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          <LanguageSwitcher locales={locales} compact />
          <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
            <Link href={signedIn ? "/home" : "/sign-in"}>{signedIn ? t("openApp") : t("signIn")}</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/sign-in?next=/home">{t("getStarted")}</Link>
          </Button>
          <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label={t("menu")} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass mx-auto mt-2 max-w-[var(--container-wide)] rounded-[18px] border border-line p-2 shadow-[var(--shadow-lg)] md:hidden"
          >
            <ul>
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-[12px] px-3 text-body font-medium text-ink hover:bg-surface-2">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line p-2 pt-3">
              <Button asChild variant="secondary">
                <Link href={signedIn ? "/home" : "/sign-in"}>{signedIn ? t("openApp") : t("signIn")}</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-in?next=/home">{t("getStarted")}</Link>
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
