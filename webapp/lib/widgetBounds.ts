import type { WidgetSpec } from "./types";

/**
 * Returns the usable content area (width × height) of a `tabs` widget —
 * i.e. the full widget size minus the tab header strip.
 */
export function tabContentArea(tabs: WidgetSpec): { w: number; h: number } {
  const tabH = parseInt(tabs.props?.tab_height ?? "20", 10);
  return { w: tabs.w, h: tabs.h - tabH };
}

/**
 * Returns the maximum x/y a widget can be dragged to without leaving its
 * parent container. Coordinates are relative to the container origin.
 * Falls back to the canvas dimensions for root widgets.
 */
export function computeDragBounds(
  target: WidgetSpec,
  allWidgets: WidgetSpec[],
  canvasW: number,
  canvasH: number,
): { maxX: number; maxY: number } {
  if (target.parentId) {
    const parent = allWidgets.find(w => w.id === target.parentId);
    if (parent?.type === "tab" && parent.parentId) {
      const tabs = allWidgets.find(w => w.id === parent.parentId);
      if (tabs) {
        const { w, h } = tabContentArea(tabs);
        return { maxX: w - target.w, maxY: h - target.h };
      }
    }
    if (parent) return { maxX: parent.w - target.w, maxY: parent.h - target.h };
  }
  return { maxX: canvasW - target.w, maxY: canvasH - target.h };
}

/**
 * Returns the maximum width/height a widget can be resized to without
 * overflowing its parent container, or null for root widgets (unconstrained).
 */
export function computeResizeBounds(
  widget: WidgetSpec,
  allWidgets: WidgetSpec[],
): { maxW: number; maxH: number } | null {
  if (!widget.parentId) return null;
  const parent = allWidgets.find(w => w.id === widget.parentId);
  if (!parent) return null;
  if (parent.type === "tab" && parent.parentId) {
    const tabs = allWidgets.find(w => w.id === parent.parentId);
    if (tabs) {
      const { w, h } = tabContentArea(tabs);
      return { maxW: w - widget.x, maxH: h - widget.y };
    }
  }
  return { maxW: parent.w - widget.x, maxH: parent.h - widget.y };
}

/**
 * Computes the w/h to use when adding a new widget as a child of parentId.
 * For `tab` children the content area comes from the grandparent `tabs` widget;
 * for any other container it comes from the parent's own dimensions.
 */
export function computeInitialSize(
  defaultW: number,
  defaultH: number,
  parentId: string | undefined,
  allWidgets: WidgetSpec[],
): { w: number; h: number } {
  if (!parentId) return { w: defaultW, h: defaultH };
  const parent = allWidgets.find(w => w.id === parentId);
  if (!parent) return { w: defaultW, h: defaultH };

  let clampW: number;
  let clampH: number;
  if (parent.type === "tab" && parent.parentId) {
    const tabs = allWidgets.find(w => w.id === parent.parentId);
    if (tabs) {
      const { w, h } = tabContentArea(tabs);
      clampW = w;
      clampH = h;
    } else {
      clampW = parent.w;
      clampH = parent.h;
    }
  } else {
    clampW = parent.w;
    clampH = parent.h;
  }
  return { w: Math.min(defaultW, clampW), h: Math.min(defaultH, clampH) };
}
