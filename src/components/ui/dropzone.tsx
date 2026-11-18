"use client";
import { Camera, FileUp } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export const ACCEPTED = "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif";

export function Dropzone({
  onFiles,
  onCamera,
  disabled,
  error,
  className,
}: {
  onFiles: (files: File[]) => void;
  onCamera?: () => void;
  disabled?: boolean;
  error?: string | null;
  className?: string;
}) {
  const t = useTranslations("upload");
  const [over, setOver] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const pick = (list: FileList | null) => list && list.length && onFiles(Array.from(list));

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) pick(e.dataTransfer.files);
        }}
        className={cn(
          "relative flex flex-col items-center rounded-[var(--radius-2xl)] border-[1.5px] border-dashed px-6 py-10 text-center transition-colors duration-150 sm:py-14",
          over ? "border-primary bg-primary-soft/60" : "border-line-strong bg-surface",
          error && "border-out-line",
          disabled && "opacity-60",
        )}
      >
        <div className="grid size-14 place-items-center rounded-[18px] bg-primary-soft text-primary-soft-ink">
          <FileUp className="size-6" aria-hidden />
        </div>
        <p className="mt-5 text-h3 font-semibold text-ink">{t("dropTitle")}</p>
        <p className="mt-1 max-w-xs text-small text-ink-3 text-pretty">{t("dropBody")}</p>
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5 sm:max-w-none sm:flex-row sm:justify-center">
          {onCamera && (
            <Button size="lg" onClick={onCamera} disabled={disabled} className="sm:hidden">
              <Camera aria-hidden /> {t("takePhoto")}
            </Button>
          )}
          <Button
            size="lg"
            variant={onCamera ? "secondary" : "primary"}
            onClick={() => input.current?.click()}
            disabled={disabled}
            className={cn(onCamera && "sm:bg-primary sm:text-primary-ink sm:border-transparent sm:hover:bg-primary-hover")}
          >
            <FileUp aria-hidden /> {t("chooseFile")}
          </Button>
          {onCamera && (
            <Button size="lg" variant="secondary" onClick={onCamera} disabled={disabled} className="hidden sm:inline-flex">
              <Camera aria-hidden /> {t("takePhoto")}
            </Button>
          )}
        </div>
        <p className="mt-4 text-caption text-ink-3">{t("limits")}</p>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label={t("chooseFile")}
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-small text-out">
          {error}
        </p>
      )}
    </div>
  );
}
