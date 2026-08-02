import { describe, it, expect } from "vitest";
import {
  resolveAbsolutePos,
  buildContainerSpec,
  excludeFromExportedWidgets,
} from "@/components/widgets/inventory_area/inventoryAreaExport";
import { makeWidget } from "./fixtures";

// ── resolveAbsolutePos ─────────────────────────────────────────────────────────

describe("resolveAbsolutePos", () => {
  it("top-level widget returns its own x/y", () => {
    const w = makeWidget({ id: "a", type: "label", x: 10, y: 20 });
    expect(resolveAbsolutePos(w, new Map([["a", w]]))).toEqual({ x: 10, y: 20 });
  });

  it("child widget adds parent's absolute position", () => {
    const parent = makeWidget({ id: "p", type: "panel", x: 5, y: 15 });
    const child = makeWidget({ id: "c", type: "label", x: 3, y: 4, parentId: "p" });
    const byId = new Map([["p", parent], ["c", child]]);
    expect(resolveAbsolutePos(child, byId)).toEqual({ x: 8, y: 19 });
  });

  it("tab child ignores its own x/y and offsets by parent tab_height", () => {
    const tabs = makeWidget({ id: "tabs", type: "tabs", x: 10, y: 20, props: { tab_height: "30" } });
    const tab = makeWidget({ id: "tab1", type: "tab", x: 999, y: 999, parentId: "tabs" });
    const byId = new Map([["tabs", tabs], ["tab1", tab]]);
    expect(resolveAbsolutePos(tab, byId)).toEqual({ x: 10, y: 50 });
  });

  it("falls back gracefully when parent is missing", () => {
    const w = makeWidget({ id: "orphan", type: "label", x: 7, y: 8, parentId: "ghost" });
    expect(resolveAbsolutePos(w, new Map([["orphan", w]]))).toEqual({ x: 7, y: 8 });
  });
});

// ── buildContainerSpec ─────────────────────────────────────────────────────────

describe("buildContainerSpec", () => {
  it("returns undefined when no inventory_area widgets", () => {
    const widgets = [makeWidget({ id: "btn", type: "button" })];
    expect(buildContainerSpec(widgets)).toBeUndefined();
  });

  it("converts a single inventory_area into a slot spec", () => {
    const area = makeWidget({
      id: "inv", type: "inventory_area",
      x: 8, y: 84, w: 162, h: 54,
      props: { cols: "9", slot_size: "18" },
    });
    const spec = buildContainerSpec([area]);
    expect(spec?.slots).toHaveLength(1);
    const slot = spec!.slots[0];
    expect(slot.id).toBe("inv");
    expect(slot.x).toBe(8);
    expect(slot.y).toBe(84);
    expect(slot.cols).toBe(9);
    expect(slot.slot_size).toBe(18);
    expect(slot.viewport_rows).toBe(3); // 54 / 18
  });

  it("applies correct absolute position for a nested inventory_area", () => {
    const panel = makeWidget({ id: "panel", type: "panel", x: 10, y: 20 });
    const area = makeWidget({
      id: "inv", type: "inventory_area",
      x: 5, y: 5, w: 36, h: 18,
      props: { slot_size: "18", cols: "2" },
      parentId: "panel",
    });
    const spec = buildContainerSpec([panel, area]);
    expect(spec?.slots[0].x).toBe(15);
    expect(spec?.slots[0].y).toBe(25);
  });

  it("defaults cols=1, slot_size=18 when props absent", () => {
    const area = makeWidget({ id: "inv", type: "inventory_area", h: 36 });
    const spec = buildContainerSpec([area]);
    expect(spec?.slots[0].cols).toBe(1);
    expect(spec?.slots[0].slot_size).toBe(18);
    expect(spec?.slots[0].viewport_rows).toBe(2); // 36 / 18
  });

  it("includes source when prop set", () => {
    const area = makeWidget({ id: "inv", type: "inventory_area", props: { source: "player" } });
    const spec = buildContainerSpec([area]);
    expect(spec?.slots[0].source).toBe("player");
  });

  it("throws on duplicate inventory_area ids", () => {
    const a = makeWidget({ id: "inv", type: "inventory_area" });
    const b = makeWidget({ id: "inv", type: "inventory_area" });
    expect(() => buildContainerSpec([a, b])).toThrow(/Duplicate inventory_area id "inv"/);
  });
});

// ── excludeFromExportedWidgets ─────────────────────────────────────────────────

describe("excludeFromExportedWidgets", () => {
  it("strips inventory_area widgets", () => {
    const widgets = [
      makeWidget({ id: "btn", type: "button" }),
      makeWidget({ id: "inv", type: "inventory_area" }),
      makeWidget({ id: "lbl", type: "label" }),
    ];
    const result = excludeFromExportedWidgets(widgets);
    expect(result.map(w => w.id)).toEqual(["btn", "lbl"]);
  });

  it("returns all widgets unchanged when no inventory_area present", () => {
    const widgets = [
      makeWidget({ id: "a", type: "button" }),
      makeWidget({ id: "b", type: "label" }),
    ];
    expect(excludeFromExportedWidgets(widgets)).toHaveLength(2);
  });
});
