/**
 * Captures every screen and state of Labwise for docs/WALKTHROUGH.md.
 * Usage: start a production server in local mode, then run `pnpm walkthrough`.
 *   pnpm build && LABWISE_MODE=local LOCAL_DATA_DIR=.data-walkthrough pnpm start --port 3100
 *   BASE_URL=http://localhost:3100 pnpm walkthrough
 * All data is synthetic (fixtures/golden). Output: docs/screenshots/*.jpg
 */
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = "docs/screenshots";
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };
const shots: string[] = [];

async function snap(page: Page, name: string, opts: { full?: boolean; settle?: number } = {}) {
  await page.waitForTimeout(opts.settle ?? 900);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 88, fullPage: !!opts.full });
  shots.push(name);
  console.log("✓", name);
}

async function setPrefs(ctx: BrowserContext, prefs: Record<string, string>) {
  await ctx.addCookies(Object.entries(prefs).map(([k, v]) => ({ name: `lw_${k}`, value: v, url: BASE })));
}

async function scrollTo(page: Page, selector: string, offset = -80) {
  const loc = page.locator(selector).first();
  if (!(await loc.count())) return;
  await loc.evaluate((el, off) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + off), offset);
}

async function upload(page: Page, file: string) {
  await page.goto(`${BASE}/add`);
  await page.setInputFiles("input[type=file]", file);
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Explain my report" }).click();
  await page.waitForURL("**/reports/**", { timeout: 60_000 });
  await page.waitForLoadState("networkidle");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });

  // ---------------- Public pages ----------------
  {
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await snap(page, "01-landing-hero-desktop", { settle: 3500 });
    await scrollTo(page, "#how", 300);
    await snap(page, "02-landing-how-it-works", { settle: 1500 });
    await scrollTo(page, "#try");
    await snap(page, "03-landing-playground", { settle: 1500 });
    const slider = page.locator("#pg-slider");
    await slider.fill("78");
    await snap(page, "04-landing-playground-in-range", { settle: 600 });
    await scrollTo(page, "#features");
    await snap(page, "05-landing-features", { settle: 2000 });
    await scrollTo(page, "section[aria-labelledby=principles-title]", 0);
    await snap(page, "06-landing-principles", { settle: 2000 });
    await scrollTo(page, "#pricing");
    await snap(page, "07-landing-pricing", { settle: 1200 });
    await scrollTo(page, "#faq");
    await snap(page, "08-landing-faq", { settle: 1200 });
    await setPrefs(ctx, { theme: "dark" });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await snap(page, "09-landing-dark", { settle: 3500 });
    await page.goto(`${BASE}/design`, { waitUntil: "networkidle" });
    await setPrefs(ctx, { theme: "light" });
    await page.goto(`${BASE}/design`, { waitUntil: "networkidle" });
    await snap(page, "10-design-system", { settle: 1200 });
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: MOBILE, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    await snap(page, "11-landing-mobile", { settle: 3000 });
    await setPrefs(ctx, { locale: "hi" });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await snap(page, "12-landing-hindi", { settle: 2500 });
    await setPrefs(ctx, { locale: "ml" });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await snap(page, "13-landing-malayalam", { settle: 2500 });
    await setPrefs(ctx, { locale: "en" });
    await page.goto(`${BASE}/sample`, { waitUntil: "networkidle" });
    await snap(page, "14-public-sample", { settle: 1500 });
    await page.goto(`${BASE}/legal/privacy`, { waitUntil: "networkidle" });
    await snap(page, "15-legal-privacy-draft");
    await page.goto(`${BASE}/offline`, { waitUntil: "networkidle" });
    await snap(page, "16-offline");
    await ctx.close();
  }

  // ---------------- Sign-in & onboarding ----------------
  const ctx = await browser.newContext({ viewport: MOBILE, permissions: ["camera"] });
  await setPrefs(ctx, { locale: "en", theme: "light" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/sign-in`, { waitUntil: "networkidle" });
  await snap(page, "20-sign-in");
  await page.getByLabel("Mobile number").fill("98765 4321");
  await page.getByRole("button", { name: "Send code" }).click();
  await snap(page, "21-sign-in-invalid-number", { settle: 700 });
  await page.getByLabel("Mobile number").fill("98765 43210");
  await page.getByRole("button", { name: "Send code" }).click();
  const code = (await page.getByText(/your code is/).textContent())!.match(/\d{6}/)![0];
  await page.getByLabel("6-digit code").fill(code === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await snap(page, "22-sign-in-wrong-code", { settle: 900 });
  await page.getByLabel("6-digit code").fill(code);
  await snap(page, "23-sign-in-code");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await page.waitForURL("**/onboarding");
  await snap(page, "24-onboarding-welcome", { settle: 1200 });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("switch").first().waitFor();
  await snap(page, "25-onboarding-consent", { settle: 700 });
  for (const s of await page.getByRole("switch").all()) if ((await s.getAttribute("aria-checked")) === "false") await s.click();
  await snap(page, "26-onboarding-consent-given", { settle: 500 });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Your first name").fill("Meera");
  await snap(page, "27-onboarding-name", { settle: 700 });
  await page.getByRole("button", { name: "Start using Labwise" }).click();
  await page.waitForURL("**/home");

  // ---------------- Home, empty states ----------------
  await snap(page, "30-home-empty", { settle: 1200 });
  await page.goto(`${BASE}/trends`, { waitUntil: "networkidle" });
  await snap(page, "31-trends-empty");
  await page.goto(`${BASE}/add`, { waitUntil: "networkidle" });
  await snap(page, "32-add-report");

  // Camera (fake device) with edge guide
  await page.getByRole("button", { name: "Take photo" }).click();
  await snap(page, "33-camera-edge-guide", { settle: 1800 });
  await page.getByRole("button", { name: "Close camera" }).click();

  // Pages selected
  await page.setInputFiles("input[type=file]", ["fixtures/golden/lab-in-06.jpg", "fixtures/golden/lab-in-03.jpg"]);
  await snap(page, "34-add-pages-selected", { settle: 1200 });

  // Processing overlay: hold the server action response briefly so the overlay is visible.
  let held = false;
  await page.route("**/add", async (route) => {
    if (route.request().method() === "POST" && !held) {
      held = true;
      await new Promise((r) => setTimeout(r, 4000));
    }
    await route.continue();
  });
  await page.getByRole("button", { name: "Remove page" }).first().click();
  await page.getByRole("button", { name: "Explain my report" }).click();
  await snap(page, "35-processing", { settle: 3000 });
  await page.waitForURL("**/reports/**", { timeout: 60_000 });
  await page.unroute("**/add");

  // Review screen (photo with hard-to-read rows)
  await snap(page, "36-review-needs-confirmation", { settle: 1200 });
  for (const b of await page.getByRole("button", { name: "Confirm" }).all()) await b.click();
  await snap(page, "37-review-all-confirmed", { settle: 600 });
  await page.getByRole("button", { name: "Explain my report" }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  // ---------------- Sample report → results ----------------
  await page.goto(`${BASE}/home`);
  await page.getByRole("button", { name: "Open sample report" }).click();
  await page.waitForURL("**/reports/**", { timeout: 60_000 });
  const sampleUrl = page.url();
  await snap(page, "40-results-big-picture", { settle: 1500 });
  await scrollTo(page, "#panel-blood_sugar", -70);
  await snap(page, "41-results-marker-cards");
  await page.getByRole("button", { name: "Common reasons it can be high" }).first().click();
  await page.getByRole("button", { name: "Questions to ask your doctor" }).first().click();
  await scrollTo(page, "#panel-blood_sugar", 120);
  await snap(page, "42-results-expanded-explanations");
  await scrollTo(page, "#panel-thyroid", -70);
  await snap(page, "43-results-in-range-collapsed");
  await scrollTo(page, "h2:has-text('Who to see')", -100);
  await snap(page, "44-results-who-to-see");
  await page.getByRole("radio", { name: "mmol/L (SI)" }).click();
  await page.waitForLoadState("networkidle");
  await scrollTo(page, "#panel-blood_sugar", -70);
  await snap(page, "45-results-si-units", { settle: 1500 });
  await setPrefs(ctx, { units: "conventional" });
  await page.reload({ waitUntil: "networkidle" });

  // Share card (downloaded PNG in headless) and delete dialog
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Share" }).click();
  await (await dl).saveAs(`${OUT}/46-share-card.png`);
  shots.push("46-share-card");
  console.log("✓ 46-share-card");
  await page.getByRole("button", { name: "Save to person" }).click();
  await snap(page, "47-save-to-person", { settle: 700 });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Delete" }).first().click();
  await snap(page, "48-delete-report-dialog", { settle: 700 });
  await page.keyboard.press("Escape");

  // Dark, Hindi, Malayalam, larger text
  await setPrefs(ctx, { theme: "dark" });
  await page.goto(sampleUrl, { waitUntil: "networkidle" });
  await snap(page, "49-results-dark", { settle: 1500 });
  await scrollTo(page, "#panel-blood_sugar", -70);
  await snap(page, "50-results-dark-cards");
  await setPrefs(ctx, { theme: "light", locale: "hi" });
  await page.goto(sampleUrl, { waitUntil: "networkidle" });
  await snap(page, "51-results-hindi", { settle: 1500 });
  await setPrefs(ctx, { locale: "ml" });
  await page.goto(sampleUrl, { waitUntil: "networkidle" });
  await snap(page, "52-results-malayalam", { settle: 1500 });
  await setPrefs(ctx, { locale: "en", text: "large" });
  await page.goto(sampleUrl, { waitUntil: "networkidle" });
  await snap(page, "53-results-larger-text", { settle: 1500 });
  await setPrefs(ctx, { text: "default" });

  // Print / PDF page (desktop width)
  await page.setViewportSize(DESKTOP);
  await page.goto(sampleUrl.replace("/reports/", "/print/"), { waitUntil: "networkidle" });
  await snap(page, "54-print-pdf", { settle: 1200 });
  await page.goto(sampleUrl, { waitUntil: "networkidle" });
  await snap(page, "55-results-desktop", { settle: 1500 });
  await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
  await snap(page, "56-home-desktop", { settle: 1200 });
  await page.goto(`${BASE}/trends`, { waitUntil: "networkidle" });
  await snap(page, "57-trends-desktop", { settle: 1500 });
  await page.getByRole("radio", { name: "Table" }).first().click();
  await snap(page, "58-trends-table-view", { settle: 600 });
  await page.setViewportSize(MOBILE);

  // ---------------- Urgent, paywall, payments ----------------
  await upload(page, "fixtures/golden/lab-in-07.pdf");
  await snap(page, "60-paywall-awaiting-payment");
  await page.getByRole("link", { name: "See plans" }).click();
  await page.waitForURL("**/pricing**");
  await snap(page, "61-pricing");
  await page.getByRole("button", { name: "Get started" }).first().click();
  await snap(page, "62-checkout-test-mode", { settle: 900 });
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.waitForURL("**/reports/**", { timeout: 60_000 });
  await snap(page, "63-results-urgent-banner", { settle: 1500 });

  // ---------------- Prescriptions ----------------
  await upload(page, "fixtures/golden/rx-in-03.jpg");
  await page.getByRole("link", { name: "See plans" }).click();
  await page.waitForURL("**/pricing**");
  await page.getByRole("button", { name: "Get started" }).nth(1).click();
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.waitForURL("**/reports/**", { timeout: 60_000 });
  await snap(page, "64-prescription-handwritten", { settle: 1500 });
  await scrollTo(page, "li:has-text('Thyronorm')", -80);
  await snap(page, "65-prescription-pharmacist-badge");
  await upload(page, "fixtures/golden/rx-in-01.pdf");
  await snap(page, "66-prescription-printed", { settle: 1500 });
  await page.goto(`${BASE}/pricing`, { waitUntil: "networkidle" });
  await snap(page, "67-pricing-family-plan-active");

  // ---------------- Error states ----------------
  await upload(page, "public/icons/icon-512.png");
  await snap(page, "70-error-cannot-read-without-ai");
  await upload(page, "fixtures/golden/other-01.jpg");
  await snap(page, "71-rejected-not-a-report");
  await page.goto(`${BASE}/add`);
  await page.setInputFiles("input[type=file]", { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
  await snap(page, "72-upload-wrong-file-type", { settle: 700 });

  // ---------------- People, privacy, settings ----------------
  await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
  await snap(page, "73-home-with-reports", { settle: 1200 });
  await page.goto(`${BASE}/people`, { waitUntil: "networkidle" });
  await snap(page, "74-people");
  await page.goto(`${BASE}/people/new`, { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill("Lakshmi");
  await snap(page, "75-add-person");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("**/people");
  await page.goto(`${BASE}/trends`, { waitUntil: "networkidle" });
  await snap(page, "76-trends-mobile", { settle: 1500 });
  await page.goto(`${BASE}/privacy`, { waitUntil: "networkidle" });
  await snap(page, "77-privacy-centre");
  await scrollTo(page, "h2:has-text('Delete original files after')", -100);
  await snap(page, "78-privacy-retention-export");
  await page.getByRole("button", { name: "Delete my account and data" }).click();
  await snap(page, "79-delete-everything-dialog", { settle: 700 });
  await page.keyboard.press("Escape");
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await snap(page, "80-settings");
  await page.goto(`${BASE}/help`, { waitUntil: "networkidle" });
  await snap(page, "81-help");
  await setPrefs(ctx, { theme: "dark" });
  await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
  await snap(page, "82-home-dark", { settle: 1200 });

  await browser.close();
  await writeFile(`${OUT}/manifest.json`, JSON.stringify({ generatedAt: new Date().toISOString(), shots }, null, 2));
  console.log(`\n${shots.length} screenshots in ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
