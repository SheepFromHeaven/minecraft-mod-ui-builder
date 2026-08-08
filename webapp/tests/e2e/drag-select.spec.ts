import { test, expect } from "@playwright/test";
import { seedTextures, seedProject, openEditor } from "../support/seed";

/**
 * Coverage for the canvas drag features added alongside axis-lock drag,
 * center/sibling snap guides, the Grid/snap-to-px toggle, and cmd/ctrl-click
 * multi-select + group drag. All screens use a 320×180 canvas with showGrid
 * disabled in the seeded session (snapPx=1), so exact-pixel assertions are
 * safe unless a test explicitly re-enables Grid.
 */

test("shift+drag locks movement to a single axis", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, {
    id: "main", width: 320, height: 180,
    widgets: [
      { id: "label_a", type: "label", x: 40, y: 40, w: 30, h: 20, text: "A", icon: null, props: {} },
    ],
  });
  await openEditor(page);

  const widget = page.locator('[data-widget-id="label_a"]');
  await widget.click();
  const box = await widget.boundingBox();
  if (!box) throw new Error("widget not found");
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.keyboard.down("Shift");
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Larger horizontal move than vertical — should lock to the horizontal axis
  // and discard the vertical component entirely.
  await page.mouse.move(startX + 40, startY + 6, { steps: 5 });
  await page.mouse.up();
  await page.keyboard.up("Shift");

  const after = await widget.boundingBox();
  if (!after) throw new Error("widget missing after drag");
  expect(after.x).toBeGreaterThan(box.x + 30);
  expect(after.y).toBeCloseTo(box.y, 0);
});

test("dragging near the canvas center snaps a root widget to exact center", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, {
    id: "main", width: 320, height: 180,
    widgets: [
      { id: "label_a", type: "label", x: 10, y: 10, w: 60, h: 20, text: "A", icon: null, props: {} },
    ],
  });
  await openEditor(page);

  const widget = page.locator('[data-widget-id="label_a"]');
  await widget.click();
  const box = await widget.boundingBox();
  if (!box) throw new Error("widget not found");
  const canvas = page.locator("[data-canvas]");
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error("canvas not found");

  // Exact center for a 60×20 widget on a 320×180 canvas: x=130, y=80.
  // Land a couple pixels off so the snap (not exact placement) does the work.
  const targetX = canvasBox.x + 130 + box.width / 2 + 2;
  const targetY = canvasBox.y + 80 + box.height / 2 + 2;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetX, targetY, { steps: 5 });
  await page.mouse.up();

  const after = await widget.boundingBox();
  if (!after) throw new Error("widget missing after drag");
  expect(after.x).toBeCloseTo(canvasBox.x + 130, 0);
  expect(after.y).toBeCloseTo(canvasBox.y + 80, 0);
});

test("dragging near a sibling's left edge snaps into alignment", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, {
    id: "main", width: 320, height: 180,
    widgets: [
      { id: "label_a", type: "label", x: 50, y: 20, w: 40, h: 20, text: "A", icon: null, props: {} },
      { id: "label_b", type: "label", x: 200, y: 100, w: 40, h: 20, text: "B", icon: null, props: {} },
    ],
  });
  await openEditor(page);

  const a = page.locator('[data-widget-id="label_a"]');
  const b = page.locator('[data-widget-id="label_b"]');
  await a.click();
  const boxA = await a.boundingBox();
  const boxB = await b.boundingBox();
  if (!boxA || !boxB) throw new Error("widget not found");

  // Move A so its left edge lands a couple px from B's left edge — far from
  // both the canvas center and A's own original position, so only the
  // sibling-alignment snap can explain an exact match.
  const targetX = boxB.x + 2 + boxA.width / 2;
  const targetY = boxA.y + boxA.height / 2;

  await page.mouse.move(boxA.x + boxA.width / 2, boxA.y + boxA.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetX, targetY, { steps: 5 });
  await page.mouse.up();

  const after = await a.boundingBox();
  if (!after) throw new Error("widget missing after drag");
  expect(after.x).toBeCloseTo(boxB.x, 0);
});

test("enabling Grid in the snapping menu snaps drags to the grid step", async ({ page }) => {
  await seedTextures(page);
  // x/y intentionally off the 4px grid seeded in the session.
  await seedProject(page, {
    id: "main", width: 320, height: 180,
    widgets: [
      { id: "label_a", type: "label", x: 41, y: 41, w: 30, h: 20, text: "A", icon: null, props: {} },
    ],
  });
  await openEditor(page);

  await page.getByTitle("Snapping settings").click();
  await page.getByRole("checkbox", { name: "Grid" }).check();
  await page.keyboard.press("Escape");

  const widget = page.locator('[data-widget-id="label_a"]');
  await widget.click();
  const box = await widget.boundingBox();
  if (!box) throw new Error("widget not found");

  // Move diagonally by a non-multiple-of-4 amount, far from any center/sibling
  // snap zone, so grid-snap is the only thing that can explain the result.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 13, box.y + box.height / 2 + 13, { steps: 5 });
  await page.mouse.up();

  const after = await widget.boundingBox();
  if (!after) throw new Error("widget missing after drag");
  expect(Math.round(after.x - box.x) % 4).toBe(0);
  expect(Math.round(after.y - box.y) % 4).toBe(0);
});

test("disabling Grid allows free (non-grid-aligned) pixel movement", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, {
    id: "main", width: 320, height: 180,
    widgets: [
      { id: "label_a", type: "label", x: 41, y: 41, w: 30, h: 20, text: "A", icon: null, props: {} },
    ],
  });
  await openEditor(page); // session seeds showGrid: false already

  const widget = page.locator('[data-widget-id="label_a"]');
  await widget.click();
  const box = await widget.boundingBox();
  if (!box) throw new Error("widget not found");

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 13, box.y + box.height / 2 + 13, { steps: 5 });
  await page.mouse.up();

  const after = await widget.boundingBox();
  if (!after) throw new Error("widget missing after drag");
  expect(Math.round(after.x - box.x)).toBe(13);
  expect(Math.round(after.y - box.y)).toBe(13);
});

test("unchecking snap-to-parent-center stops the center snap", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, {
    id: "main", width: 320, height: 180,
    widgets: [
      { id: "label_a", type: "label", x: 10, y: 10, w: 60, h: 20, text: "A", icon: null, props: {} },
    ],
  });
  await openEditor(page);

  await page.getByTitle("Snapping settings").click();
  await page.getByRole("checkbox", { name: "Snap to parent center" }).uncheck();
  await page.keyboard.press("Escape");

  const widget = page.locator('[data-widget-id="label_a"]');
  await widget.click();
  const box = await widget.boundingBox();
  if (!box) throw new Error("widget not found");
  const canvas = page.locator("[data-canvas]");
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error("canvas not found");

  const targetX = canvasBox.x + 130 + box.width / 2 + 2;
  const targetY = canvasBox.y + 80 + box.height / 2 + 2;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetX, targetY, { steps: 5 });
  await page.mouse.up();

  const after = await widget.boundingBox();
  if (!after) throw new Error("widget missing after drag");
  // Without center-snap, the widget lands where dropped (2px off center),
  // not snapped exactly onto x=130/y=80.
  expect(after.x).not.toBeCloseTo(canvasBox.x + 130, 0);
});

test("ctrl/cmd+click adds a sibling to the selection and drags both together", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, {
    id: "main", width: 320, height: 180,
    widgets: [
      { id: "label_a", type: "label", x: 40, y: 40, w: 30, h: 20, text: "A", icon: null, props: {} },
      { id: "label_b", type: "label", x: 120, y: 90, w: 30, h: 20, text: "B", icon: null, props: {} },
    ],
  });
  await openEditor(page);

  const a = page.locator('[data-widget-id="label_a"]');
  const b = page.locator('[data-widget-id="label_b"]');
  await a.click();
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await b.click({ modifiers: [modifier] });

  const boxA = await a.boundingBox();
  const boxB = await b.boundingBox();
  if (!boxA || !boxB) throw new Error("widget not found");

  // Drag via A — since A is a member of the 2-widget selection, both should
  // move together by the same delta.
  await page.mouse.move(boxA.x + boxA.width / 2, boxA.y + boxA.height / 2);
  await page.mouse.down();
  await page.mouse.move(boxA.x + boxA.width / 2 + 25, boxA.y + boxA.height / 2 + 15, { steps: 5 });
  await page.mouse.up();

  const afterA = await a.boundingBox();
  const afterB = await b.boundingBox();
  if (!afterA || !afterB) throw new Error("widget missing after drag");

  const dxA = afterA.x - boxA.x;
  const dyA = afterA.y - boxA.y;
  const dxB = afterB.x - boxB.x;
  const dyB = afterB.y - boxB.y;

  expect(dxA).toBeGreaterThan(15);
  expect(dxB).toBeCloseTo(dxA, 0);
  expect(dyB).toBeCloseTo(dyA, 0);
});

test("ctrl/cmd+click again removes a widget from the selection", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, {
    id: "main", width: 320, height: 180,
    widgets: [
      { id: "label_a", type: "label", x: 40, y: 40, w: 30, h: 20, text: "A", icon: null, props: {} },
      { id: "label_b", type: "label", x: 120, y: 90, w: 30, h: 20, text: "B", icon: null, props: {} },
    ],
  });
  await openEditor(page);

  const a = page.locator('[data-widget-id="label_a"]');
  const b = page.locator('[data-widget-id="label_b"]');
  await a.click();
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await b.click({ modifiers: [modifier] });
  // Toggle B back out of the selection — only A should remain selected.
  await b.click({ modifiers: [modifier] });

  const boxA = await a.boundingBox();
  const boxB = await b.boundingBox();
  if (!boxA || !boxB) throw new Error("widget not found");

  // Dragging via A should now move only A (B is no longer grouped with it).
  await page.mouse.move(boxA.x + boxA.width / 2, boxA.y + boxA.height / 2);
  await page.mouse.down();
  await page.mouse.move(boxA.x + boxA.width / 2 + 25, boxA.y + boxA.height / 2 + 15, { steps: 5 });
  await page.mouse.up();

  const afterA = await a.boundingBox();
  const afterB = await b.boundingBox();
  if (!afterA || !afterB) throw new Error("widget missing after drag");

  expect(afterA.x).toBeGreaterThan(boxA.x + 15);
  expect(afterB.x).toBeCloseTo(boxB.x, 0);
  expect(afterB.y).toBeCloseTo(boxB.y, 0);
});

/**
 * Regression: cmd/ctrl-click toggled resolveDragTargetId(clickedId) into the
 * selection — the same ancestor-drill-down used to pick a drag target, which
 * returns the OUTERMOST ancestor in the click chain on a first click. For a
 * widget nested inside a panel, that silently toggled the panel instead of
 * the widget actually under the cursor. Fixed by toggling the literal
 * clicked widget id, not the drill-resolved one.
 */
test("ctrl/cmd+click on a nested widget selects that widget, not its ancestor panel", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, {
    id: "main", width: 320, height: 180,
    widgets: [
      { id: "panel_main", type: "panel", x: 0, y: 0, w: 220, h: 175, text: "", icon: null, props: { style: "default" } },
      { id: "label_a", type: "label", x: 10, y: 10, w: 30, h: 20, text: "A", icon: null, props: {}, parentId: "panel_main" },
      { id: "label_b", type: "label", x: 60, y: 60, w: 30, h: 20, text: "B", icon: null, props: {}, parentId: "panel_main" },
    ],
  });
  await openEditor(page);

  const a = page.locator('[data-widget-id="label_a"]');
  const b = page.locator('[data-widget-id="label_b"]');
  // Select A via the layers tree (direct canvas click on a nested widget selects
  // its ancestor first, per the ambiguous-click drill-down — irrelevant here).
  await page.getByRole("button", { name: "label_a", exact: true }).click();

  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await b.click({ modifiers: [modifier] });

  const boxA = await a.boundingBox();
  const boxB = await b.boundingBox();
  if (!boxA || !boxB) throw new Error("widget not found");

  // Dragging via B should move only A and B together, not the panel — if the
  // regression were present, the panel would have been toggled instead of B,
  // and this drag would move nothing (or the whole panel).
  await page.mouse.move(boxB.x + boxB.width / 2, boxB.y + boxB.height / 2);
  await page.mouse.down();
  await page.mouse.move(boxB.x + boxB.width / 2 + 20, boxB.y + boxB.height / 2 + 10, { steps: 5 });
  await page.mouse.up();

  const afterA = await a.boundingBox();
  const afterB = await b.boundingBox();
  if (!afterA || !afterB) throw new Error("widget missing after drag");

  const dxA = afterA.x - boxA.x;
  const dxB = afterB.x - boxB.x;
  expect(dxB).toBeGreaterThan(15);
  expect(dxA).toBeCloseTo(dxB, 0);
});
