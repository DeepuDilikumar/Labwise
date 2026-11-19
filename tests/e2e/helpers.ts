import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function signUp(page: Page, name = "Meera") {
  await page.goto("/sign-in");
  await page.getByRole("radio", { name: "Email" }).click();
  await page.getByLabel("Email address").fill(`e2e${Date.now()}${Math.floor(Math.random() * 1e4)}@example.test`);
  await page.getByRole("button", { name: "Send code" }).click();
  const code = (await page.getByText(/your code is/).textContent())!.match(/\d{6}/)![0];
  await page.getByLabel("6-digit code").fill(code);
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await page.waitForURL("**/onboarding");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("switch").first().waitFor();
  for (const s of await page.getByRole("switch").all()) if ((await s.getAttribute("aria-checked")) === "false") await s.click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Your first name").fill(name);
  await page.getByRole("button", { name: "Start using Labwise" }).click();
  await page.waitForURL("**/home");
}

/** WCAG 2.1 AA violations, excluding third-party/dev overlays. */
export async function expectAccessible(page: Page) {
  // Let entrance animations finish so contrast is measured on the final frame.
  await page.waitForTimeout(1500);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).exclude("nextjs-portal").analyze();
  const serious = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target}`)).toEqual([]);
}
