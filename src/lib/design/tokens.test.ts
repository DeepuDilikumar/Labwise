import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { contrast, palette } from "./tokens";

const AA = 4.5;

describe("design tokens — WCAG AA", () => {
  for (const theme of ["light", "dark"] as const) {
    const p = palette[theme];
    const pairs: [string, string, string][] = [
      ["ink on bg", p.ink, p.bg],
      ["ink-2 on bg", p.ink2, p.bg],
      ["ink-3 on bg", p.ink3, p.bg],
      ["ink-3 on surface", p.ink3, p.surface],
      ["ink-3 on surface-2", p.ink3, p.surface2],
      ["primary-ink on primary", p.primaryInk, p.primary],
      ["primary on bg", p.primary, p.bg],
      ["primary on surface", p.primary, p.surface],
      ["primary-soft-ink on primary-soft", p.primarySoftInk, p.primarySoft],
      ["ok on ok-soft", p.ok, p.okSoft],
      ["warn on warn-soft", p.warn, p.warnSoft],
      ["out on out-soft", p.out, p.outSoft],
      ["crit on crit-soft", p.crit, p.critSoft],
      ["ok on surface", p.ok, p.surface],
      ["warn on surface", p.warn, p.surface],
      ["out on surface", p.out, p.surface],
      ["crit on surface", p.crit, p.surface],
    ];
    for (const [name, fg, bg] of pairs) {
      it(`${theme}: ${name} ≥ ${AA}`, () => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
      });
    }
  }

  it("tokens.ts mirrors globals.css", () => {
    const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const [lightBlock, darkBlock] = css.split(':root[data-theme="dark"]');
    const check = (block: string, key: string, value: string) =>
      expect(block, `${key} should be ${value}`).toMatch(new RegExp(`--${key}:\\s*${value};`, "i"));
    const map: Record<string, keyof typeof palette.light> = {
      bg: "bg",
      surface: "surface",
      ink: "ink",
      "ink-2": "ink2",
      "ink-3": "ink3",
      primary: "primary",
      "primary-ink": "primaryInk",
      ok: "ok",
      warn: "warn",
      out: "out",
      crit: "crit",
    };
    for (const [cssKey, tsKey] of Object.entries(map)) {
      check(lightBlock, cssKey, palette.light[tsKey]);
      check(darkBlock, cssKey, palette.dark[tsKey]);
    }
  });
});
