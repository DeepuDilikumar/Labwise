"use client";
import * as DM from "@radix-ui/react-dropdown-menu";
import { ChartLine, CircleHelp, CreditCard, House, LogOut, Plus, Settings, ShieldCheck, UserRound } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/home", key: "home", icon: House },
  { href: "/trends", key: "trends", icon: ChartLine },
  { href: "/add", key: "add", icon: Plus },
  { href: "/privacy", key: "privacy", icon: ShieldCheck },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

export function AppNav({ contact, credits }: { contact: string; credits: string }) {
  const t = useTranslations("nav");
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(href + "/");
  return (
    <>
      <header className="glass sticky top-0 z-30 border-b border-line">
        <div className="mx-auto flex h-16 max-w-[var(--container-wide)] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/home" aria-label={t("home")}>
            <Logo />
          </Link>
          <nav aria-label="App" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {TABS.filter((x) => x.key !== "add").map(({ href, key }) => (
                <li key={key}>
                  <Link
                    href={href}
                    aria-current={active(href) ? "page" : undefined}
                    className={cn(
                      "relative block rounded-[10px] px-3 py-2 text-small font-medium transition-colors",
                      active(href) ? "text-ink" : "text-ink-3 hover:text-ink",
                    )}
                  >
                    {active(href) && (
                      <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-[10px] bg-surface-2" transition={{ duration: 0.2 }} />
                    )}
                    <span className="relative">{t(key)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="hidden rounded-full border border-line bg-surface px-3 py-1.5 text-caption font-medium text-ink-2 hover:bg-surface-2 sm:inline-flex"
            >
              {credits}
            </Link>
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/add">
                <Plus aria-hidden /> {t("add")}
              </Link>
            </Button>
            <DM.Root>
              <DM.Trigger
                aria-label={t("account")}
                className="grid size-10 place-items-center rounded-full border border-line bg-surface text-ink-2 hover:bg-surface-2"
              >
                <UserRound className="size-[18px]" />
              </DM.Trigger>
              <DM.Portal>
                <DM.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-56 rounded-[14px] border border-line bg-surface p-1.5 shadow-[var(--shadow-lg)]"
                >
                  <DM.Label className="truncate px-2.5 py-2 text-caption text-ink-3">{contact}</DM.Label>
                  {[
                    { href: "/pricing", icon: CreditCard, label: t("pricing") },
                    { href: "/privacy", icon: ShieldCheck, label: t("privacy") },
                    { href: "/settings", icon: Settings, label: t("settings") },
                    { href: "/help", icon: CircleHelp, label: t("help") },
                  ].map(({ href, icon: Icon, label }) => (
                    <DM.Item key={href} asChild>
                      <Link
                        href={href}
                        className="flex min-h-11 items-center gap-3 rounded-[10px] px-2.5 text-small text-ink outline-none data-[highlighted]:bg-surface-2"
                      >
                        <Icon className="size-4 text-ink-3" aria-hidden /> {label}
                      </Link>
                    </DM.Item>
                  ))}
                  <DM.Separator className="my-1 h-px bg-line" />
                  <DM.Item
                    onSelect={() => void signOut()}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-2.5 text-small text-ink outline-none data-[highlighted]:bg-surface-2"
                  >
                    <LogOut className="size-4 text-ink-3" aria-hidden /> {t("signOut")}
                  </DM.Item>
                </DM.Content>
              </DM.Portal>
            </DM.Root>
          </div>
        </div>
      </header>

      <nav aria-label="App tabs" className="glass safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line pt-1.5 md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
          {TABS.map(({ href, key, icon: Icon }) => {
            const on = active(href);
            if (key === "add")
              return (
                <li key={key} className="flex justify-center">
                  <Link
                    href={href}
                    aria-label={t("add")}
                    className="-mt-6 grid size-14 place-items-center rounded-[20px] bg-primary text-primary-ink shadow-[0_10px_24px_-8px_var(--primary)] transition-transform active:scale-95"
                  >
                    <Icon className="size-6" strokeWidth={2.4} aria-hidden />
                  </Link>
                </li>
              );
            return (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium",
                    on ? "text-primary" : "text-ink-3",
                  )}
                >
                  <Icon className="size-[22px]" strokeWidth={on ? 2.3 : 1.8} aria-hidden />
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
