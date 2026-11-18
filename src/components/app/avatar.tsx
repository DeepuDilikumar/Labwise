import { cn } from "@/lib/cn";

const TINT: Record<string, string> = {
  teal: "bg-mint text-mint-ink",
  peach: "bg-peach text-peach-ink",
  lilac: "bg-lilac text-lilac-ink",
  sky: "bg-sky text-sky-ink",
  sun: "bg-sun text-sun-ink",
  lime: "bg-lime text-lime-ink",
};

export function Avatar({ name, color, size = "md", className }: { name: string; color?: string | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const initials = name
    .replace(/\(.*\)/, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        TINT[color ?? "teal"] ?? TINT.teal,
        size === "sm" ? "size-8 text-caption" : size === "lg" ? "size-16 text-h3" : "size-11 text-small",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
