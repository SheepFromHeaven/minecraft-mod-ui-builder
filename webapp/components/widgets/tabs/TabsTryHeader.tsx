"use client";

import type { ComponentType } from "react";
import type { WidgetSpec } from "@/lib/types";
import { TAB_TOP_SLICE, TAB_SIDE_SLICE, TAB_LEFT_SLICE, computeTabLayout, tabEdgePosition } from "./tabLayout";

interface TryWidgetRootProps {
  widget: WidgetSpec;
  scale: number;
  childMap: Map<string, WidgetSpec[]>;
  zBase: number;
  allWidgets: WidgetSpec[];
  scrollListeners: Map<string, Set<() => void>>;
}

/**
 * Try-mode's tab selector row + content panel. Passed TryWidgetRoot itself
 * (rather than importing it) to avoid a circular import — it renders this
 * component for `tabs` widgets, and this component recurses back into it for
 * the active tab's children.
 */
export function TabsTryHeader({
  widget, tabChildren, tex, resolvedTabId, setActiveTab, tabHeaderHeight,
  scale, childMap, activeTabChildren, allWidgets, TryWidgetRoot,
}: {
  widget: WidgetSpec;
  tabChildren: WidgetSpec[];
  tex: (name: string) => string | undefined;
  resolvedTabId: string | null;
  setActiveTab: (tabsWidgetId: string, tabId: string) => void;
  tabHeaderHeight: number;
  scale: number;
  childMap: Map<string, WidgetSpec[]>;
  activeTabChildren: WidgetSpec[];
  allWidgets: WidgetSpec[];
  TryWidgetRoot: ComponentType<TryWidgetRootProps>;
}) {
  const topSlice = TAB_TOP_SLICE;
  const sideSlice = TAB_SIDE_SLICE;
  const leftSlice = TAB_LEFT_SLICE;
  const { tabs: computedTabs } = computeTabLayout(tabChildren, widget.w);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: tabHeaderHeight, overflow: "visible" }}>
        {computedTabs.map(({ tab, x: tabX, w: tabW }) => {
          const isActive = tab.id === resolvedTabId;
          const pos = tabEdgePosition(tabX, tabW, widget.w);
          const tabTex = tex(isActive ? `tab_selected_${pos}.png` : `tab_unselected_${pos}.png`);
          const tabH = tabHeaderHeight + topSlice;
          return (
            <div
              key={tab.id}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setActiveTab(widget.id, tab.id)}
              style={{
                position: "absolute",
                left: tabX,
                width: tabW,
                top: -1,
                height: tabH,
                zIndex: isActive ? 3 : 2,
                overflow: "visible",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {tabTex && (
                <div style={{ position: "absolute", left: 0, top: 0, width: tabW, height: tabH, boxSizing: "border-box", overflow: "visible",
                  pointerEvents: "none",
                  borderImage: `url("${tabTex}") ${4} ${3} ${0} ${4} fill / ${topSlice}px ${sideSlice}px 0px ${leftSlice}px stretch` }} />
              )}
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                whiteSpace: "nowrap",
                fontSize: 6,
                fontFamily: '"Minecraft", monospace',
                color: isActive ? "#404040" : "#909090",
                pointerEvents: "none",
              }}>
                {tab.icon
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={tab.icon} alt="" style={{ width: tabHeaderHeight * 0.6, height: tabHeaderHeight * 0.6, imageRendering: "pixelated" }} />
                  : tab.text || tab.id
                }
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, top: tabHeaderHeight, width: widget.w, height: widget.h - tabHeaderHeight, overflow: "hidden", zIndex: 1 }}>
        {tex("mc_panel_slice.png") && (
          <div style={{ position: "absolute", inset: 0, boxSizing: "border-box",
            borderImage: `url("${tex("mc_panel_slice.png")}") 3 fill / 3px stretch` }} />
        )}
        {activeTabChildren.map((child, idx) => (
          <TryWidgetRoot key={child.id} widget={child} scale={scale} childMap={childMap} zBase={idx + 1} allWidgets={allWidgets} scrollListeners={new Map()} />
        ))}
      </div>
    </div>
  );
}
