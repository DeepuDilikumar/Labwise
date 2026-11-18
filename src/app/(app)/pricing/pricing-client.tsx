"use client";
import { CheckCircle2, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Script from "next/script";
import * as React from "react";
import { tryAgain } from "@/app/actions/documents";
import { completeCheckout, simulateLocalPayment, startCheckout } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PaymentTrust, PaywallCard, type PlanOption } from "@/components/ui/paywall-card";
import { InlineNotice } from "@/components/ui/states";
import { toast } from "@/components/ui/toast";
import type { Checkout } from "@/server/payments";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export function PricingClient({
  plans,
  docId,
  local,
  methods,
  entitlement,
}: {
  plans: PlanOption[];
  docId: string | null;
  local: boolean;
  methods: readonly string[];
  entitlement: { balance: number; subscribedUntil: string | null; used: number; limit: number };
}) {
  const t = useTranslations("pricingPage");
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [localOrder, setLocalOrder] = React.useState<Checkout | null>(null);

  const done = async () => {
    toast({ title: t("paid"), tone: "success" });
    if (docId) {
      const r = await tryAgain(docId);
      router.push(r.ok ? `/reports/${docId}` : "/home");
    } else router.refresh();
  };

  const buy = async (plan: PlanOption) => {
    setBusy(plan.id);
    const r = await startCheckout(plan.id);
    if (!r.ok) {
      toast({ title: t(`errors.${r.error}`), tone: "error" });
      setBusy(null);
      return;
    }
    if (r.checkout.provider === "local") {
      setLocalOrder(r.checkout);
      setBusy(null);
      return;
    }
    if (r.checkout.provider === "razorpay" && window.Razorpay) {
      new window.Razorpay({
        key: r.checkout.publicKey,
        order_id: r.checkout.orderId,
        amount: r.checkout.amountMinor,
        currency: r.checkout.currency,
        name: "Labwise",
        description: plan.name,
        config: { display: { preferences: { show_default_blocks: true } } },
        handler: async (resp: Record<string, string>) => {
          const ok = await completeCheckout(resp);
          if (ok.ok) await done();
          else toast({ title: t("errors.verify"), tone: "error" });
        },
        modal: { ondismiss: () => setBusy(null) },
      }).open();
      return;
    }
    toast({ title: t("errors.not_configured"), tone: "error" });
    setBusy(null);
  };

  return (
    <div className="mx-auto max-w-[var(--container-wide)] px-4 pb-16 pt-8 sm:px-6">
      {!local && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-[2.75rem] leading-[1.05] text-ink">{t("title")}</h1>
        <p className="mt-3 text-lead text-ink-2">{docId ? t("subtitleDoc") : t("subtitle")}</p>
      </div>
      <div className="mx-auto mt-6 max-w-2xl">
        {entitlement.subscribedUntil ? (
          <InlineNotice tone="ok" icon={<CheckCircle2 />}>{t("subscribed", { used: entitlement.used, limit: entitlement.limit, date: new Date(entitlement.subscribedUntil).toLocaleDateString() })}</InlineNotice>
        ) : (
          <InlineNotice tone="info">{t("balance", { count: entitlement.balance })}</InlineNotice>
        )}
        {local && <p className="mt-3 text-center text-caption text-ink-3">{t("localNote")}</p>}
      </div>
      <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
        {plans.map((p) => (
          <PaywallCard key={p.id} plan={p} onSelect={() => buy(p)} loading={busy === p.id} />
        ))}
      </div>
      <PaymentTrust className="mt-8" methods={methods} note={t("trust")} />
      <p className="mx-auto mt-6 max-w-xl text-center text-caption text-ink-3">{t("fine")}</p>

      <Dialog open={!!localOrder} onOpenChange={(o) => !o && setLocalOrder(null)}>
        {localOrder && (
          <DialogContent title={t("localTitle")} description={t("localBody")}>
            <div className="rounded-[16px] border border-line bg-surface-2 p-4">
              <p className="text-caption text-ink-3">{t("amount")}</p>
              <p className="text-h1 font-semibold tabular text-ink">
                {new Intl.NumberFormat(undefined, { style: "currency", currency: localOrder.currency }).format(localOrder.amountMinor / 100)}
              </p>
              <p className="mt-3 flex items-center gap-2 text-small text-ink-2"><Smartphone className="size-4" aria-hidden /> UPI · {t("testOnly")}</p>
            </div>
            <Button
              className="mt-5"
              block
              size="lg"
              loading={busy === "local"}
              onClick={async () => {
                setBusy("local");
                const sig = await simulateLocalPayment(localOrder.orderId);
                const ok = await completeCheckout(sig);
                setLocalOrder(null);
                setBusy(null);
                if (ok.ok) await done();
              }}
            >
              {t("payNow")}
            </Button>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
