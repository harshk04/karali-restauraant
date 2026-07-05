import { test, expect } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Indian dining at Jaipur International Airport",
    }),
  ).toBeVisible();
});
