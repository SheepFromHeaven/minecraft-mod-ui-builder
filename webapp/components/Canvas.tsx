"use client";

import { useState, useCallback, useRef, createContext, useContext } from "react";
import React from "react";
import { Rnd } from "react-rnd";
import type { WidgetSpec, BindingsSchema } from "@/lib/types";
import { getBindingNode } from "@/components/BindingsTree";
import WidgetVisual from "./WidgetVisual";
import WIDGET_REGISTRY from "@/lib/widgetRegistry";
import { useTextures } from "@/lib/TextureContext";

const BindingsCtx = createContext<BindingsSchema>({});

// ── Shared scroll state for try mode ─────────────────────────────────────────
interface ScrollPos   { x: number; y: number }
interface ScrollCtxVal {
  getScroll:    (id: string) => ScrollPos;
  setScroll:    (id: string, pos: ScrollPos) => void;
  getMaxScroll: (id: string) => ScrollPos;
  setMaxScroll: (id: string, max: ScrollPos) => void;
}
const ScrollCtx = React.createContext<ScrollCtxVal>({
  getScroll:    () => ({ x: 0, y: 0 }),
  setScroll:    () => undefined,
  getMaxScroll: () => ({ x: 0, y: 0 }),
  setMaxScroll: () => undefined,
});

const WORLD_IMAGE_URL = "/mc-world-bg.jpg";

const CONTAINER_TYPES = new Set(
  WIDGET_REGISTRY.filter(d => d.isContainer).map(d => d.type),
);

// Handle texture is 12px wide + 1px bevel each side
const SCROLLBAR_FIXED_PX = 14;

interface Props {
  width: number;
  height: number;
  scale: number;
  widgets: WidgetSpec[];
  selectedId: string | null;
  gridSize: number;
  showGrid: boolean;
  tryMode: boolean;
  bindingsSchema: BindingsSchema;
  onSelect: (id: string | null) => void;
  onUpdateWidget: (widget: WidgetSpec) => void;
}

function applyBindingPreviews(widget: WidgetSpec, schema: BindingsSchema): { widget: WidgetSpec; hidden: boolean } {
  if (!widget.bindings || Object.keys(widget.bindings).length === 0) return { widget, hidden: false };
  let w = widget;
  let hidden = false;
  for (const [target, path] of Object.entries(widget.bindings)) {
    const node = getBindingNode(schema, path);
    if (!node) continue;
    const val = node.previewValue;
    if (target === "text" && typeof val === "string") w = { ...w, text: val };
    else if (target === "visible" && val === false) hidden = true;
    else if (target === "enabled" && val === false) w = { ...w, props: { ...w.props, _disabled: "1" } };
  }
  return { widget: w, hidden };
}

export default function Canvas({
  width, height, scale, widgets, selectedId, gridSize, showGrid, tryMode, bindingsSchema, onSelect, onUpdateWidget,
}: Props) {
  const cssWidth = width * scale;
  const cssHeight = height * scale;
  const snapPx = gridSize * scale;
  const gridDataUrl = showGrid && !tryMode ? buildGridDataUrl(snapPx) : undefined;

  const childMap = buildChildMap(widgets);
  const rootWidgets = widgets.filter(w => !w.parentId);

  // Shared scroll state for try mode — kept in refs so updates don't re-render
  // the whole canvas; individual TryWidget components re-render via their own state.
  const scrollMapRef    = useRef<Map<string, ScrollPos>>(new Map());
  const maxScrollMapRef = useRef<Map<string, ScrollPos>>(new Map());
  const scrollListeners = useRef<Map<string, Set<() => void>>>(new Map());

  const scrollCtxVal = React.useMemo<ScrollCtxVal>(() => ({
    getScroll:    (id) => scrollMapRef.current.get(id) ?? { x: 0, y: 0 },
    setScroll:    (id, pos) => {
      scrollMapRef.current.set(id, pos);
      scrollListeners.current.get(id)?.forEach(fn => fn());
    },
    getMaxScroll: (id) => maxScrollMapRef.current.get(id) ?? { x: 0, y: 0 },
    setMaxScroll: (id, max) => { maxScrollMapRef.current.set(id, max); },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  // Tracks the live in-progress drag position of a single widget so its own
  // Rnd, and any ancestor group auto-sizing to wrap it, update in real time
  // before the drag commits.
  const [draggingPos, setDraggingPos] = useState<{ id: string; x: number; y: number } | null>(null);

  const getWidget = (id: string) => widgets.find(w => w.id === id);

  const resolveChain = (id: string): string[] => {
    const chain: string[] = [];
    let cur: string | undefined = id;
    while (cur) {
      chain.unshift(cur);
      cur = getWidget(cur)?.parentId;
    }
    return chain;
  };

  // Plain click: drill one level deeper into the ancestor chain each click
  // (a static click on nested widgets is inherently ambiguous about which
  // level the user means, so successive clicks refine the target).
  const handleClickWidget = (clickedId: string) => {
    const chain = resolveChain(clickedId);
    const idx = selectedId !== null ? chain.indexOf(selectedId) : -1;
    onSelect(idx >= 0 && idx < chain.length - 1 ? chain[idx + 1] : chain[0]);
  };

  // Drag target resolution is deliberately different from click's drill-down:
  // an actual drag gesture should move whatever is CURRENTLY selected if it's
  // an ancestor (or itself) of the clicked widget, otherwise the outermost
  // root container — never drilling deeper than the existing selection.
  // E.g. dragging an unselected button moves its root panel; dragging that
  // same button while its containing group is selected moves the group.
  const resolveDragTargetId = (clickedId: string): string => {
    const chain = resolveChain(clickedId);
    return selectedId !== null && chain.includes(selectedId) ? selectedId : chain[0];
  };

  // All dragging is driven from a single listener here rather than from each
  // widget's own <Rnd>, because letting every nested Rnd manage its own drag
  // makes it impossible to redirect movement to an ancestor: react-draggable
  // doesn't stop propagation on its own (multiple ancestors would all start
  // dragging at once), and even after preventing that, a child's own Rnd has
  // no way to move a *different* (ancestor) widget instead of itself. Rnd's
  // built-in dragging is disabled everywhere (see EditWidget); this handler
  // is the sole source of drag movement, keyed to the resolved target only.
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (tryMode) return;
    const el = (e.target as HTMLElement).closest("[data-widget-id]");
    if (!el) { onSelect(null); return; }
    const clickedId = el.getAttribute("data-widget-id")!;

    // Selection depends on whether this gesture turns out to be a plain
    // click or an actual drag — decided once, below, never both, to avoid
    // flashing one selection before the other overrides it.
    const targetId = resolveDragTargetId(clickedId);
    const target = getWidget(targetId);
    if (!target) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const origX = target.x;
    const origY = target.y;
    let moved = false;

    const onMove = (ev: MouseEvent) => {
      const dx = Math.round((ev.clientX - startClientX) / scale);
      const dy = Math.round((ev.clientY - startClientY) / scale);
      if (dx === 0 && dy === 0) return;
      if (!moved) {
        moved = true;
        // An actual drag unambiguously identifies its target.
        onSelect(targetId);
      }
      setDraggingPos({ id: targetId, x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) });
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (moved) {
        const dx = Math.round((ev.clientX - startClientX) / scale);
        const dy = Math.round((ev.clientY - startClientY) / scale);
        onUpdateWidget({ ...target, x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) });
      } else {
        // No movement occurred — this was a plain click, so apply the
        // ambiguous-click drill-down instead of the drag-target resolution.
        handleClickWidget(clickedId);
      }
      setDraggingPos(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      style={{
        position: "relative",
        width: cssWidth,
        height: cssHeight,
        flexShrink: 0,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        cursor: tryMode ? "default" : undefined,
      }}
      onMouseDown={handleCanvasMouseDown}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={WORLD_IMAGE_URL}
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", zIndex: 0 }}
      />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.48)", pointerEvents: "none", zIndex: 1 }} />

      {gridDataUrl && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("${gridDataUrl}")`,
          backgroundSize: `${snapPx}px ${snapPx}px`,
          pointerEvents: "none", zIndex: 1, opacity: 0.4,
        }} />
      )}

      {tryMode && <ScrollCtx.Provider value={scrollCtxVal}>
        {rootWidgets.map((widget, idx) =>
          <TryWidgetRoot key={widget.id} widget={widget} scale={scale} childMap={childMap} zBase={idx + 2} allWidgets={widgets} scrollListeners={scrollListeners.current} />
        )}
      </ScrollCtx.Provider>}
      <BindingsCtx.Provider value={bindingsSchema}>
        {rootWidgets.map((widget, idx) =>
          tryMode ? null
            : (
              <EditWidget
                key={widget.id}
                widget={widget}
                scale={scale}
                selectedId={selectedId}
                snapPx={snapPx}
                draggingPos={draggingPos}
                onResizeCommit={onUpdateWidget}
                childMap={childMap}
                zBase={idx + 2}
              />
            )
        )}
      </BindingsCtx.Provider>
    </div>
  );
}

function buildChildMap(widgets: WidgetSpec[]): Map<string, WidgetSpec[]> {
  const map = new Map<string, WidgetSpec[]>();
  for (const w of widgets) {
    if (w.parentId) {
      const arr = map.get(w.parentId) ?? [];
      arr.push(w);
      map.set(w.parentId, arr);
    }
  }
  return map;
}

// ── Edit mode widget ──────────────────────────────────────────────────────────

function EditWidget({ widget, scale, selectedId, snapPx, draggingPos, onResizeCommit, childMap, zBase }: {
  widget: WidgetSpec;
  scale: number;
  selectedId: string | null;
  snapPx: number;
  draggingPos: { id: string; x: number; y: number } | null;
  onResizeCommit: (widget: WidgetSpec) => void;
  childMap: Map<string, WidgetSpec[]>;
  zBase: number;
}) {
  const bindingsSchema = useContext(BindingsCtx);
  const { widget: previewWidget, hidden } = applyBindingPreviews(widget, bindingsSchema);
  const isSelected = widget.id === selectedId;
  const isContainer = CONTAINER_TYPES.has(widget.type);
  const children = isContainer ? (childMap.get(widget.id) ?? []) : [];
  const clips = widget.type === "scroll";
  const isGroup = widget.type === "group";

  // Live drag position substitution: this widget itself may be the current
  // drag target (position moves live before the drag commits)...
  const liveX = draggingPos?.id === widget.id ? draggingPos.x : widget.x;
  const liveY = draggingPos?.id === widget.id ? draggingPos.y : widget.y;

  // ...or, for groups, one of its children may be, which changes auto-size.
  const renderW = isGroup && children.length > 0
    ? Math.max(...children.map(c => (draggingPos?.id === c.id ? draggingPos.x : c.x) + c.w))
    : widget.w;
  const renderH = isGroup && children.length > 0
    ? Math.max(...children.map(c => (draggingPos?.id === c.id ? draggingPos.y : c.y) + c.h))
    : widget.h;

  return (
    <Rnd
      position={{ x: liveX * scale, y: liveY * scale }}
      size={{
        width:  widget.type === "scrollbar" && (widget.props.axis ?? "y") === "y" ? SCROLLBAR_FIXED_PX * scale : renderW * scale,
        height: widget.type === "scrollbar" && (widget.props.axis ?? "y") === "x" ? SCROLLBAR_FIXED_PX * scale : renderH * scale,
      }}
      minWidth={widget.type === "scrollbar" && (widget.props.axis ?? "y") === "y" ? SCROLLBAR_FIXED_PX * scale : undefined}
      maxWidth={widget.type === "scrollbar" && (widget.props.axis ?? "y") === "y" ? SCROLLBAR_FIXED_PX * scale : undefined}
      minHeight={widget.type === "scrollbar" && widget.props.axis === "x" ? SCROLLBAR_FIXED_PX * scale : undefined}
      maxHeight={widget.type === "scrollbar" && widget.props.axis === "x" ? SCROLLBAR_FIXED_PX * scale : undefined}
      resizeGrid={[snapPx, snapPx]}
      // All dragging is handled centrally by Canvas's own mousedown listener
      // (see handleCanvasMouseDown) — it can redirect movement to an
      // ancestor widget, which react-rnd's own per-node dragging cannot do.
      disableDragging
      data-widget-id={widget.id}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        const x = Math.max(0, Math.round(position.x / scale));
        const y = Math.max(0, Math.round(position.y / scale));
        let w = Math.max(1, Math.round(parseInt(ref.style.width) / scale));
        let h = Math.max(1, Math.round(parseInt(ref.style.height) / scale));
        // Scrollbar: lock the cross-axis to the handle texture width (12px + 2px bevel = 14)
        if (widget.type === "scrollbar") {
          const axis = widget.props.axis ?? "y";
          if (axis === "y") w = SCROLLBAR_FIXED_PX;
          else              h = SCROLLBAR_FIXED_PX;
        }
        if (x === widget.x && y === widget.y && w === widget.w && h === widget.h) return;
        onResizeCommit({ ...widget, x, y, w, h });
      }}
      style={{
        outline: isSelected ? `2px solid #ff0` : "none",
        outlineOffset: 1,
        zIndex: zBase,
        cursor: "move",
        opacity: hidden ? 0.25 : 1,
      }}
      enableResizing={isSelected && !isGroup && widget.type !== "scrollbar"
        ? true
        : isSelected && widget.type === "scrollbar"
          ? (widget.props.axis ?? "y") === "y"
            ? { top: true, bottom: true, topLeft: false, topRight: false, bottomLeft: false, bottomRight: false, left: false, right: false }
            : { left: true, right: true, topLeft: false, topRight: false, bottomLeft: false, bottomRight: false, top: false, bottom: false }
          : false
      }
    >
      <WidgetVisual widget={previewWidget} scale={scale} interactState="idle" />
      {isContainer && (
        <div style={{
          position: "absolute",
          inset: 0,
          overflow: clips ? "hidden" : "visible",
        }}>
          {children.map((child, idx) => (
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
      )}
    </Rnd>
  );
}

// tiny context bridge so try-mode components can reach textures without prop drilling
const TextureCtx = React.createContext<{ textures: Record<string, string> }>({ textures: {} });

// ── Try mode inventory area (scrollable) ─────────────────────────────────────

function TryInventoryArea({ widget, scale, zBase, externalScrollbarIdY, externalScrollbarIdX }: {
  widget: WidgetSpec;
  scale: number;
  zBase: number;
  externalScrollbarIdY?: string;
  externalScrollbarIdX?: string;
}) {
  const { textures } = React.useContext(TextureCtx);
  const tex = (name: string) => (textures as Record<string, string>)[name];
  const scrollCtx = React.useContext(ScrollCtx);

  const cols     = parseInt(widget.props.cols      ?? "9",  10);
  const rows     = parseInt(widget.props.rows      ?? "3",  10);
  const slotSize = parseInt(widget.props.slot_size ?? "18", 10) * scale;
  const fullW    = cols * slotSize;
  const fullH    = rows * slotSize;
  const viewW    = widget.w * scale;
  const viewH    = widget.h * scale;

  const maxScrollLeft = Math.max(0, fullW - viewW);
  const maxScrollTop  = Math.max(0, fullH - viewH);

  // Re-render when an external scrollbar's pct changes
  const [, forceRender] = useState(0);
  React.useEffect(() => {
    const ctx = scrollCtx as unknown as { _listeners?: Map<string, Set<() => void>> };
    if (!ctx._listeners) ctx._listeners = new Map();
    const fn = () => forceRender(n => n + 1);
    const ids = [externalScrollbarIdY, externalScrollbarIdX].filter(Boolean) as string[];
    ids.forEach(id => {
      const set = ctx._listeners!.get(id) ?? new Set<() => void>();
      set.add(fn);
      ctx._listeners!.set(id, set);
    });
    return () => { ids.forEach(id => ctx._listeners?.get(id)?.delete(fn)); };
  }, [externalScrollbarIdY, externalScrollbarIdX, scrollCtx]);

  // External scrollbar pct → snap to whole rows/cols
  // scrollableRows = rows that can scroll out of view before the last row hits the bottom
  const scrollableRows = Math.max(0, rows - Math.floor(viewH / slotSize));
  const scrollableCols = Math.max(0, cols - Math.floor(viewW / slotSize));
  const extPctY = externalScrollbarIdY ? (scrollCtx.getScroll(externalScrollbarIdY).y ?? 0) : null;
  const extPctX = externalScrollbarIdX ? (scrollCtx.getScroll(externalScrollbarIdX).x ?? 0) : null;

  const clipsH = maxScrollTop  > 0;
  const clipsW = maxScrollLeft > 0;
  const showBuiltinY = clipsH && !externalScrollbarIdY;
  const showBuiltinX = clipsW && !externalScrollbarIdX;

  const barW = 4 * scale;
  const innerViewW = showBuiltinY ? viewW - barW : viewW;
  const innerViewH = showBuiltinX ? viewH - barW : viewH;

  // Internal scroll state (wheel / built-in thumb)
  const [pos, setPos] = useState<ScrollPos>({ x: 0, y: 0 });

  // Final scroll: external scrollbar pct snaps to whole row/col; internal state used otherwise
  const scrollY = extPctY !== null
    ? Math.round(extPctY * scrollableRows) * slotSize
    : pos.y;
  const scrollX = extPctX !== null
    ? Math.round(extPctX * scrollableCols) * slotSize
    : pos.x;

  const setScroll = useCallback((next: ScrollPos) => {
    setPos(next);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setPos(prev => ({
      x: Math.max(0, Math.min(maxScrollLeft, prev.x + (e.deltaX || (!clipsH ? e.deltaY : 0)))),
      y: Math.max(0, Math.min(maxScrollTop,  prev.y + (clipsH ? e.deltaY : 0))),
    }));
  };

  // Built-in scrollbar thumb drag
  const [thumbDrag, setThumbDrag] = useState<{ axis: "v"|"h"; startClient: number; startScroll: number } | null>(null);
  const thumbHRatio = Math.min(1, innerViewH / fullH);
  const thumbWRatio = Math.min(1, innerViewW / fullW);
  const thumbH      = Math.max(barW * 2, innerViewH * thumbHRatio);
  const thumbW      = Math.max(barW * 2, innerViewW * thumbWRatio);
  const thumbTop    = maxScrollTop  > 0 ? (scrollY / maxScrollTop)  * (innerViewH - thumbH) : 0;
  const thumbLeft   = maxScrollLeft > 0 ? (scrollX / maxScrollLeft) * (innerViewW - thumbW) : 0;

  const onThumbPointerMove = (e: React.PointerEvent) => {
    if (!thumbDrag) return;
    if (thumbDrag.axis === "v") {
      const delta = (e.clientY - thumbDrag.startClient) / (innerViewH - thumbH) * maxScrollTop;
      setScroll({ ...pos, y: Math.max(0, Math.min(maxScrollTop, thumbDrag.startScroll + delta)) });
    } else {
      const delta = (e.clientX - thumbDrag.startClient) / (innerViewW - thumbW) * maxScrollLeft;
      setScroll({ ...pos, x: Math.max(0, Math.min(maxScrollLeft, thumbDrag.startScroll + delta)) });
    }
  };

  return (
    <div
      style={{ position: "absolute", left: widget.x * scale, top: widget.y * scale, width: viewW, height: viewH, zIndex: zBase }}
      onWheel={handleWheel}
      onPointerMove={thumbDrag ? onThumbPointerMove : undefined}
      onPointerUp={() => setThumbDrag(null)}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: innerViewW, height: innerViewH, overflow: "hidden", boxSizing: "border-box" }}>
        <div style={{
          position: "absolute",
          top: -scrollY, left: -scrollX,
          width: fullW, height: fullH,
          backgroundImage: `url("${tex("mc_slot_tile.png")}")`,
          backgroundSize: `${slotSize}px ${slotSize}px`,
          backgroundRepeat: "repeat",
          imageRendering: "pixelated",
          boxSizing: "border-box",
        }} />
      </div>

      {showBuiltinY && (
        <div style={{ position: "absolute", top: 0, right: 0, width: barW, height: innerViewH, background: "#1a1a1a", borderLeft: `${Math.max(1, scale)}px solid #444` }}>
          <div style={{ position: "absolute", top: thumbTop, width: "100%", height: thumbH, background: "#555", cursor: "pointer" }}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setThumbDrag({ axis: "v", startClient: e.clientY, startScroll: pos.y }); }} />
        </div>
      )}
      {showBuiltinX && (
        <div style={{ position: "absolute", bottom: 0, left: 0, width: innerViewW, height: barW, background: "#1a1a1a", borderTop: `${Math.max(1, scale)}px solid #444` }}>
          <div style={{ position: "absolute", left: thumbLeft, height: "100%", width: thumbW, background: "#555", cursor: "pointer" }}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setThumbDrag({ axis: "h", startClient: e.clientX, startScroll: pos.x }); }} />
        </div>
      )}
    </div>
  );
}

// ── Try mode scrollbar (external, controls a target inventory_area) ────────────

function TryScrollbar({ widget, scale, zBase }: {
  widget: WidgetSpec;
  scale: number;
  zBase: number;
}) {
  const { textures } = React.useContext(TextureCtx);
  const tex = (name: string) => (textures as Record<string, string>)[name];
  const scrollCtx = React.useContext(ScrollCtx);

  const axis       = widget.props.axis ?? "y";
  const isVertical = axis === "y";
  const borderPx   = scale;

  // Re-render when own pct changes
  const [, forceRender] = useState(0);
  React.useEffect(() => {
    const ctx = scrollCtx as unknown as { _listeners?: Map<string, Set<() => void>> };
    if (!ctx._listeners) ctx._listeners = new Map();
    const set = ctx._listeners.get(widget.id) ?? new Set<() => void>();
    const fn = () => forceRender(n => n + 1);
    set.add(fn);
    ctx._listeners.set(widget.id, set);
    return () => { set.delete(fn); };
  }, [widget.id, scrollCtx]);

  // Scrollbar owns a pct (0-1) stored under its own id — target reads it
  const ownPos = scrollCtx.getScroll(widget.id);
  const pct    = isVertical ? ownPos.y : ownPos.x;

  const trackLen   = isVertical ? widget.h * scale : widget.w * scale;
  const thumbLen   = 15 * scale;
  const travelLen  = Math.max(1, trackLen - thumbLen - 2 * borderPx);
  const thumbOffset = pct * travelLen;

  const dragRef = React.useRef<{ startClient: number; startPct: number } | null>(null);

  const trackRef = React.useRef<HTMLDivElement>(null);

  const snapPct = (rawPct: number) => {
    // Snap to whole texture pixels (1 texture px = scale CSS px)
    const snapped = Math.round(rawPct * travelLen / scale) * scale;
    return Math.max(0, Math.min(travelLen, snapped)) / travelLen;
  };

  const getPctFromEvent = (e: React.PointerEvent) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const offset = isVertical ? (e.clientY - rect.top) : (e.clientX - rect.left);
    return snapPct((offset - thumbLen / 2) / travelLen);
  };

  const dragCursor = isVertical ? "ns-resize" : "ew-resize";

  const onTrackPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const nextPct = getPctFromEvent(e);
    dragRef.current = { startClient: isVertical ? e.clientY : e.clientX, startPct: nextPct };
    if (trackRef.current) trackRef.current.style.cursor = dragCursor;
    scrollCtx.setScroll(widget.id, isVertical ? { x: 0, y: nextPct } : { x: nextPct, y: 0 });
  };
  const onTrackPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const deltaPct = ((isVertical ? e.clientY : e.clientX) - dragRef.current.startClient) / travelLen;
    const nextPct  = snapPct(dragRef.current.startPct + deltaPct);
    scrollCtx.setScroll(widget.id, isVertical ? { x: 0, y: nextPct } : { x: nextPct, y: 0 });
  };

  const fixedW = isVertical ? SCROLLBAR_FIXED_PX * scale : widget.w * scale;
  const fixedH = isVertical ? widget.h * scale : SCROLLBAR_FIXED_PX * scale;

  return (
    <div
      ref={trackRef}
      style={{
        position: "absolute",
        left: widget.x * scale, top: widget.y * scale,
        width: fixedW, height: fixedH,
        zIndex: zBase,
        border: `${borderPx}px solid transparent`,
        borderImage: `url("${tex("mc_slot_tile.png")}") 1 fill / ${borderPx}px stretch`,
        imageRendering: "pixelated",
        boxSizing: "border-box",
        cursor: "pointer",
      }}
      onPointerDown={onTrackPointerDown}
      onPointerMove={onTrackPointerMove}
      onPointerUp={() => { dragRef.current = null; if (trackRef.current) trackRef.current.style.cursor = "pointer"; }}
    >
      <div
        style={{
          position: "absolute",
          ...(isVertical
            ? { top: thumbOffset, left: 0 }
            : { left: thumbOffset, top: (12 * scale - 15 * scale) / 2 }),
          width: 12 * scale, height: 15 * scale,
          backgroundImage: `url("${tex("mc_scrollbar_handle.png")}")`,
          backgroundSize: `${12 * scale}px ${15 * scale}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          pointerEvents: "none",
          transform: isVertical ? undefined : "rotate(90deg)",
          transformOrigin: "center",
        }}
      />
    </div>
  );
}

function TryWidgetRoot(props: { widget: WidgetSpec; scale: number; childMap: Map<string, WidgetSpec[]>; zBase: number; allWidgets: WidgetSpec[]; scrollListeners: Map<string, Set<() => void>> }) {
  const { textures } = useTextures();
  const { widget, scale, zBase, allWidgets } = props;

  // Wire up scroll listeners to context so TryScrollbar re-renders when inventory scrolls
  const scrollCtx = React.useContext(ScrollCtx);
  React.useEffect(() => {
    const ctx = scrollCtx as unknown as { _listeners?: Map<string, Set<() => void>> };
    if (!ctx._listeners) ctx._listeners = new Map();
    // Patch setScroll to also fire _listeners
    const origSet = scrollCtx.setScroll.bind(scrollCtx);
    (scrollCtx as unknown as { setScroll: typeof origSet }).setScroll = (id, pos) => {
      origSet(id, pos);
      ctx._listeners?.get(id)?.forEach(fn => fn());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const extScrollbarY = allWidgets.find(w => w.type === "scrollbar" && w.props.target === widget.id && (w.props.axis ?? "y") === "y");
  const extScrollbarX = allWidgets.find(w => w.type === "scrollbar" && w.props.target === widget.id && w.props.axis === "x");

  return (
    <TextureCtx.Provider value={{ textures: textures as Record<string, string> }}>
      {widget.type === "inventory_area"
        ? <TryInventoryArea widget={widget} scale={scale} zBase={zBase} externalScrollbarIdY={extScrollbarY?.id} externalScrollbarIdX={extScrollbarX?.id} />
        : widget.type === "scrollbar"
          ? <TryScrollbar widget={widget} scale={scale} zBase={zBase} />
          : <TryWidget widget={widget} scale={scale} childMap={props.childMap} zBase={zBase} allWidgets={allWidgets} />}
    </TextureCtx.Provider>
  );
}

// ── Try mode widget ───────────────────────────────────────────────────────────

function TryWidget({ widget, scale, childMap, zBase, allWidgets }: {
  widget: WidgetSpec;
  scale: number;
  childMap: Map<string, WidgetSpec[]>;
  zBase: number;
  allWidgets: WidgetSpec[];
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [sliderVal, setSliderVal] = useState(() => parseFloat(widget.props.value ?? "50"));
  const [inputVal, setInputVal] = useState(widget.props.default_text ?? "");
  const [focused, setFocused] = useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isContainer = CONTAINER_TYPES.has(widget.type);
  const children = isContainer ? (childMap.get(widget.id) ?? []) : [];
  const clips = widget.type === "scroll";

  const isToggle = widget.type === "toggle_button";
  const isSlider = widget.type === "slider";
  const isInput = widget.type === "input";
  const isPassive = widget.type === "panel" || widget.type === "scroll" || widget.type === "group" || widget.type === "label" || widget.type === "icon";
  const interactState = pressed ? "pressed" : (isInput ? focused : hovered) ? "hovered" : "idle";

  const handleSliderPointer = (e: React.PointerEvent) => {
    if (!isSlider || !trackRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const update = (ev: React.PointerEvent) => {
      const rect = trackRef.current!.getBoundingClientRect();
      const min = parseFloat(widget.props.min ?? "0");
      const max = parseFloat(widget.props.max ?? "100");
      const step = parseFloat(widget.props.step ?? "1");
      const handleW = 8 * scale;
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left - handleW / 2) / (rect.width - handleW)));
      const raw = min + pct * (max - min);
      const snapped = Math.round(raw / step) * step;
      setSliderVal(Math.max(min, Math.min(max, snapped)));
    };
    update(e);
    const onMove = (ev: PointerEvent) => update(ev as unknown as React.PointerEvent);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", () => window.removeEventListener("pointermove", onMove), { once: true });
  };

  let liveWidget = widget;
  if (isSlider) liveWidget = { ...widget, props: { ...widget.props, value: String(sliderVal) } };
  if (isInput) liveWidget = { ...widget, text: inputVal };

  return (
    <div
      ref={isSlider ? trackRef : undefined}
      style={{
        position: "absolute",
        left: widget.x * scale,
        top: widget.y * scale,
        width: widget.w * scale,
        height: widget.h * scale,
        zIndex: zBase,
        cursor: isSlider ? "ew-resize" : isInput ? "text" : isPassive ? "default" : "pointer",
        touchAction: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => {
        if (isInput) { setFocused(true); setTimeout(() => inputRef.current?.focus(), 0); return; }
        if (!isPassive && !isSlider) setPressed(true);
      }}
      onMouseUp={() => {
        if (isPassive || isSlider || isInput) return;
        setPressed(false);
        if (isToggle) setToggled((v) => !v);
      }}
      onPointerDown={isSlider ? handleSliderPointer : undefined}
    >
      <WidgetVisual widget={liveWidget} scale={scale} interactState={interactState} toggled={toggled} />
      {isContainer && (
        <div style={{ position: "absolute", inset: 0, overflow: clips ? "hidden" : "visible" }}>
          {children.map((child, idx) => (
            <TryWidgetRoot key={child.id} widget={child} scale={scale} childMap={childMap} zBase={idx + 1} allWidgets={allWidgets} scrollListeners={new Map()} />
          ))}
        </div>
      )}
      {isInput && (
        <input
          ref={inputRef}
          value={inputVal}
          maxLength={parseInt(widget.props.max_length ?? "32")}
          onChange={(e) => setInputVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            position: "absolute", inset: 0,
            background: "transparent", color: "transparent", caretColor: "transparent",
            border: "none", outline: "none", padding: 0,
            cursor: "text", fontSize: "inherit",
          }}
        />
      )}
    </div>
  );
}

function buildGridDataUrl(px: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"><path d="M ${px} 0 L 0 0 0 ${px}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="0.5"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
