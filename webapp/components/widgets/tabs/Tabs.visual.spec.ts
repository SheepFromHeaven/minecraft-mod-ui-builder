import { test, expect } from "@playwright/test";
import { seedTextures, seedProject, openEditor, enterTryMode } from "../../../tests/support/seed";
import type { ScreenSpec } from "../../../lib/types";

/**
 * Snapshot tests for hierarchical tab-switching isolation.
 * Uses DOM assertions rather than pixel screenshots — switching behaviour
 * is structural (which tab is active / which children are visible).
 */

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
    height: 240,
    widgets: [
      { id: "tabs_outer", type: "tabs", x: 8, y: 8, w: 220, h: 180, text: "", icon: null, props: { tab_height: "20" } },
      { id: "tab_outer_a", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Outer A", icon: null, props: {}, parentId: "tabs_outer" },
      { id: "tab_outer_b", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Outer B", icon: null, props: {}, parentId: "tabs_outer" },
      { id: "tabs_inner", type: "tabs", x: 4, y: 4, w: 180, h: 120, text: "", icon: null, props: { tab_height: "14" }, parentId: "tab_outer_a" },
      { id: "tab_inner_1", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Inner 1", icon: null, props: {}, parentId: "tabs_inner" },
      { id: "tab_inner_2", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Inner 2", icon: null, props: {}, parentId: "tabs_inner" },
    ],
  };
}

test("switching outer tab hides nested tabs; switching back preserves inner tab state", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screen());
  await openEditor(page);
  await enterTryMode(page);

  // Activate inner tab 2
  await click(page, page.getByText("Inner 2", { exact: true }));
  await expect(page.getByText("Inner 2", { exact: true })).toBeVisible();

  // Switch outer to Outer B — nested tabs widget disappears from DOM
  await click(page, page.getByText("Outer B", { exact: true }));
  await expect(page.locator('[data-widget-id="tabs_inner"]')).not.toBeVisible();

  // Switch back to Outer A — inner tab 2 should still be active (Inner 1 content hidden)
  await click(page, page.getByText("Outer A", { exact: true }));
  await expect(page.locator('[data-widget-id="tabs_inner"]')).toBeVisible();
  await expect(page.getByText("Inner 2", { exact: true })).toBeVisible();
});
