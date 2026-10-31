import { expect, test } from "@playwright/test";

test("creates a new activity and redirects to its detail page (US-04 AC4)", async ({
  page,
}) => {
  await page.goto("/activities/new");

  await page.getByLabel("Title").fill("Algorithms study group");
  await page.getByRole("button", { name: "Study" }).click();
  await page.getByLabel("Start time").fill("2026-11-10T18:30");
  await page.getByLabel("Location").fill("Snell Library");
  await page.getByLabel("Description").fill("Bring old exams and practice problems.");
  await page.getByRole("button", { name: "Increase capacity" }).click();

  await expect(page.getByText("4 spots left")).toBeVisible();

  await page.getByRole("button", { name: "Post activity" }).click();

  await expect(page).toHaveURL(/\/activities\/activity-/);
  await expect(page.getByRole("heading", { name: "Your activity is live" })).toBeVisible();
});
