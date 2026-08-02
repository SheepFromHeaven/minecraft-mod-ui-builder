import { test, expect } from "@playwright/test";
import { seedTextures, seedProject, openEditor } from "../../../tests/support/seed";
import type { ScreenSpec } from "../../../lib/types";

/**
 * Visual regression for the tabs widget's active/inactive header rendering
 * and z-order. Tabs can't be rendered through /widget-test-harness (pink
 * background) — their selector row + content panel are drawn by
 * TabsEditHeader.tsx using ActiveTabCtx, tab-drag state, and updateWidgets,
 * all of which are Canvas-internal — so this snapshots the real editor
 * canvas instead, cropped to just the tabs widget's bounds.
 */

function screenWithTabs(): ScreenSpec {
  return {
    id: "main",
    width: 320,
    height: 180,
    widgets: [
      { id: "tabs_1", type: "tabs", x: 8, y: 8, w: 176, h: 150, text: "", icon: null, props: { tab_height: "20" } },
      { id: "tab_a", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "First", icon: null, props: {}, parentId: "tabs_1" },
      { id: "tab_b", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Second", icon: null, props: {}, parentId: "tabs_1" },
    ],
  };
}

async function clickAt(page: import("@playwright/test").Page, locator: ReturnType<import("@playwright/test").Page["locator"]>) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("locator not found for clickAt");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
}

test("tabs widget: first tab active by default", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screenWithTabs());
  await openEditor(page);

  const tabsWidget = page.locator('[data-widget-id="tabs_1"]');
  await expect(tabsWidget).toHaveScreenshot("tabs-first-active.png");
});

test("tabs widget: after switching to second tab, both headers stay visible", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screenWithTabs());
  await openEditor(page);

  await clickAt(page, page.getByText("Second", { exact: true }));

  const tabsWidget = page.locator('[data-widget-id="tabs_1"]');
  await expect(tabsWidget).toHaveScreenshot("tabs-second-active.png");
});
