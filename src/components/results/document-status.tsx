"use client";
import { CreditCard, FileQuestion, FileWarning, RotateCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { startSample, tryAgain } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProcessingSteps } from "@/components/ui/processing-steps";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { toast } from "@/components/ui/toast";

export function DocumentStatus({ id, status, error }: { id: string; status: string; error: string | null; region: string; locale: string }) {
  const t = useTranslations("status_page");
  const ts = useTranslations("landing.scene");
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (status !== "processing" && status !== "uploaded") return;
    const tick = setInterval(() => setStep((s) => Math.min(2, s + 1)), 2500);
    const poll = setInterval(() => router.refresh(), 3000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [status, router]);

  const retry = () =>
    start(async () => {
      const r = await tryAgain(id);
      if (!r.ok) toast({ title: t.has(`errors.${r.error}`) ? t(`errors.${r.error}`) : t("errors.generic"), tone: "error" });
      router.refresh();
    });
  const sample = () =>
    start(async () => {
      const r = await startSample();
      if (r.ok) router.push(`/reports/${r.id}`);
    });

  if (status === "processing" || status === "uploaded") {
    return (
      <Card className="p-8">
        <h1 className="font-display text-[2rem] leading-tight text-ink">{t("processingTitle")}</h1>
        <p className="mt-2 text-body text-ink-3">{t("processingBody")}</p>
        <ProcessingSteps className="mt-8" steps={[ts("step1"), ts("step2"), ts("step3")]} active={step} />
      </Card>
    );
  }
  if (status === "awaiting_payment") {
    return (
      <Card>
        <EmptyState
          icon={<CreditCard />}
          title={t("paymentTitle")}
          body={t("paymentBody")}
          action={
            <Button asChild size="lg">
              <Link href={`/pricing?doc=${id}`}>{t("paymentCta")}</Link>
            </Button>
          }
        />
      </Card>
    );
  }
  if (status === "rejected") {
    return (
      <Card>
        <EmptyState
          icon={<FileQuestion />}
          title={t("rejectedTitle")}
          body={t("rejectedBody")}
          action={
            <Button asChild variant="secondary">
              <Link href="/add">{t("tryAnother")}</Link>
            </Button>
          }
        />
      </Card>
    );
  }
  const known = ["ai_unavailable", "unreadable", "ai_refused", "rate_limited", "no_results", "pdf_unreadable"];
  const code = error && known.includes(error) ? error : "generic";
  return (
    <Card>
      <ErrorState
        title={t(`failed.${code}.title`)}
        body={t(`failed.${code}.body`)}
        action={
          <>
            {code === "ai_unavailable" ? (
              <Button onClick={sample} loading={pending}>
                <Sparkles aria-hidden /> {t("seeSample")}
              </Button>
            ) : (
              <Button onClick={retry} loading={pending} variant="secondary">
                <RotateCw aria-hidden /> {t("retry")}
              </Button>
            )}
            <Button asChild variant="ghost">
              <Link href="/add">
                <FileWarning aria-hidden /> {t("tryAnother")}
              </Link>
            </Button>
          </>
        }
      />
    </Card>
  );
}
