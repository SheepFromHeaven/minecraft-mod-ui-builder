"use client";

import type { ComponentType } from "react";
import type { WidgetSpec } from "@/lib/types";
import { TAB_TOP_SLICE, TAB_SIDE_SLICE, TAB_LEFT_SLICE, TAB_GAP, computeTabLayout, tabEdgePosition } from "../tabLayout";
import { TabBackground, TabLabel } from "../TabParts";

interface TryWidgetRootProps {
  widget: WidgetSpec;
  scale: number;
  childMap: Map<string, WidgetSpec[]>;
  zBase: number;
  allWidgets: WidgetSpec[];
  scrollListeners: Map<string, Set<() => void>>;
}

export function TabsTopTryHeader({
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
  const { tabs: computedTabs } = computeTabLayout(tabChildren, widget.w, TAB_GAP);
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
                left: tabX, width: tabW, top: -1, height: tabH,
                zIndex: isActive ? 3 : 2,
                overflow: "visible", cursor: "pointer", userSelect: "none",
              }}
            >
              {tabTex && (
                <TabBackground tex={tabTex} tabW={tabW} tabH={tabH}
                  borderImageCss={`url("${tabTex}") ${4} ${3} ${0} ${4} fill / ${topSlice}px ${sideSlice}px 0px ${leftSlice}px stretch`} />
              )}
              <TabLabel tab={tab} isActive={isActive} inactivePaddingTop={topSlice} tabHeaderHeight={tabHeaderHeight} />
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
