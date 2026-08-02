import { test, expect } from "@playwright/test";
import { seedTextures, seedProject, openEditor, enterTryMode, screenshotWidget } from "../../../../tests/support/seed";
import type { ScreenSpec } from "../../../../lib/types";

async function click(page: import("@playwright/test").Page, locator: ReturnType<import("@playwright/test").Page["locator"]>) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("locator not found");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
}

function screen(): ScreenSpec {
  return {
    id: "main",
    width: 320,
    height: 180,
    widgets: [
      { id: "tabs_top", type: "tabs", x: 8, y: 8, w: 199, h: 140, text: "", icon: null, props: { tab_height: "20" } },
      { id: "tab_a", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Alpha", icon: null, props: {}, parentId: "tabs_top" },
      { id: "tab_b", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Beta",  icon: null, props: {}, parentId: "tabs_top" },
      { id: "tab_c", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Gamma", icon: null, props: {}, parentId: "tabs_top" },
    ],
  };
}

test("top tabs: first tab active on load", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screen());
  await openEditor(page);
  await enterTryMode(page);
  expect(await screenshotWidget(page, page.locator('[data-widget-id="tabs_top"]'))).toMatchSnapshot("top-tabs-first-active.png");
});

test("top tabs: second tab active after click", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screen());
  await openEditor(page);
  await enterTryMode(page);
  await click(page, page.getByText("Beta", { exact: true }));
  expect(await screenshotWidget(page, page.locator('[data-widget-id="tabs_top"]'))).toMatchSnapshot("top-tabs-second-active.png");
});

test("top tabs: third tab active after click", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screen());
  await openEditor(page);
  await enterTryMode(page);
  await click(page, page.getByText("Gamma", { exact: true }));
  expect(await screenshotWidget(page, page.locator('[data-widget-id="tabs_top"]'))).toMatchSnapshot("top-tabs-third-active.png");
});
