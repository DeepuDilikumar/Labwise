"use client";
import { X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

/** Full-screen camera with a page edge guide. Falls back to the system camera picker. */
export function CameraCapture({
  onClose,
  onCapture,
  labels,
}: {
  onClose: () => void;
  onCapture: (f: File) => void;
  labels: { title: string; hint: string; capture: string; done: string; denied: string; close: string };
}) {
  const video = React.useRef<HTMLVideoElement>(null);
  const fallback = React.useRef<HTMLInputElement>(null);
  const [state, setState] = React.useState<"starting" | "live" | "denied">("starting");
  const [count, setCount] = React.useState(0);
  const [flash, setFlash] = React.useState(false);

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 2560 }, height: { ideal: 1920 } }, audio: false });
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }
        setState("live");
      } catch {
        setState("denied");
      }
    })();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const snap = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob(
      (b) => {
        if (!b) return;
        onCapture(new File([b], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
        setCount((n) => n + 1);
        setFlash(true);
        setTimeout(() => setFlash(false), 180);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label={labels.title}>
      <div className="flex items-center justify-between p-4">
        <p className="text-small text-white/80">{labels.hint}</p>
        <button type="button" onClick={onClose} aria-label={labels.close} className="grid size-11 place-items-center rounded-full bg-white/10">
          <X className="size-5" />
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        {state !== "denied" ? (
          <>
            <video ref={video} playsInline muted className="absolute inset-0 size-full object-cover" />
            <div aria-hidden className="pointer-events-none absolute inset-[8%_10%] rounded-[18px] shadow-[0_0_0_9999px_rgb(0_0_0/0.45)]">
              {["left-0 top-0 border-l-4 border-t-4 rounded-tl-[18px]", "right-0 top-0 border-r-4 border-t-4 rounded-tr-[18px]", "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-[18px]", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-[18px]"].map((c) => (
                <span key={c} className={`absolute size-10 border-[var(--primary)] ${c}`} />
              ))}
            </div>
            {flash && <div className="absolute inset-0 bg-white/70" />}
          </>
        ) : (
          <div className="grid h-full place-items-center p-8 text-center">
            <div>
              <p className="text-body">{labels.denied}</p>
              <Button className="mt-5" onClick={() => fallback.current?.click()}>
                {labels.capture}
              </Button>
              <input
                ref={fallback}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onCapture(f);
                  onClose();
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="safe-bottom flex items-center justify-between gap-6 px-8 pt-5">
        <span className="w-16 text-small text-white/80">{count > 0 ? `${count}` : ""}</span>
        <button
          type="button"
          onClick={snap}
          disabled={state !== "live"}
          aria-label={labels.capture}
          className="grid size-20 place-items-center rounded-full border-4 border-white/90 disabled:opacity-40"
        >
          <span className="size-16 rounded-full bg-white transition-transform active:scale-90" />
        </button>
        <button type="button" onClick={onClose} className="w-16 text-right text-body font-semibold">
          {labels.done}
        </button>
      </div>
    </div>
  );
}
