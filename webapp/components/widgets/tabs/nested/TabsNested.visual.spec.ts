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

/**
 * The nested tabs widget needs parentId set to get the nested visual style.
 * We use a bare `tab` widget (no outer `tabs` wrapper) as the transparent
 * root-level container — it has no visual of its own, so only `tabs_inner`
 * appears in the screenshot.
 */
function screen(): ScreenSpec {
  return {
    id: "main",
    width: 220,
    height: 150,
    widgets: [
      { id: "tab_container", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "", icon: null, props: {} },
      { id: "tabs_inner", type: "tabs", x: 8, y: 8, w: 180, h: 120, text: "", icon: null, props: { tab_height: "14" }, parentId: "tab_container" },
      { id: "tab_inner_1", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Inner 1", icon: null, props: {}, parentId: "tabs_inner" },
      { id: "tab_inner_2", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Inner 2", icon: null, props: {}, parentId: "tabs_inner" },
    ],
  };
}

test("nested tabs: first inner tab active on load", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screen());
  await openEditor(page);
  await enterTryMode(page);
  expect(await screenshotWidget(page, page.locator('[data-widget-id="tabs_inner"]'))).toMatchSnapshot("nested-tabs-default.png");
});

test("nested tabs: second inner tab active after click", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screen());
  await openEditor(page);
  await enterTryMode(page);
  await click(page, page.getByText("Inner 2", { exact: true }));
  expect(await screenshotWidget(page, page.locator('[data-widget-id="tabs_inner"]'))).toMatchSnapshot("nested-tabs-inner-second-active.png");
});
