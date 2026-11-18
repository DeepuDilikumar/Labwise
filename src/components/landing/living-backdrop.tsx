import { cn } from "@/lib/cn";

/** Slow-drifting colour field. Pure CSS, GPU-friendly, stops for reduced motion. */
export function LivingBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="animate-blob-a absolute -left-[10%] top-[-10%] size-[42rem] rounded-full bg-[radial-gradient(circle_at_center,hsl(160_70%_45%/0.22),transparent_62%)] blur-2xl" />
      <div className="animate-blob-b absolute right-[-12%] top-[5%] size-[36rem] rounded-full bg-[radial-gradient(circle_at_center,hsl(24_100%_70%/0.22),transparent_62%)] blur-2xl" />
      <div className="animate-blob-c absolute bottom-[-20%] left-[30%] size-[40rem] rounded-full bg-[radial-gradient(circle_at_center,hsl(250_90%_75%/0.18),transparent_62%)] blur-2xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,var(--bg))]" />
      <div
        className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_70%)]"
        style={{
          backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
    </div>
  );
}
