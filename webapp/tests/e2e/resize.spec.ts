import { test, expect } from "@playwright/test";
import { seedTextures, seedProject, openEditor, screenWithWidget } from "../support/seed";

/**
 * Regression coverage: EditWidget's onResize handler had an `else` branch
 * that ran on every non-alt resize event and reset the DOM node's transform
 * back to its resize-start position — overwriting react-rnd's own tracking
 * of the drag, so resizing from the left/top handle visually grew the
 * element to the right/bottom instead. Fixed by only resetting the
 * transform when alt was actually released mid-drag.
 */

test("dragging the left resize handle grows the widget leftward, not rightward", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screenWithWidget({
    type: "panel", x: 100, y: 40, w: 60, h: 40, text: "", icon: null, props: {},
  }));
  await openEditor(page);

  const widget = page.locator('[data-widget-id^="panel_"]');
  await widget.click();

  const box = await widget.boundingBox();
  if (!box) throw new Error("widget not found");

  // re-resizable gives handles no class/id by default; the left handle is
  // the only one with both `cursor: col-resize` and `left: -5px` in its
  // inline style (the right handle uses `cursor: col-resize` + `right`).
  const leftHandle = page.locator('div[style*="cursor: col-resize"][style*="left: -5px"]');
  const handleBox = await leftHandle.boundingBox();
  if (!handleBox) throw new Error("left resize handle not found");
  const startX = handleBox.x + handleBox.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 30, startY, { steps: 5 });
  await page.mouse.up();

  const after = await widget.boundingBox();
  if (!after) throw new Error("widget missing after resize");

  // Growing from the left handle must move the left edge left and widen the
  // widget — the right edge must not move. A regression makes the right
  // edge move instead (or the widget shrinks from the left).
  expect(after.x).toBeLessThan(box.x);
  expect(after.width).toBeGreaterThan(box.width);
  expect(after.x + after.width).toBeCloseTo(box.x + box.width, 0);
});

/**
 * Regression: resizeGrid={[4,4]} caused react-rnd to snap ref.style.height to
 * the nearest multiple of 4 even when only width was being resized. A label at
 * h=10px (not on the 4px grid) would jump to h=12px on any horizontal resize.
 * Fixed by computing h = start.h + delta.height instead of parseInt(ref.style.height).
 */
test("resizing width of a label with non-grid-aligned height does not change height", async ({ page }) => {
  await seedTextures(page);
  // h=10 is intentionally off the 4px snap grid so react-rnd would snap it to 12
  await seedProject(page, screenWithWidget({
    type: "label", x: 60, y: 60, w: 60, h: 10, text: "Hi", icon: null, props: {},
  }));
  await openEditor(page);

  const widget = page.locator('[data-widget-id^="label_"]');
  await widget.click();

  const box = await widget.boundingBox();
  if (!box) throw new Error("widget not found");

  const rightHandle = page.locator('div[style*="cursor: col-resize"][style*="right: -5px"]');
  const handleBox = await rightHandle.boundingBox();
  if (!handleBox) throw new Error("right resize handle not found");
  const startX = handleBox.x + handleBox.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 20, startY, { steps: 5 });
  await page.mouse.up();

  const after = await widget.boundingBox();
  if (!after) throw new Error("widget missing after resize");

  expect(after.width).toBeGreaterThan(box.width);
  // Height must be unchanged — not snapped to next multiple of 4 (which would be 12)
  expect(after.height).toBeCloseTo(box.height, 0);
});

/**
 * Regression: alt+resize manually overrides ref.style.transform to show a symmetric
 * preview, which shifts the element's getBoundingClientRect and corrupts react-rnd's
 * internal offsetFromParent tracking. After release, react-rnd uses the stale offset
 * to map the controlled position prop to a draggable position, causing a phantom shift
 * (widget rendered ~16px away from where it was committed).
 * Fixed by resetting rnd.offsetFromParent to {left:0,top:0} in onResizeStop so the
 * controlled position prop is applied without any phantom offset.
 */
test("alt+resize from right handle commits widget to centered position", async ({ page }) => {
  await seedTextures(page);
  // Place widget with room to expand symmetrically in both directions
  await seedProject(page, screenWithWidget({
    type: "label", x: 100, y: 70, w: 60, h: 14, text: "Hi", icon: null, props: {},
  }));
  await openEditor(page);

  const widget = page.locator('[data-widget-id^="label_"]');
  await widget.click();

  const box = await widget.boundingBox();
  if (!box) throw new Error("widget not found");
  const centerBefore = box.x + box.width / 2;

  const rightHandle = page.locator('div[style*="cursor: col-resize"][style*="right: -5px"]');
  const handleBox = await rightHandle.boundingBox();
  if (!handleBox) throw new Error("right resize handle not found");
  const startX = handleBox.x + handleBox.width / 2;
  const startY = box.y + box.height / 2;

  await page.keyboard.down("Alt");
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 20, startY, { steps: 5 });
  await page.mouse.up();
  await page.keyboard.up("Alt");

  const after = await widget.boundingBox();
  if (!after) throw new Error("widget missing after resize");
  const centerAfter = after.x + after.width / 2;

  // Width must grow (both sides expanded symmetrically)
  expect(after.width).toBeGreaterThan(box.width);
  // Center must stay within 1px of original — not jump to left border
  expect(centerAfter).toBeCloseTo(centerBefore, 0);
});

/**
 * Regression: computeResizeBounds returns maxW = parent.w - widget.x (using the original
 * widget x). Alt+resize shifts the widget left by dw, so the correct available width at
 * the committed position is parent.w - newX, which is wider. Using the original bounds
 * incorrectly clamped the committed width to (parent.w - widget.x) even though the widget
 * had shifted left, truncating the width by dw.
 * Fixed by re-anchoring the clamp: parentW = maxW + widget.x; w = min(w, parentW - x).
 */
test("alt+resize inside a panel does not clamp width using original widget position", async ({ page }) => {
  await seedTextures(page);
  // label at x=80 inside panel w=220; resizeBounds.maxW = 220-80 = 140.
  // Alt+drag right 70px: committed x = 80-70 = 10, w = 60+2*70 = 200.
  // Without the fix: min(200, 140) = 140 — width gets truncated.
  await seedProject(page, {
    id: "main", width: 220, height: 175,
    widgets: [
      { id: "panel_main", type: "panel", x: 0, y: 0, w: 220, h: 175, text: "", icon: null, props: { style: "default" } },
      { id: "label_name", type: "label", x: 80, y: 6, w: 60, h: 10, text: "Hi", icon: null, props: {}, parentId: "panel_main" },
    ],
  });
  await openEditor(page);

  const widget = page.locator('[data-widget-id="label_name"]');
  // Click the layer list entry to select label_name (direct canvas click selects the panel first)
  await page.getByRole('button', { name: 'label_name', exact: true }).click();
  const box = await widget.boundingBox();
  if (!box) throw new Error("widget not found");

  // Derive handle position directly from the widget box — avoids ambiguity when
  // multiple widgets (panel + label) both have right handles in the DOM.
  const startX = box.x + box.width + 2; // just inside the right handle (handle is at right:-5px)
  const startY = box.y + box.height / 2;

  await page.keyboard.down("Alt");
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 70, startY, { steps: 5 });
  await page.mouse.up();
  await page.keyboard.up("Alt");

  const after = await widget.boundingBox();
  if (!after) throw new Error("widget missing after resize");

  // With fix: committed x=10, w=200 (fits within panel: 10+200=210 ≤ 220).
  // Without fix: committed w clamped to 140 (panel.w - original widget.x = 140).
  expect(after.width).toBeGreaterThan(140);
});
