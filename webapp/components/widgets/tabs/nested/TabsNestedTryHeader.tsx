"use client";

import type { ComponentType } from "react";
import type { WidgetSpec } from "@/lib/types";
import { NESTED_TAB_SLICE, NESTED_TAB_GAP, computeTabLayout } from "../tabLayout";
import { TabBackground, TabLabel } from "../TabParts";

interface TryWidgetRootProps {
  widget: WidgetSpec;
  scale: number;
  childMap: Map<string, WidgetSpec[]>;
  zBase: number;
  allWidgets: WidgetSpec[];
  scrollListeners: Map<string, Set<() => void>>;
}

export function TabsNestedTryHeader({
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
  const slice = NESTED_TAB_SLICE;
  const { tabs: computedTabs } = computeTabLayout(tabChildren, widget.w, NESTED_TAB_GAP);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: tabHeaderHeight, overflow: "visible" }}>
        {computedTabs.map(({ tab, x: tabX, w: tabW }) => {
          const isActive = tab.id === resolvedTabId;
          const tabTex = tex(isActive ? "widget_tab_selected.png" : "widget_tab_unselected.png");
          const tabH = tabHeaderHeight + slice;
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
                  borderImageCss={`url("${tabTex}") ${slice} fill / ${slice}px stretch`} />
              )}
              <TabLabel tab={tab} isActive={isActive} inactivePaddingTop={4} tabHeaderHeight={tabHeaderHeight} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, top: tabHeaderHeight, width: widget.w, height: widget.h - tabHeaderHeight, overflow: "hidden", zIndex: 1 }}>
        {activeTabChildren.map((child, idx) => (
          <TryWidgetRoot key={child.id} widget={child} scale={scale} childMap={childMap} zBase={idx + 1} allWidgets={allWidgets} scrollListeners={new Map()} />
        ))}
      </div>
    </div>
  );
}
