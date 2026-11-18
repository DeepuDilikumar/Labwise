/**
 * Screenshot key routes at 390 / 768 / 1280 px for design review.
 * Usage: pnpm screens [route ...] [--theme=dark] [--full] [--out=screens]
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const flag = (n: string) => args.find((a) => a.startsWith(`--${n}`))?.split("=")[1] ?? (args.includes(`--${n}`) ? "true" : undefined);
const routes = args.filter((a) => !a.startsWith("--"));
const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = flag("out") ?? "screens";
const theme = flag("theme") ?? "light";
const widths = (flag("widths") ?? "390,768,1280").split(",").map(Number);
const locale = flag("locale") ?? "en";

(async () => {
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch();
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    await ctx.addCookies([
      { name: "lw_theme", value: theme, url: base },
      { name: "lw_locale", value: locale, url: base },
    ]);
    if (process.env.SESSION_COOKIE) await ctx.addCookies([{ name: "lw_session", value: process.env.SESSION_COOKIE, url: base }]);
    const page = await ctx.newPage();
    for (const r of routes.length ? routes : ["/"]) {
      await page.goto(base + r, { waitUntil: "networkidle" });
      // Scroll through so in-view animations settle, then return to top.
      const h = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < h; y += 500) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(120);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(Number(flag("wait") ?? 600));
      const name = `${out}/${(r.replace(/\W+/g, "_") || "_").replace(/^_|_$/g, "") || "home"}-${w}-${theme}${locale !== "en" ? "-" + locale : ""}.png`;
      await page.screenshot({ path: name, fullPage: flag("full") !== "false" });
      console.log(name);
    }
    await ctx.close();
  }
  await browser.close();
})();
