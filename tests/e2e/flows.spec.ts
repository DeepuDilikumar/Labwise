import { expect, test } from "@playwright/test";
import { expectAccessible, signUp } from "./helpers";

test.describe("core flows (local mode, synthetic data)", () => {
  test("landing → public sample, no sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Your lab report");
    await expectAccessible(page);
    await page.getByRole("link", { name: "Try a sample report" }).first().click();
    await page.waitForURL("**/sample");
    await expect(page.getByText("The big picture").first()).toBeVisible();
    await expect(page.getByText("Labwise explains reports. It doesn't diagnose or replace a doctor.").first()).toBeVisible();
    await expectAccessible(page);
  });

  test("sample report → results → share → delete my data", async ({ page }) => {
    await signUp(page);
    await page.getByRole("button", { name: "Open sample report" }).click();
    await page.waitForURL("**/reports/**");
    await expect(page.getByRole("heading", { level: 2, name: /^Blood sugar/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "HbA1c" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Who to see" })).toBeVisible();
    await expectAccessible(page);

    // Expand a section on a marker card
    await page.getByRole("button", { name: "What this measures" }).first().click();
    await expect(page.getByText(/average blood sugar|sugar \(glucose\)/).first()).toBeVisible();

    // Share produces an image (downloaded where Web Share isn't available)
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Share" }).click();
    expect((await download).suggestedFilename()).toMatch(/\.png$/);

    // Trends exist for the sample person
    await page.goto("/trends");
    await expect(page.getByText("HbA1c", { exact: true }).first()).toBeVisible();

    // Delete everything
    await page.goto("/privacy");
    await page.getByRole("button", { name: "Delete my account and data" }).click();
    await page.getByLabel("Type DELETE to confirm").fill("DELETE");
    await page.getByRole("button", { name: "Delete forever" }).click();
    await page.waitForURL((u) => u.pathname === "/");
    await page.goto("/home");
    await page.waitForURL("**/sign-in**");
  });

  test("upload → results, then paywall for the next report", async ({ page }) => {
    await signUp(page, "Arjun");
    await page.goto("/add");
    await page.setInputFiles("input[type=file]", "fixtures/golden/lab-us-01.pdf");
    await page.getByRole("button", { name: "Explain my report" }).click();
    await page.waitForURL("**/reports/**");
    await expect(page.getByText("The big picture").first()).toBeVisible();

    await page.goto("/add");
    await page.setInputFiles("input[type=file]", "fixtures/golden/rx-in-01.pdf");
    await page.getByRole("button", { name: "Explain my report" }).click();
    await page.waitForURL("**/reports/**");
    await expect(page.getByText("Your report is ready to explain")).toBeVisible();
    await page.getByRole("link", { name: "See plans" }).click();
    await page.getByRole("button", { name: "Get started" }).first().click();
    await page.getByRole("button", { name: "Pay now" }).click();
    await page.waitForURL("**/reports/**");
    await expect(page.getByText("Follow your doctor's instructions. Ask your pharmacist or doctor if unsure.").first()).toBeVisible();
    await expect(page.getByText("A brand of Metformin")).toBeVisible();
  });

  for (const [locale, heading] of [["hi", "आपकी लैब रिपोर्ट"], ["ml", "നിങ്ങളുടെ ലാബ് റിപ്പോർട്ട്"]] as const) {
    test(`landing and sample render in ${locale}`, async ({ page, context }) => {
      await context.addCookies([{ name: "lw_locale", value: locale, url: "http://localhost:3100" }]);
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
      await page.goto("/sample");
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expectAccessible(page);
    });
  }
});
