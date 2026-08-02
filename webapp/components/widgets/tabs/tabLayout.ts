import type { WidgetSpec } from "@/lib/types";

// Shared by TabsEditHeader.tsx and TabsTryHeader.tsx — both used to
// copy-paste this layout math, which meant a fix to one (e.g. default-width
// distribution, gap sizing) could silently stay missing from the other.

export const TAB_TOP_SLICE = 4;
export const TAB_SIDE_SLICE = 3;
export const TAB_LEFT_SLICE = 4;
export const TAB_GAP = 2;

export interface ComputedTab {
  tab: WidgetSpec;
  x: number;
  w: number;
}

/**
 * Resolves each tab's on-screen x/width. Tabs default to x=0,w=0 until
 * dragged/resized once — while all tabs are still at that default, they're
 * distributed evenly across the container width; afterward each tab's own
 * x/w (set by a prior drag/resize) is used as-is.
 */
export function computeTabLayout(tabChildren: WidgetSpec[], containerWidth: number): {
  allDefault: boolean;
  defaultTabW: number;
  getW: (t: WidgetSpec) => number;
  getX: (t: WidgetSpec, i: number) => number;
  tabs: ComputedTab[];
} {
  const allDefault = tabChildren.length > 0 && tabChildren.every((t) => t.w === 0);
  const defaultTabW = tabChildren.length > 0
    ? Math.max(16, Math.floor((containerWidth - TAB_GAP * Math.max(0, tabChildren.length - 1)) / tabChildren.length))
    : 0;
  const getW = (t: WidgetSpec) => (allDefault ? defaultTabW : Math.max(16, t.w || defaultTabW));
  const getX = (t: WidgetSpec, i: number) => (allDefault
    ? tabChildren.slice(0, i).reduce((acc, prev) => acc + getW(prev) + TAB_GAP, 0)
    : t.x);

  const tabs = tabChildren.map((t, i) => ({ tab: t, w: getW(t), x: getX(t, i) }));

  return { allDefault, defaultTabW, getW, getX, tabs };
}

/** "left" | "middle" | "right" — which tab-sprite variant to use, based on whether the tab touches either edge of the tabs container. */
export function tabEdgePosition(tabX: number, tabW: number, containerWidth: number): "left" | "middle" | "right" {
  if (tabX <= 0) return "left";
  if (tabX + tabW >= containerWidth) return "right";
  return "middle";
}
