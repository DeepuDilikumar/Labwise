import { Inbox } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { EmptyState } from "@/components/ui/states";
import { getSession } from "@/server/auth/session";
import { getProfile } from "@/server/profile";

// Milestone 1 shell: proves auth + profile + RLS end to end. The people vault replaces it in milestone 6.
export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/home");
  const profile = await getProfile();
  const t = await getTranslations("nav");
  return (
    <div className="mx-auto max-w-[var(--container-reading)] px-4 py-6">
      <header className="flex items-center justify-between">
        <Logo />
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">{t("signOut")}</Button>
        </form>
      </header>
      <p className="mt-10 text-small text-ink-3" data-testid="signed-in-as">{session.contact} · {profile?.region.toUpperCase()}</p>
      <Card className="mt-4">
        <EmptyState icon={<Inbox />} title="No reports yet" body="Uploading arrives in milestone 3." />
      </Card>
    </div>
  );
}
