"use client";
import { Check, Download, Share2, Upload, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { assignPerson } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { ShareCard, type ShareCardData } from "./share-card";

interface Props {
  shareCard: ShareCardData;
  pdfUrl: string;
  fileBase: string;
  documentId?: string;
  people?: { id: string; name: string }[];
  personId?: string | null;
  sample?: boolean;
}

export function ActionBar({ shareCard, pdfUrl, fileBase, documentId, people, personId, sample }: Props) {
  const t = useTranslations("results.actions");
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [current, setCurrent] = React.useState(personId ?? null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const share = async () => {
    setBusy(true);
    try {
      const { toBlob } = await import("html-to-image");
      await document.fonts.ready;
      const blob = await toBlob(cardRef.current!, { pixelRatio: 1, width: 1080, height: 1350, cacheBust: true });
      if (!blob) throw new Error("render_failed");
      const file = new File([blob], `${fileBase}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t("shareTitle"), text: t("shareText") });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
        toast({ title: t("downloaded"), tone: "success" });
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast({ title: t("shareFailed"), tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
    <div aria-hidden className="pointer-events-none fixed left-[-12000px] top-0">
      <ShareCard ref={cardRef} data={shareCard} />
    </div>
    <div className={cn("glass safe-bottom fixed inset-x-0 z-20 border-t border-line px-4 pt-3 md:bottom-0 md:pb-3", sample ? "bottom-0" : "bottom-[calc(4.25rem+env(safe-area-inset-bottom))]")}>
      <div className="mx-auto flex max-w-[46rem] items-center gap-2">
        <Button variant="secondary" className="flex-1" onClick={share} loading={busy}>
          <Share2 aria-hidden /> <span>{t("share")}</span>
        </Button>
        {sample ? (
          <Button asChild className="flex-1">
            <Link href="/sign-in?next=/add">
              <Upload aria-hidden /> {t("uploadYours")}
            </Link>
          </Button>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="flex-1">
                <UserRoundPlus aria-hidden /> <span className="truncate">{t("save")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent title={t("saveTitle")} description={t("saveBody")}>
              <ul className="space-y-2">
                {(people ?? []).map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={async () => {
                        await assignPerson(documentId!, p.id);
                        setCurrent(p.id);
                        toast({ title: t("savedTo", { name: p.name }), tone: "success" });
                        router.refresh();
                      }}
                      className={cn(
                        "flex min-h-12 w-full items-center justify-between rounded-[12px] border px-4 text-left font-medium text-ink transition-colors",
                        current === p.id ? "border-primary bg-primary-soft" : "border-line hover:bg-surface-2",
                      )}
                    >
                      {p.name}
                      {current === p.id && <Check className="size-4 text-primary" aria-hidden />}
                    </button>
                  </li>
                ))}
              </ul>
              <Link href="/people/new" className="mt-3 inline-block text-small font-medium text-primary hover:underline">
                {t("addPerson")}
              </Link>
            </DialogContent>
          </Dialog>
        )}
        <Button asChild variant="secondary" size="icon" aria-label={t("pdf")}>
          <a href={pdfUrl} target="_blank" rel="noopener">
            <Download aria-hidden />
          </a>
        </Button>
      </div>
    </div>
    </>
  );
}
