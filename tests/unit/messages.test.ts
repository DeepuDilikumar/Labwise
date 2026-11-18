import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import ml from "../../messages/ml.json";

type Tree = { [k: string]: string | Tree };
const keys = (o: Tree, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (k.startsWith("_") ? [] : typeof v === "string" ? [p + k] : keys(v, `${p}${k}.`)));
const placeholders = (s: string) => (s.match(/\{(\w+)/g) ?? []).sort().join(",");
const get = (o: Tree, path: string) => path.split(".").reduce<string | Tree | undefined>((a, k) => (a as Tree)?.[k], o);

describe("translations", () => {
  const enKeys = keys(en as Tree);
  for (const [name, msgs] of [["hi", hi], ["ml", ml]] as const) {
    it(`${name} has every English key`, () => {
      const missing = enKeys.filter((k) => typeof get(msgs as Tree, k) !== "string");
      expect(missing).toEqual([]);
    });
    it(`${name} keeps the same ICU placeholders`, () => {
      const bad = enKeys.filter((k) => {
        const v = get(msgs as Tree, k);
        return typeof v === "string" && placeholders(v) !== placeholders(get(en as Tree, k) as string);
      });
      expect(bad).toEqual([]);
    });
    it(`${name} is marked for native review`, () => {
      expect((msgs as Tree)._review).toMatch(/NEEDS NATIVE REVIEW/);
    });
  }
});
