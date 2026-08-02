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
