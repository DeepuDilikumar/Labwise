"use client";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { deleteReport } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

export function DeleteReportButton({ id }: { id: string }) {
  const t = useTranslations("results.delete");
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t("button")}>
          <Trash2 aria-hidden /> <span className="hidden sm:inline">{t("button")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent title={t("title")} description={t("body")} closeLabel={t("cancel")}>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild><Button variant="secondary">{t("cancel")}</Button></DialogClose>
          <Button
            variant="danger"
            loading={pending}
            onClick={() =>
              start(async () => {
                await deleteReport(id);
                toast({ title: t("done"), tone: "success" });
                router.push("/home");
              })
            }
          >
            {t("confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
