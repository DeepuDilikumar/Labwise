import { cn } from "@/lib/cn";

/** Device frame drawn in CSS so the product inside is real, live UI — not a screenshot. */
export function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[9/19] w-[17.5rem] rounded-[2.9rem] bg-[#0d1412] p-[0.6rem] dark:bg-[#26332e] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_40px_100px_-30px_rgb(63_191_159/0.25)] shadow-[0_2px_4px_rgb(0_0_0/0.08),0_30px_60px_-20px_rgb(8_40_32/0.45),0_60px_120px_-40px_rgb(8_40_32/0.35)] ring-1 ring-black/10 sm:w-[19rem]",
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2.35rem] bg-bg">
        <div aria-hidden className="absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-[#0d1412] dark:bg-[#26332e]" />
        {children}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2.9rem] ring-1 ring-inset ring-white/10 dark:ring-white/15" />
    </div>
  );
}
