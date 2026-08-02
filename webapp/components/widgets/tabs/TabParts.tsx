"use client";

import type { WidgetSpec } from "@/lib/types";

/** The 9-sliced border-image background of a single tab. */
export function TabBackground({ tex, tabW, tabH, borderImageCss }: {
  tex: string;
  tabW: number;
  tabH: number;
  borderImageCss: string;
}) {
  return (
    <div style={{
      position: "absolute", left: 0, top: 0,
      width: tabW, height: tabH,
      boxSizing: "border-box", overflow: "visible",
      pointerEvents: "none",
      borderImage: borderImageCss,
    }} />
  );
}

/** The centered label (icon or text) inside a tab. */
export function TabLabel({ tab, isActive, inactivePaddingTop, tabHeaderHeight, editing = false }: {
  tab: WidgetSpec;
  isActive: boolean;
  inactivePaddingTop: number;
  tabHeaderHeight: number;
  editing?: boolean;
}) {
  if (editing) return null;
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      paddingTop: isActive ? 0 : inactivePaddingTop,
      whiteSpace: "nowrap",
      fontSize: 6,
      fontFamily: '"Minecraft", monospace',
      color: isActive ? "#404040" : "#909090",
      pointerEvents: "none",
    }}>
      {tab.icon
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={tab.icon} alt="" style={{ width: tabHeaderHeight * 0.6, height: tabHeaderHeight * 0.6, imageRendering: "pixelated", pointerEvents: "none" }} />
        : <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{tab.text || tab.id}</span>
      }
    </div>
  );
}
