"use client";
import { ArrowDown, ArrowUp, Camera, FileText, Info, Plus, Sparkles, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";
import { startSample, uploadReport } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { Select } from "@/components/ui/field";
import { ProcessingSteps } from "@/components/ui/processing-steps";
import { InlineNotice } from "@/components/ui/states";
import { CameraCapture } from "./camera";
import { prepareFile, MAX_BYTES, MAX_PAGES } from "./prepare";

interface Page {
  id: string;
  file: File;
  preview: string | null;
}

export function UploadFlow({ people, defaultPerson, canProcess }: { people: { id: string; name: string; relation: string }[]; defaultPerson: string | null; canProcess: boolean }) {
  const t = useTranslations("upload");
  const ts = useTranslations("landing.scene");
  const router = useRouter();
  const [pages, setPages] = React.useState<Page[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [camera, setCamera] = React.useState(false);
  const [person, setPerson] = React.useState(defaultPerson ?? "");
  const [busy, setBusy] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [preparing, setPreparing] = React.useState(false);

  React.useEffect(() => () => pages.forEach((p) => p.preview && URL.revokeObjectURL(p.preview)), [pages]);

  const add = async (files: File[]) => {
    setError(null);
    setPreparing(true);
    try {
      const next: Page[] = [];
      for (const f of files) {
        if (pages.length + next.length >= MAX_PAGES) {
          setError(t("errors.too_many_files"));
          break;
        }
        const prepared = await prepareFile(f);
        if ("error" in prepared) {
          setError(t(`errors.${prepared.error}`));
          continue;
        }
        next.push({ id: crypto.randomUUID(), file: prepared.file, preview: prepared.file.type.startsWith("image/") ? URL.createObjectURL(prepared.file) : null });
      }
      setPages((p) => [...p, ...next]);
    } finally {
      setPreparing(false);
    }
  };
  const move = (i: number, d: -1 | 1) =>
    setPages((p) => {
      const n = [...p];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });

  const submit = async () => {
    setBusy(true);
    setStep(0);
    setError(null);
    const tick = setInterval(() => setStep((s) => Math.min(2, s + 1)), 2800);
    const fd = new FormData();
    pages.forEach((p) => fd.append("files", p.file));
    if (person) fd.append("personId", person);
    try {
      const r = await uploadReport(fd);
      if (!r.ok) {
        setError(r.error === "consent_required" ? t("errors.consent_required") : (t.has(`errors.${r.error}`) ? t(`errors.${r.error}`) : t("errors.upload_failed")));
        setBusy(false);
        return;
      }
      setStep(3);
      router.push(`/reports/${r.id}`);
    } catch {
      setError(t("errors.upload_failed"));
      setBusy(false);
    } finally {
      clearInterval(tick);
    }
  };

  return (
    <div className="mx-auto max-w-[46rem] px-4 pb-40 pt-8 sm:px-6 md:pb-16">
      <h1 className="font-display text-[2.5rem] leading-[1.05] text-ink">{t("title")}</h1>
      <p className="mt-2 text-body text-ink-2">{t("subtitle")}</p>

      {!canProcess && (
        <InlineNotice tone="info" icon={<Info />} className="mt-5">
          {t.rich("noCredits", { link: (c) => <Link href="/pricing" className="font-semibold underline">{c}</Link> })}
        </InlineNotice>
      )}

      <div className="mt-6">
        {pages.length === 0 ? (
          <Dropzone onFiles={add} onCamera={() => setCamera(true)} error={error} disabled={preparing} />
        ) : (
          <div>
            <ul className="space-y-2" aria-label={t("pagesLabel")}>
              <AnimatePresence initial={false}>
                {pages.map((p, i) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 rounded-[16px] border border-line bg-surface p-2.5 shadow-[var(--shadow-xs)]"
                  >
                    <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-surface-2">
                      {p.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.preview} alt="" className="size-full object-cover" />
                      ) : (
                        <FileText className="size-6 text-ink-3" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-small font-medium text-ink">{t("page", { n: i + 1 })}</p>
                      <p className="truncate text-caption text-ink-3">
                        {p.file.name} · {(p.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t("moveUp")}>
                        <ArrowUp />
                      </Button>
                      <Button variant="ghost" size="icon-sm" disabled={i === pages.length - 1} onClick={() => move(i, 1)} aria-label={t("moveDown")}>
                        <ArrowDown />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setPages((ps) => ps.filter((x) => x.id !== p.id))} aria-label={t("remove")}>
                        <Trash2 />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setCamera(true)} disabled={pages.length >= MAX_PAGES}>
                <Camera aria-hidden /> {t("addPhoto")}
              </Button>
              <label className="inline-flex">
                <span className="sr-only">{t("addFile")}</span>
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/*"
                  className="peer sr-only"
                  onChange={(e) => {
                    if (e.target.files) void add(Array.from(e.target.files));
                    e.target.value = "";
                  }}
                />
                <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 text-small font-medium text-ink shadow-[var(--shadow-xs)] hover:bg-surface-2 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--focus)]">
                  <Plus className="size-4" aria-hidden /> {t("addFile")}
                </span>
              </label>
            </div>
            {error && <p role="alert" className="mt-3 text-small text-out">{error}</p>}
          </div>
        )}
      </div>

      {people.length > 0 && (
        <div className="mt-6">
          <label htmlFor="person" className="text-small font-medium text-ink">{t("whose")}</label>
          <Select id="person" className="mt-1.5" value={person} onChange={(e) => setPerson(e.target.value)}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
      )}

      <p className="mt-6 text-caption text-ink-3">{t("privacyNote", { max: MAX_PAGES, mb: MAX_BYTES / 1024 / 1024 })}</p>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-[16px] border border-dashed border-line-strong p-4">
        <p className="text-small text-ink-2">{t("noReportHandy")}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            setBusy(true);
            const r = await startSample();
            if (r.ok) router.push(`/reports/${r.id}`);
            else setBusy(false);
          }}
        >
          <Sparkles aria-hidden /> {t("useSample")}
        </Button>
      </div>

      <div className="glass safe-bottom fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 border-t border-line px-4 pt-3 md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto max-w-[46rem]">
          <Button size="lg" block disabled={!pages.length || busy || preparing} loading={busy || preparing} onClick={submit}>
            {t("explain")}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {busy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-[var(--overlay)] p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={t("processing")}
          >
            <motion.div initial={{ y: 16, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="w-full max-w-sm rounded-[var(--radius-2xl)] bg-surface p-7 shadow-[var(--shadow-lg)]">
              <p className="font-display text-[1.75rem] leading-tight text-ink">{t("processing")}</p>
              <p className="mt-1 text-small text-ink-3">{t("processingBody")}</p>
              <ProcessingSteps className="mt-6" steps={[ts("step1"), ts("step2"), ts("step3")]} active={step} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {camera && (
        <CameraCapture
          onClose={() => setCamera(false)}
          onCapture={(f) => void add([f])}
          labels={{ title: t("cameraTitle"), hint: t("cameraHint"), capture: t("capture"), done: t("done"), denied: t("cameraDenied"), close: t("close") }}
        />
      )}
    </div>
  );
}
