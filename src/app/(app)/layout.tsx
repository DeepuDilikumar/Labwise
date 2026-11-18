import { getTranslations } from "next-intl/server";
import { AppNav } from "@/components/app/app-nav";
import { requireApp } from "@/server/context";
import { getEntitlement } from "@/server/data/credits";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, region } = await requireApp();
  const t = await getTranslations("credits");
  const e = await getEntitlement(session.userId, region);
  const label = e.subscription ? t("subscribed") : t("balance", { count: e.balance });
  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <AppNav contact={session.contact} credits={label} />
      <div id="main">{children}</div>
    </div>
  );
}
