import { test, expect } from "@playwright/test";
import { openings } from "../../src/openings.js";
import { Chess } from "chess.js";
async function clickMove(page, move) {
  await page.locator(`[data-square="${move.from}"]`).click();
  await page.locator(`[data-square="${move.to}"]`).click();
}
test("all ten openings complete through the board", async ({ page }) => {
  await page.goto("/");
  for (const o of openings) {
    await page.locator(`[data-opening="${o.id}"]`).click();
    const chess = new Chess();
    for (const san of o.variations[0].moves) {
      const move = chess.move(san);
      if (move.color === (o.playerColor === "white" ? "w" : "b"))
        await clickMove(page, move);
    }
    await expect(page.locator("#instruction")).toContainText(
      "Beautifully played",
    );
  }
});
test("practice hides moves, rejects errors, hints, undoes and restarts", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await expect(page.locator("#instruction")).toContainText("What comes next?");
  await clickMove(page, { from: "d2", to: "d4" });
  await expect(page.locator("#feedback")).toContainText("is legal");
  await expect(page.locator("#stats")).toContainText("1 mistakes");
  await page.locator("#hint").click();
  await expect(page.locator("#instruction h3")).toHaveText("e4");
  await expect(page.locator(".hint-square")).toHaveCount(2);
  await clickMove(page, { from: "e2", to: "e4" });
  await expect(page.locator("#last-move")).toHaveText("Last move: e5");
  await page.locator("#undo").click();
  await expect(page.locator("#history")).toContainText("Your first move");
  await page.locator("#restart").click();
  await expect(page.locator("#stats")).toContainText("0 mistakes");
  await page.locator('[data-opening="sicilian"]').click();
  await expect(page.locator("#board .square").first()).toHaveAttribute(
    "data-square",
    "h1",
  );
  await expect(page.locator("#last-move")).toHaveText("Last move: e4");
});
test("mobile layout fits the viewport and opening search works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.locator("#search").fill("French");
  await expect(page.locator("[data-opening]")).toHaveCount(1);
  await page.locator('[data-opening="french"]').click();
  await expect(page.locator("#opening-title")).toHaveText("French Defense");
  await page.locator("#change").click();
  await expect(page.locator("[data-opening]")).toHaveCount(10);
});

test("Learn has clear forward and backward controls on desktop and mobile", async ({
  page,
}) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const next = page.locator("#next-step");
    const previous = page.locator("#previous-step");
    await expect(previous).toBeDisabled();
    await expect(next).toHaveText("Next step: e4 →");
    await next.click();
    await expect(page.locator("#last-move")).toHaveText("Last move: e5");
    await expect(page.locator("#instruction h3")).toHaveText("Nf3");
    await previous.click();
    await expect(next).toHaveText("Next step: e4 →");
    await expect(previous).toBeDisabled();
    for (let i = 0; i < 8; i++) await next.click();
    await expect(next).toBeDisabled();
    await expect(page.locator("#instruction")).toContainText(
      "Beautifully played",
    );
    await previous.click();
    await expect(next).toBeEnabled();
    await page.locator("#restart").click();
    await expect(previous).toBeDisabled();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(
      await page
        .locator(".instruction p")
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    await page.getByRole("button", { name: "Practice", exact: true }).click();
    await expect(page.locator("#learn-navigation")).toBeHidden();
  }
});
