import { test, expect } from "@playwright/test";

// Run `pnpm --filter @hobbyhive/backend db:seed:e2e` against the target database first —
// it creates a verified test user with the "dance" hobby already selected.
//
// This covers login -> create post -> see it in the feed. Registration + OTP verification
// aren't automated here: the OTP is delivered by a real Gmail send (see user.controller.ts),
// and there's no way to read that email from a test runner without wiring up separate
// mailbox access, which is out of scope for this suite.

const EMAIL = "e2e@hobbyhive.test";
const PASSWORD = "E2ePassword123!";

test("login, create a post, and see it in the hobby feed", async ({ page }) => {
  await page.goto("/signin");

  await page.getByPlaceholder("Enter email or username").fill(EMAIL);
  await page.getByPlaceholder("Enter password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  // The seeded user has exactly one hobby ("Dance"), so the composer auto-selects it —
  // there's no hobby chip to click.
  const postContent = `E2E test post ${Date.now()}`;
  await page.getByPlaceholder("Share something interesting...").fill(postContent);
  await page.getByRole("button", { name: "Post" }).click();

  await expect(page.getByText(postContent)).toBeVisible();
});
