"use client";
import { Download, FileDown, History, Lock, MapPin, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { deleteMyData, setRetention, updateConsent } from "@/app/actions/privacy";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { InlineNotice } from "@/components/ui/states";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";

type Purpose = "process_reports" | "ai_processing" | "store_history";

function Section({ icon, title, body, children }: { icon: React.ReactNode; title: string; body?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-2 text-ink-2 [&_svg]:size-[18px]">{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-h3 font-semibold text-ink">{title}</h2>
          {body && <p className="mt-0.5 text-small text-ink-3">{body}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function PrivacyClient({
  consents,
  retention,
  access,
  residency,
  law,
}: {
  consents: { purpose: Purpose; granted: boolean; at: string | null }[];
  retention: number;
  access: { action: string; at: string }[];
  residency: string;
  law: string;
}) {
  const t = useTranslations("privacyCentre");
  const tc = useTranslations("onboarding.c");
  const [ret, setRet] = React.useState(String(retention));
  const [confirm, setConfirm] = React.useState("");
  const [pending, start] = React.useTransition();
  const required = ["process_reports", "ai_processing"];
  const blocked = consents.some((c) => required.includes(c.purpose) && !c.granted);

  return (
    <div className="mx-auto max-w-[46rem] px-4 pb-16 pt-8 sm:px-6">
      <h1 className="font-display text-[2.5rem] leading-[1.05] text-ink">{t("title")}</h1>
      <p className="mt-2 text-body text-ink-2">{t("subtitle")}</p>
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {[t("promise1"), t("promise2"), t("promise3")].map((p) => (
          <p key={p} className="flex items-start gap-2 rounded-[14px] bg-mint p-3 text-small font-medium text-mint-ink">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> {p}
          </p>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <Section icon={<Lock />} title={t("consentsTitle")} body={t("consentsBody")}>
          {blocked && <InlineNotice tone="warn" className="mb-4">{t("blocked")}</InlineNotice>}
          <ul className="divide-y divide-line">
            {consents.map((c) => (
              <li key={c.purpose} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{tc(c.purpose)}</p>
                  <p className="text-small text-ink-3">{tc(`${c.purpose}Body`)}</p>
                  <p className="mt-1 text-caption text-ink-3">{c.at ? t(c.granted ? "grantedAt" : "withdrawnAt", { date: c.at }) : t("never")}</p>
                </div>
                <Switch
                  checked={c.granted}
                  aria-label={tc(c.purpose)}
                  onCheckedChange={(v) => start(async () => {
                    await updateConsent(c.purpose, v);
                    toast({ title: v ? t("consentOn") : t("consentOff"), tone: "success" });
                  })}
                />
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={<History />} title={t("retentionTitle")} body={t("retentionBody")}>
          <Segmented
            className="w-full"
            label={t("retentionTitle")}
            value={ret}
            onChange={(v) => {
              setRet(v);
              start(async () => {
                await setRetention(Number(v));
                toast({ title: t("retentionSaved"), tone: "success" });
              });
            }}
            options={[
              { value: "1", label: t("days", { count: 1 }) },
              { value: "7", label: t("days", { count: 7 }) },
              { value: "30", label: t("days", { count: 30 }) },
              { value: "90", label: t("days", { count: 90 }) },
              { value: "365", label: t("year") },
            ]}
          />
          <p className="mt-3 flex items-center gap-1.5 text-caption text-ink-3"><MapPin className="size-3.5" aria-hidden /> {residency}</p>
        </Section>

        <Section icon={<Download />} title={t("exportTitle")} body={t("exportBody")}>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <a href="/api/export" download><FileDown aria-hidden /> {t("exportJson")}</a>
            </Button>
          </div>
          <p className="mt-3 text-caption text-ink-3">{t("exportPdfHint")}</p>
        </Section>

        <Section icon={<History />} title={t("accessTitle")} body={t("accessBody")}>
          {access.length === 0 ? (
            <p className="text-small text-ink-3">{t("accessEmpty")}</p>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              {access.map((a, i) => (
                <li key={i} className="flex justify-between gap-3 text-small">
                  <span className="text-ink-2">{t.has(`actions.${a.action.replace(/\./g, "_")}`) ? t(`actions.${a.action.replace(/\./g, "_")}`) : a.action}</span>
                  <span className="shrink-0 tabular text-ink-3">{a.at}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Card className="border-crit-line p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-h3 font-semibold text-ink"><Trash2 className="size-5 text-crit" aria-hidden /> {t("deleteTitle")}</h2>
          <p className="mt-1 text-small text-ink-2">{t("deleteBody")}</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="danger" className="mt-4">{t("deleteButton")}</Button>
            </DialogTrigger>
            <DialogContent title={t("deleteConfirmTitle")} description={t("deleteConfirmBody")}>
              <label className="text-small font-medium text-ink" htmlFor="confirm-delete">{t("typeDelete")}</label>
              <Input id="confirm-delete" className="mt-1.5" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" placeholder="DELETE" />
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DialogClose asChild><Button variant="secondary">{t("cancel")}</Button></DialogClose>
                <Button variant="danger" disabled={confirm.trim().toUpperCase() !== "DELETE"} loading={pending} onClick={() => start(async () => { await deleteMyData(confirm); })}>
                  {t("deleteForever")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
        <p className="text-center text-caption text-ink-3">
          {t.rich("lawNote", { law, link: (c) => <Link href="/legal/privacy" className="underline">{c}</Link> })}
        </p>
      </div>
    </div>
  );
}
