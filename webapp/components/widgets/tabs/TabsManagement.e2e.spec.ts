import { test, expect } from "@playwright/test";
import { seedTextures, seedProject, openEditor } from "../../../tests/support/seed";
import type { ScreenSpec } from "../../../lib/types";

/**
 * E2e coverage for tabs management rules introduced alongside nested tabs:
 *  - Adding a `tabs` widget auto-creates one `tab` child.
 *  - The last tab of a `tabs` widget cannot be deleted.
 *  - A second tab can be added via the "+" button on the tabs node in the
 *    layers tree, and that tab can subsequently be deleted.
 *  - `tabs` and `tab` do not appear in the generic add-widget palette.
 */

function emptyScreen(): ScreenSpec {
  return { id: "main", width: 320, height: 180, widgets: [] };
}

function screenWithOnlyTabs(): ScreenSpec {
  return {
    id: "main",
    width: 320,
    height: 180,
    widgets: [
      { id: "tabs_1", type: "tabs", x: 8, y: 8, w: 176, h: 150, text: "", icon: null, props: { tab_height: "20" } },
      { id: "tab_a", type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Only", icon: null, props: {}, parentId: "tabs_1" },
    ],
  };
}

function screenWithTwoTabs(): ScreenSpec {
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

// ── palette exclusion ─────────────────────────────────────────────────────────

test("add-widget palette contains Tabs but not Tab", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, emptyScreen());
  await openEditor(page);

  // Open the top-level "Add widget" group-action button in the layers sidebar.
  await page.getByTitle("Add widget").click();

  // Tabs (the container) must be addable; Tab (the child) must not be.
  await expect(page.getByRole("menuitem", { name: "Tabs" })).toHaveCount(1);
  await expect(page.getByRole("menuitem", { name: "Tab" })).toHaveCount(0);
});

// ── last-tab protection ───────────────────────────────────────────────────────

test("cannot delete the last tab of a tabs widget via the delete button", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screenWithOnlyTabs());
  await openEditor(page);

  // Hover the tab_a row in the layers tree to reveal its action bar.
  const tabRow = page.locator('[data-layer-id="tab_a"]');
  await tabRow.hover();
  await tabRow.getByTitle("Delete").click();

  // The tab must still be present — deletion of the last tab is a no-op.
  await expect(page.locator('[data-layer-id="tab_a"]')).toHaveCount(1);
});

test("cannot delete the last tab via the keyboard Delete key", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screenWithOnlyTabs());
  await openEditor(page);

  // Select tab_a on the canvas.
  await page.locator('[data-widget-id="tab_a"]').click();
  await page.keyboard.press("Delete");

  await expect(page.locator('[data-layer-id="tab_a"]')).toHaveCount(1);
});

// ── second tab can be deleted ─────────────────────────────────────────────────

test("can delete a tab when at least two tabs remain", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screenWithTwoTabs());
  await openEditor(page);

  const tabRow = page.locator('[data-layer-id="tab_b"]');
  await tabRow.hover();
  await tabRow.getByTitle("Delete").click();

  await expect(page.locator('[data-layer-id="tab_b"]')).toHaveCount(0);
  await expect(page.locator('[data-layer-id="tab_a"]')).toHaveCount(1);
});

// ── layers tree "+" adds a tab ────────────────────────────────────────────────

test("clicking '+' on a tabs node in the layers tree adds a tab child", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screenWithOnlyTabs());
  await openEditor(page);

  // Before: one tab child.
  await expect(page.locator('[data-layer-id^="tab_"]')).toHaveCount(1);

  // Hover the tabs_1 row and click its "Add tab" button.
  const tabsRow = page.locator('[data-layer-id="tabs_1"]');
  await tabsRow.hover();
  await tabsRow.getByTitle("Add tab").click();

  // After: two tab children.
  await expect(page.locator('[data-layer-id^="tab_"]')).toHaveCount(2);
});
