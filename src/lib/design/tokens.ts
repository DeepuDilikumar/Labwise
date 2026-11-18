/**
 * Colour tokens mirrored from globals.css so they can be contrast-tested and
 * used where CSS variables are unavailable (share-card images, PDFs, charts).
 */
export const palette = {
  light: {
    bg: "#fafaf7",
    surface: "#ffffff",
    surface2: "#f3f3ee",
    ink: "#0f1a17",
    ink2: "#3d4945",
    ink3: "#5f6b67",
    line: "#e7e7e0",
    primary: "#0e7c66",
    primaryInk: "#ffffff",
    primarySoft: "#e5f2ed",
    primarySoftInk: "#0a5c4b",
    ok: "#1d6f47",
    okSoft: "#e7f3eb",
    warn: "#855400",
    warnSoft: "#fbf1dc",
    out: "#ad3f2b",
    outSoft: "#fbebe6",
    crit: "#9c1726",
    critSoft: "#f9e2e4",
  },
  dark: {
    bg: "#0b1210",
    surface: "#111a17",
    surface2: "#17221e",
    ink: "#ebefeb",
    ink2: "#b6c0bb",
    ink3: "#8f9a95",
    line: "#22302b",
    primary: "#3fbf9f",
    primaryInk: "#04140f",
    primarySoft: "#11302a",
    primarySoftInk: "#8fe0c9",
    ok: "#6fcf98",
    okSoft: "#12261b",
    warn: "#e8b84d",
    warnSoft: "#2a2210",
    out: "#f2937d",
    outSoft: "#2e1a15",
    crit: "#ff8590",
    critSoft: "#351519",
  },
} as const;

export type Theme = keyof typeof palette;

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
