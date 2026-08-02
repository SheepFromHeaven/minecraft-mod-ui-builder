"use client";

import type { ComponentType, RefObject } from "react";
import type { WidgetSpec } from "@/lib/types";
import { TAB_TOP_SLICE, TAB_SIDE_SLICE, TAB_LEFT_SLICE, TAB_GAP, computeTabLayout, tabEdgePosition } from "./tabLayout";

export type TabDrag = {
  type: "move" | "resize-right" | "resize-left";
  id: string;
  startMouseX: number;
  startX: number; startW: number;
  minX: number; maxX: number;
  minW: number; maxW: number;
};

interface EditWidgetProps {
  widget: WidgetSpec;
  scale: number;
  selectedId: string | null;
  snapPx: number;
  draggingPos: { id: string; x: number; y: number } | null;
  onResizeCommit: (widget: WidgetSpec) => void;
  childMap: Map<string, WidgetSpec[]>;
  zBase: number;
}

/**
 * Edit-mode's tab selector row + content panel. Passed EditWidget itself
 * (rather than importing it) to avoid a circular import — EditWidget renders
 * this component for `tabs` widgets, and this component recurses back into
 * EditWidget for the active tab's children.
 */
export function TabsEditHeader({
  widget, tabChildren, tex, activeTabId, tabDrag, setTabDrag, inlineEdit, setInlineEdit,
  inlineInputRef, commitInlineEdit, setPreviewTabId, updateWidgets, tabHeaderHeight,
  scale, selectedId, snapPx, draggingPos, onResizeCommit, childMap, activeTabChildren, EditWidget,
}: {
  widget: WidgetSpec;
  tabChildren: WidgetSpec[];
  tex: (name: string) => string | undefined;
  activeTabId: string | null;
  tabDrag: TabDrag | null;
  setTabDrag: (drag: TabDrag | null) => void;
  inlineEdit: { id: string; text: string } | null;
  setInlineEdit: (edit: { id: string; text: string } | null) => void;
  inlineInputRef: RefObject<HTMLInputElement | null>;
  commitInlineEdit: (draft: string) => void;
  setPreviewTabId: (id: string) => void;
  updateWidgets: (widgets: WidgetSpec[]) => void;
  tabHeaderHeight: number;
  scale: number;
  selectedId: string | null;
  snapPx: number;
  draggingPos: { id: string; x: number; y: number } | null;
  onResizeCommit: (widget: WidgetSpec) => void;
  childMap: Map<string, WidgetSpec[]>;
  activeTabChildren: WidgetSpec[];
  EditWidget: ComponentType<EditWidgetProps>;
}) {
  const topSlice = TAB_TOP_SLICE;
  const sideSlice = TAB_SIDE_SLICE;
  const leftSlice = TAB_LEFT_SLICE;
  const GAP = TAB_GAP;
  const { allDefault, getW, getX, tabs: computedTabs } = computeTabLayout(tabChildren, widget.w);
  // per-tab min width = content chars × ~4px + 8px padding per side (16px total)
  const getMinW = (t: WidgetSpec) => {
    const text = t.text || t.id || "";
    return Math.max(16, text.length * 4 + 16);
  };

  // Commit all tab layout defaults as ONE history entry before a drag starts.
  const initIfDefault = () => {
    if (allDefault) updateWidgets(tabChildren.map((tc, i) => ({ ...tc, x: getX(tc, i), w: getW(tc) })));
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Tab selector row — absolutely positioned tabs, overflow visible */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: tabHeaderHeight, overflow: "visible" }}>
        {computedTabs.map(({ tab, x: tabX, w: tabW }, idx) => {
          const isActive = tab.id === activeTabId;
          const pos = tabEdgePosition(tabX, tabW, widget.w);
          const tabTex = tex(isActive ? `tab_selected_${pos}.png` : `tab_unselected_${pos}.png`);
          const minW = getMinW(tab);
          const prev = computedTabs[idx - 1];
          const next = computedTabs[idx + 1];
          // clamp bounds — captured at drag-start so neighbors don't need re-lookup in mousemove
          const moveMinX = prev ? prev.x + prev.w + GAP : 0;
          const moveMaxX = next ? next.x - tabW - GAP : widget.w - tabW;
          const resizeRightMaxW = next ? next.x - tabX - GAP : widget.w - tabX;
          const resizeLeftMaxW = prev ? tabX + tabW - (prev.x + prev.w + GAP) : tabX + tabW;
          const isMoving = tabDrag?.type === "move" && tabDrag.id === tab.id;
          const tabH = tabHeaderHeight + topSlice;
          return (
            <div
              key={tab.id}
              style={{
                position: "absolute",
                left: tabX,
                width: tabW,
                top: -1,
                height: tabH,
                zIndex: isActive ? 3 : 2,
                overflow: "visible",
                userSelect: "none",
                cursor: isMoving ? "grabbing" : "grab",
              }}
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).dataset.resizeHandle) return;
                if (inlineEdit?.id === tab.id) return;
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                initIfDefault();
                setTabDrag({ type: "move", id: tab.id, startMouseX: e.clientX,
                  startX: tabX, startW: tabW,
                  minX: moveMinX, maxX: moveMaxX,
                  minW: 0, maxW: 0 });
              }}
              onClick={(e) => { if (!(e.target as HTMLElement).dataset.resizeHandle) setPreviewTabId(tab.id); }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setInlineEdit({ id: tab.id, text: tab.text });
              }}
            >
              {tabTex && (
                <div style={{ position: "absolute", left: 0, top: 0, width: tabW, height: tabH, boxSizing: "border-box", overflow: "visible",
                  pointerEvents: "none",
                  borderImage: `url("${tabTex}") ${4} ${3} ${0} ${4} fill / ${topSlice}px ${sideSlice}px 0px ${leftSlice}px stretch` }} />
              )}
              {/* Content overlay */}
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                whiteSpace: "nowrap",
                fontSize: 6,
                fontFamily: '"Minecraft", monospace',
                color: isActive ? "#404040" : "#909090",
                pointerEvents: "none",
              }}>
                {inlineEdit?.id === tab.id ? null : tab.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tab.icon} alt="" style={{ width: tabHeaderHeight * 0.6, height: tabHeaderHeight * 0.6, imageRendering: "pixelated", pointerEvents: "none" }} />
                ) : (
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{tab.text || tab.id}</span>
                )}
              </div>
              {inlineEdit?.id === tab.id && (
                <input
                  ref={inlineInputRef}
                  defaultValue={inlineEdit.text}
                  onBlur={(e) => commitInlineEdit(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.currentTarget.blur(); }
                    if (e.key === "Escape") { setInlineEdit(null); }
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute", inset: `0 ${sideSlice}px`,
                    background: "rgba(0,0,0,0.75)",
                    color: "#fff", border: "none", outline: "2px solid #ff0",
                    fontSize: 6,
                    fontFamily: '"Minecraft", monospace',
                    textAlign: "center", width: `calc(100% - ${sideSlice * 2}px)`,
                    zIndex: 10, padding: 0,
                  }}
                />
              )}
              {/* Left-edge resize handle */}
              <div data-resize-handle="left"
                onMouseDown={(e) => {
                  e.stopPropagation(); e.preventDefault();
                  e.nativeEvent.stopImmediatePropagation();
                  initIfDefault();
                  setTabDrag({ type: "resize-left", id: tab.id, startMouseX: e.clientX,
                    startX: tabX, startW: tabW,
                    minX: 0, maxX: 0,
                    minW, maxW: resizeLeftMaxW });
                }}
                style={{ position: "absolute", left: -sideSlice, top: 0, bottom: 0, width: sideSlice + 4, cursor: "ew-resize", zIndex: 3 }}
              />
              {/* Right-edge resize handle */}
              <div data-resize-handle="right"
                onMouseDown={(e) => {
                  e.stopPropagation(); e.preventDefault();
                  e.nativeEvent.stopImmediatePropagation();
                  initIfDefault();
                  setTabDrag({ type: "resize-right", id: tab.id, startMouseX: e.clientX,
                    startX: tabX, startW: tabW,
                    minX: 0, maxX: 0,
                    minW, maxW: resizeRightMaxW });
                }}
                style={{ position: "absolute", right: -sideSlice, top: 0, bottom: 0, width: sideSlice + 4, cursor: "ew-resize", zIndex: 3 }}
              />
            </div>
          );
        })}
      </div>
      {/* Content panel */}
      <div style={{
        position: "absolute",
        left: 0,
        top: tabHeaderHeight,
        width: widget.w,
        height: widget.h - tabHeaderHeight,
        overflow: "hidden",
        zIndex: 1,
      }}>
        {tex("mc_panel_slice.png") && (
          <div style={{ position: "absolute", inset: 0, boxSizing: "border-box",
            borderImage: `url("${tex("mc_panel_slice.png")}") 3 fill / 3px stretch` }} />
        )}
        {activeTabChildren.map((child, idx) => (
          <EditWidget
            key={child.id}
            widget={child}
            scale={scale}
            selectedId={selectedId}
            snapPx={snapPx}
            draggingPos={draggingPos}
            onResizeCommit={onResizeCommit}
            childMap={childMap}
            zBase={idx + 1}
          />
        ))}
      </div>
    </div>
  );
}
