import { WifiOff } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// Static page cached by the service worker; shown when a navigation fails offline.
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 text-center">
      <Logo />
      <div className="mt-10 grid size-14 place-items-center rounded-[18px] border border-out-line bg-out-soft text-out">
        <WifiOff className="size-6" aria-hidden />
      </div>
      <h1 className="mt-5 text-h2 font-semibold text-ink">You&apos;re offline</h1>
      <p className="mt-2 text-small text-ink-3">Check your connection and try again. Nothing you&apos;ve saved has been lost.</p>
      <Link href="/home" className="mt-6 rounded-[12px] bg-primary px-5 py-3 text-small font-semibold text-primary-ink">
        Try again
      </Link>
    </main>
  );
}
