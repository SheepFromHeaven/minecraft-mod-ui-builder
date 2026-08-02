import { describe, it, expect } from "vitest";
import { tabContentArea, computeDragBounds, computeResizeBounds, computeInitialSize } from "@/lib/widgetBounds";
import { makeWidget } from "./fixtures";

// ── tabContentArea ─────────────────────────────────────────────────────────────

describe("tabContentArea", () => {
  it("subtracts tab_height from the tabs widget height", () => {
    const tabs = makeWidget({ id: "tabs", type: "tabs", w: 200, h: 150, props: { tab_height: "30" } });
    expect(tabContentArea(tabs)).toEqual({ w: 200, h: 120 });
  });

  it("defaults tab_height to 20 when prop absent", () => {
    const tabs = makeWidget({ id: "tabs", type: "tabs", w: 100, h: 80 });
    expect(tabContentArea(tabs)).toEqual({ w: 100, h: 60 });
  });
});

// ── computeInitialSize ─────────────────────────────────────────────────────────

describe("computeInitialSize", () => {
  it("returns default size when no parent", () => {
    expect(computeInitialSize(60, 30, undefined, [])).toEqual({ w: 60, h: 30 });
  });

  it("clamps to panel/group parent dimensions", () => {
    const panel = makeWidget({ id: "panel", type: "panel", w: 40, h: 20 });
    // default size larger than panel → clamps
    expect(computeInitialSize(60, 30, "panel", [panel])).toEqual({ w: 40, h: 20 });
  });

  it("does not grow beyond default size inside a large parent", () => {
    const panel = makeWidget({ id: "panel", type: "panel", w: 200, h: 200 });
    expect(computeInitialSize(60, 30, "panel", [panel])).toEqual({ w: 60, h: 30 });
  });

  it("uses tabs content area (not tab header dimensions) for tab children", () => {
    const tabs = makeWidget({ id: "tabs", type: "tabs", w: 160, h: 120, props: { tab_height: "20" } });
    // tab widget's own w/h are tiny (header button), should NOT be used
    const tab = makeWidget({ id: "tab1", type: "tab", w: 40, h: 20, parentId: "tabs" });
    const all = [tabs, tab];
    // content area is 160 × 100; default 80×50 fits
    expect(computeInitialSize(80, 50, "tab1", all)).toEqual({ w: 80, h: 50 });
  });

  it("clamps to tabs content area when default exceeds it", () => {
    const tabs = makeWidget({ id: "tabs", type: "tabs", w: 100, h: 60, props: { tab_height: "20" } });
    const tab = makeWidget({ id: "tab1", type: "tab", w: 30, h: 15, parentId: "tabs" });
    // content area 100×40; default 120×80 → clamped to 100×40
    expect(computeInitialSize(120, 80, "tab1", [tabs, tab])).toEqual({ w: 100, h: 40 });
  });

  it("falls back to tab own dimensions when grandparent tabs widget is missing", () => {
    const tab = makeWidget({ id: "tab1", type: "tab", w: 30, h: 15, parentId: "orphan-tabs" });
    expect(computeInitialSize(60, 30, "tab1", [tab])).toEqual({ w: 30, h: 15 });
  });

  it("returns default size when parentId is not found in widgets list", () => {
    expect(computeInitialSize(60, 30, "ghost", [])).toEqual({ w: 60, h: 30 });
  });
});

// ── computeDragBounds ──────────────────────────────────────────────────────────

describe("computeDragBounds", () => {
  it("root widget is bounded by canvas dimensions", () => {
    const btn = makeWidget({ id: "btn", type: "button", w: 20, h: 10 });
    expect(computeDragBounds(btn, [btn], 320, 180)).toEqual({ maxX: 300, maxY: 170 });
  });

  it("widget inside a panel is bounded by panel dimensions", () => {
    const panel = makeWidget({ id: "panel", type: "panel", w: 80, h: 60 });
    const btn = makeWidget({ id: "btn", type: "button", w: 20, h: 10, parentId: "panel" });
    expect(computeDragBounds(btn, [panel, btn], 320, 180)).toEqual({ maxX: 60, maxY: 50 });
  });

  it("tab child is bounded by the tabs content area, not the tab button dimensions", () => {
    const tabs = makeWidget({ id: "tabs", type: "tabs", w: 160, h: 120, props: { tab_height: "20" } });
    // tab button is tiny — its w/h must NOT be used for bounds
    const tab = makeWidget({ id: "tab1", type: "tab", w: 30, h: 15, parentId: "tabs" });
    const btn = makeWidget({ id: "btn", type: "button", w: 20, h: 10, parentId: "tab1" });
    // content area 160 × (120-20)=100; maxX = 160-20=140, maxY = 100-10=90
    expect(computeDragBounds(btn, [tabs, tab, btn], 320, 180)).toEqual({ maxX: 140, maxY: 90 });
  });

  it("falls back to canvas when grandparent tabs widget is missing", () => {
    const tab = makeWidget({ id: "tab1", type: "tab", w: 30, h: 15, parentId: "ghost-tabs" });
    const btn = makeWidget({ id: "btn", type: "button", w: 20, h: 10, parentId: "tab1" });
    // parent is tab, but grandparent not found → falls back to tab's own dims
    expect(computeDragBounds(btn, [tab, btn], 320, 180)).toEqual({ maxX: 10, maxY: 5 });
  });
});

// ── computeResizeBounds ────────────────────────────────────────────────────────

describe("computeResizeBounds", () => {
  it("returns null for root widgets", () => {
    const btn = makeWidget({ id: "btn", type: "button" });
    expect(computeResizeBounds(btn, [btn])).toBeNull();
  });

  it("constrains resize within panel parent", () => {
    const panel = makeWidget({ id: "panel", type: "panel", w: 80, h: 60 });
    const btn = makeWidget({ id: "btn", type: "button", x: 10, y: 5, w: 20, h: 10, parentId: "panel" });
    // maxW = 80-10=70, maxH = 60-5=55
    expect(computeResizeBounds(btn, [panel, btn])).toEqual({ maxW: 70, maxH: 55 });
  });

  it("constrains resize within tabs content area for tab children", () => {
    const tabs = makeWidget({ id: "tabs", type: "tabs", w: 160, h: 120, props: { tab_height: "20" } });
    const tab = makeWidget({ id: "tab1", type: "tab", w: 30, h: 15, parentId: "tabs" });
    const btn = makeWidget({ id: "btn", type: "button", x: 10, y: 5, w: 20, h: 10, parentId: "tab1" });
    // content area 160×100; maxW = 160-10=150, maxH = 100-5=95
    expect(computeResizeBounds(btn, [tabs, tab, btn])).toEqual({ maxW: 150, maxH: 95 });
  });

  it("returns null when parentId present but parent not found", () => {
    const btn = makeWidget({ id: "btn", type: "button", parentId: "ghost" });
    expect(computeResizeBounds(btn, [btn])).toBeNull();
  });
});
