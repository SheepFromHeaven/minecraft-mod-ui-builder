"use client";

import { useState, useCallback, useRef, createContext, useContext } from "react";
import React from "react";

import { Rnd } from "react-rnd";
import type { WidgetSpec, BindingsSchema } from "@/lib/types";
import { getBindingNode } from "@/components/BindingsTree";
import WidgetVisual from "./WidgetVisual";
import WIDGET_REGISTRY from "@/lib/widgetRegistry";
import { useTextures } from "@/lib/TextureContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddWidgetItems } from "@/components/AddWidgetItems";

const BindingsCtx = createContext<BindingsSchema>({});
const UpdateWidgetCtx = React.createContext<(w: WidgetSpec) => void>(() => {});
const UpdateWidgetsCtx = React.createContext<(ws: WidgetSpec[]) => void>(() => {});

interface ActiveTabCtxVal {
  activeTabIds: Map<string, string>;
  setActiveTab: (tabsWidgetId: string, tabId: string) => void;
}
const ActiveTabCtx = React.createContext<ActiveTabCtxVal>({
  activeTabIds: new Map(),
  setActiveTab: () => {},
});

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

// Resize handle visuals — the hit area is provided by re-resizable; we render
// a centered square inside it so the handle looks like standard design tools.
const HANDLE_VISUAL = (
  <div style={{
    width: 8, height: 8,
    background: "#fff",
    border: "1.5px solid #1a6bcc",
    borderRadius: 1.5,
    boxShadow: "0 0 0 1px rgba(0,0,0,0.25)",
    pointerEvents: "none",
  }} />
);
const RESIZE_HANDLE_STYLES: Record<string, React.CSSProperties> = {
  top:         { display: "flex", alignItems: "center",   justifyContent: "center" },
  bottom:      { display: "flex", alignItems: "center",   justifyContent: "center" },
  left:        { display: "flex", alignItems: "center",   justifyContent: "center" },
  right:       { display: "flex", alignItems: "center",   justifyContent: "center" },
  topLeft:     { display: "flex", alignItems: "center",   justifyContent: "center" },
  topRight:    { display: "flex", alignItems: "center",   justifyContent: "center" },
  bottomLeft:  { display: "flex", alignItems: "center",   justifyContent: "center" },
  bottomRight: { display: "flex", alignItems: "center",   justifyContent: "center" },
};
const RESIZE_HANDLE_COMPONENT: Record<string, React.ReactElement> = {
  top: HANDLE_VISUAL, bottom: HANDLE_VISUAL,
  left: HANDLE_VISUAL, right: HANDLE_VISUAL,
  topLeft: HANDLE_VISUAL, topRight: HANDLE_VISUAL,
  bottomLeft: HANDLE_VISUAL, bottomRight: HANDLE_VISUAL,
};

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
  onUpdateWidgets: (widgets: WidgetSpec[]) => void;
  onAddWidget?: (type: string, x: number, y: number) => void;
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
  width, height, scale, widgets, selectedId, gridSize, showGrid, tryMode, bindingsSchema, onSelect, onUpdateWidget, onUpdateWidgets, onAddWidget,
}: Props) {
  const cssWidth = width * scale;
  const cssHeight = height * scale;
  // snapPx is in MC pixel units (1px = 1 MC px inside the inner canvas)
  const snapPx = gridSize;
  const gridDataUrl = showGrid && !tryMode ? buildGridDataUrl(snapPx) : undefined;

  const childMap = buildChildMap(widgets);
  const rootWidgets = widgets.filter(w => !w.parentId);

  // Active tab selection — shared across edit and try mode so switching modes
  // doesn't reset which tab is open.
  const [activeTabIds, setActiveTabIds] = useState<Map<string, string>>(() => new Map());
  const setActiveTab = React.useCallback((tabsWidgetId: string, tabId: string) => {
    setActiveTabIds(prev => new Map(prev).set(tabsWidgetId, tabId));
  }, []);

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
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null); // canvas-unit coords
  // canvasRef points to the outer wrapper div so getBoundingClientRect returns the visual bounding box
  const canvasRef = useRef<HTMLDivElement>(null);

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
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    if (tryMode || !onAddWidget) return;
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.round((e.clientX - rect.left) / scale));
    const y = Math.max(0, Math.round((e.clientY - rect.top) / scale));
    setCtxMenu({ x, y });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (tryMode) return;
    if (e.button !== 0) return; // ignore right/middle click — right-click is handled by contextmenu
    e.preventDefault(); // prevent native browser image/text drag hijacking mouse events
    setCtxMenu(null);
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

    const snapToGrid = (v: number) => Math.round(v / gridSize) * gridSize;
    const onMove = (ev: MouseEvent) => {
      const dx = snapToGrid(origX + (ev.clientX - startClientX) / scale) - origX;
      const dy = snapToGrid(origY + (ev.clientY - startClientY) / scale) - origY;
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
        const dx = snapToGrid(origX + (ev.clientX - startClientX) / scale) - origX;
        const dy = snapToGrid(origY + (ev.clientY - startClientY) / scale) - origY;
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
    // Outer wrapper: holds the visual layout space (cssWidth × cssHeight CSS px)
    // and owns the event handlers so getBoundingClientRect gives the correct visual box.
    <div
      ref={canvasRef}
      style={{
        width: cssWidth,
        height: cssHeight,
        flexShrink: 0,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        cursor: tryMode ? "default" : undefined,
      }}
      onMouseDown={handleCanvasMouseDown}
      onContextMenu={handleCanvasContextMenu}
    >
      {/* Inner canvas: renders at 1px = 1 MC pixel; CSS transform scales to fill the wrapper */}
      <div style={{
        position: "relative",
        width,
        height,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        imageRendering: "pixelated",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={WORLD_IMAGE_URL}
          alt=""
          draggable={false}
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

        <ActiveTabCtx.Provider value={React.useMemo(() => ({ activeTabIds, setActiveTab }), [activeTabIds, setActiveTab])}>
        {tryMode && <ScrollCtx.Provider value={scrollCtxVal}>
          {rootWidgets.map((widget, idx) =>
            <TryWidgetRoot key={widget.id} widget={widget} scale={scale} childMap={childMap} zBase={idx + 2} allWidgets={widgets} scrollListeners={scrollListeners.current} />
          )}
        </ScrollCtx.Provider>}
        <BindingsCtx.Provider value={bindingsSchema}>
          <UpdateWidgetsCtx.Provider value={onUpdateWidgets}>
          <UpdateWidgetCtx.Provider value={onUpdateWidget}>
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
          </UpdateWidgetCtx.Provider>
          </UpdateWidgetsCtx.Provider>
        </BindingsCtx.Provider>
        </ActiveTabCtx.Provider>

        {ctxMenu && onAddWidget && (
          <CanvasContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            scale={scale}
            onAdd={(type) => { onAddWidget(type, ctxMenu.x, ctxMenu.y); setCtxMenu(null); }}
            onClose={() => setCtxMenu(null)}
          />
        )}
      </div>
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
  const { textures: editTextures } = useTextures();
  const tex = (name: string) => (editTextures as Record<string, string>)[name];
  const { widget: previewWidget, hidden } = applyBindingPreviews(widget, bindingsSchema);
  const isSelected = widget.id === selectedId;
  const isContainer = CONTAINER_TYPES.has(widget.type);
  const children = isContainer ? (childMap.get(widget.id) ?? []) : [];
  const clips = widget.type === "scroll";
  const isGroup = widget.type === "group";
  const isTabs = widget.type === "tabs";

  // Preview-only: which of this `tabs` widget's `tab` children is shown on the canvas right now.
  // Not persisted — a designer convenience for previewing content that's otherwise hidden,
  // mirroring how SpecScreen picks a default active tab at runtime.
  const tabChildren = isTabs ? children.filter((c) => c.type === "tab") : [];
  const tabHeaderHeight = isTabs ? parseInt(widget.props.tab_height ?? "20", 10) : 0;
  const { activeTabIds, setActiveTab } = useContext(ActiveTabCtx);
  const storedTabId = isTabs ? (activeTabIds.get(widget.id) ?? null) : null;
  const activeTabId = storedTabId && tabChildren.some((t) => t.id === storedTabId)
    ? storedTabId
    : tabChildren[0]?.id ?? null;
  const setPreviewTabId = (id: string) => setActiveTab(widget.id, id);

  const activeTabChildren = activeTabId ? (childMap.get(activeTabId) ?? []) : [];

  // Tab move/resize (edit mode only)
  const updateWidget = useContext(UpdateWidgetCtx);
  const updateWidgets = useContext(UpdateWidgetsCtx);

  // Inline text editing — double-click any widget or tab button to edit its text in-place
  const [inlineEdit, setInlineEdit] = useState<{ id: string; text: string } | null>(null);
  const inlineInputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (inlineEdit) inlineInputRef.current?.select(); }, [inlineEdit?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const commitInlineEdit = React.useCallback((draft: string) => {
    setInlineEdit(null);
    if (!inlineEdit) return;
    if (inlineEdit.id === widget.id) {
      updateWidget({ ...widget, text: draft });
    } else {
      const tab = tabChildren.find(t => t.id === inlineEdit.id);
      if (tab) updateWidget({ ...tab, text: draft });
    }
  }, [inlineEdit, widget, tabChildren, updateWidget]); // eslint-disable-line react-hooks/exhaustive-deps
  type TabDrag = {
    type: "move" | "resize-right" | "resize-left";
    id: string;
    startMouseX: number;
    startX: number; startW: number;
    minX: number; maxX: number;
    minW: number; maxW: number;
  };
  const [tabDrag, setTabDrag] = useState<TabDrag | null>(null);
  const tabDragRef = useRef(tabDrag);
  tabDragRef.current = tabDrag;
  const tabChildrenRef = useRef(tabChildren);
  tabChildrenRef.current = tabChildren;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  // Modifier keys for resize: shift = lock aspect ratio, alt = center origin
  const [shiftPressed, setShiftPressed] = useState(false);
  const [altPressed, setAltPressed] = useState(false);
  React.useEffect(() => {
    if (!isSelected) return;
    const onKey = (e: KeyboardEvent) => { setShiftPressed(e.shiftKey); setAltPressed(e.altKey); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); };
  }, [isSelected]);
  // Capture start dimensions for alt center-origin and shift aspect-ratio calculations
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  // Stash last alt-adjusted commit values so onResizeStop reads them even after re-resizable resets the DOM
  const altResizeRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  // The wrapper's CSS translate at resize-start, in MC pixel space (inner canvas coords).
  const resizeInitTransformRef = useRef<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    if (!tabDrag) return;
    const onMove = (e: MouseEvent) => {
      const d = tabDragRef.current;
      if (!d) return;
      const delta = Math.round((e.clientX - d.startMouseX) / scaleRef.current);
      const tab = tabChildrenRef.current.find(t => t.id === d.id);
      if (!tab) return;
      if (d.type === "move") {
        updateWidget({ ...tab, x: Math.max(d.minX, Math.min(d.maxX, d.startX + delta)) });
      } else if (d.type === "resize-right") {
        updateWidget({ ...tab, w: Math.max(d.minW, Math.min(d.maxW, d.startW + delta)) });
      } else {
        const newW = Math.max(d.minW, Math.min(d.maxW, d.startW - delta));
        updateWidget({ ...tab, x: d.startX + d.startW - newW, w: newW });
      }
    };
    const onUp = () => setTabDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabDrag !== null]);

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
      scale={scale}
      position={{ x: liveX, y: liveY }}
      size={{
        width:  widget.type === "scrollbar" && (widget.props.axis ?? "y") === "y" ? SCROLLBAR_FIXED_PX : renderW,
        height: widget.type === "scrollbar" && (widget.props.axis ?? "y") === "x" ? SCROLLBAR_FIXED_PX : renderH,
      }}
      minWidth={widget.type === "scrollbar" && (widget.props.axis ?? "y") === "y" ? SCROLLBAR_FIXED_PX : undefined}
      maxWidth={widget.type === "scrollbar" && (widget.props.axis ?? "y") === "y" ? SCROLLBAR_FIXED_PX : undefined}
      minHeight={widget.type === "scrollbar" && widget.props.axis === "x" ? SCROLLBAR_FIXED_PX : undefined}
      maxHeight={widget.type === "scrollbar" && widget.props.axis === "x" ? SCROLLBAR_FIXED_PX : undefined}
      resizeGrid={[snapPx, snapPx]}
      lockAspectRatio={shiftPressed && isSelected && !isGroup && widget.type !== "scrollbar"}
      // All dragging is handled centrally by Canvas's own mousedown listener
      // (see handleCanvasMouseDown) — it can redirect movement to an
      // ancestor widget, which react-rnd's own per-node dragging cannot do.
      disableDragging
      data-widget-id={widget.id}
      onResizeStart={() => {
        resizeStartRef.current = { x: widget.x, y: widget.y, w: widget.w, h: widget.h };
        altResizeRef.current = null;
        resizeInitTransformRef.current = null; // captured on first onResize
      }}
      onResize={(e, _dir, ref, delta, _position) => {
        if (!resizeStartRef.current) return;
        // react-draggable applies its transform directly on `ref` via React.cloneElement —
        // there is no separate wrapper div. Capture the transform from ref itself.
        // With scale={scale} on Rnd, delta values are already in MC pixel units.
        if (!resizeInitTransformRef.current) {
          const m = /translate\(([^,]+)px,\s*([^)]+)px\)/.exec(ref.style.transform);
          resizeInitTransformRef.current = m
            ? { x: parseFloat(m[1]), y: parseFloat(m[2]) }
            : { x: 0, y: 0 };
        }
        const initT = resizeInitTransformRef.current;
        if ((e as MouseEvent).altKey) {
          // Alt: resize symmetrically from the original center.
          // delta.{width,height} is the one-sided MC pixel change from react-rnd (already divided by scale).
          // We double it so both sides expand equally; shift the element by one
          // delta in MC pixel space so the center stays fixed.
          const start = resizeStartRef.current;
          const altW = Math.max(1, start.w + 2 * delta.width);
          const altH = Math.max(1, start.h + 2 * delta.height);
          const altTX = initT.x - delta.width;
          const altTY = initT.y - delta.height;
          ref.style.width     = `${altW}px`;
          ref.style.height    = `${altH}px`;
          ref.style.transform = `translate(${altTX}px, ${altTY}px)`;
          altResizeRef.current = {
            x: Math.max(0, Math.round(widget.x - delta.width)),
            y: Math.max(0, Math.round(widget.y - delta.height)),
            w: Math.max(1, Math.round(altW)),
            h: Math.max(1, Math.round(altH)),
          };
        } else {
          // Alt released mid-drag: restore ref to the resize-start transform so the
          // widget snaps back to its natural position cleanly.
          ref.style.transform = `translate(${initT.x}px, ${initT.y}px)`;
          altResizeRef.current = null;
        }
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        let x: number;
        let y: number;
        let w: number;
        let h: number;
        if (altResizeRef.current) {
          // Use the alt-adjusted values from the last onResize call
          ({ x, y, w, h } = altResizeRef.current);
        } else {
          // position.x/y and ref.style.width/height are already in MC pixels
          // (Rnd has scale={scale}, so react-rnd divided mouse deltas by scale internally)
          x = Math.max(0, Math.round(position.x));
          y = Math.max(0, Math.round(position.y));
          w = Math.max(1, Math.round(parseInt(ref.style.width)));
          h = Math.max(1, Math.round(parseInt(ref.style.height)));
        }
        // Scrollbar: lock the cross-axis to the handle texture width (12px + 2px bevel = 14)
        if (widget.type === "scrollbar") {
          const axis = widget.props.axis ?? "y";
          if (axis === "y") w = SCROLLBAR_FIXED_PX;
          else              h = SCROLLBAR_FIXED_PX;
        }
        resizeStartRef.current = null;
        altResizeRef.current = null;
        if (x === widget.x && y === widget.y && w === widget.w && h === widget.h) return;
        onResizeCommit({ ...widget, x, y, w, h });
      }}
      onDoubleClick={(e: React.MouseEvent) => {
        if (isTabs) return; // tabs: double-click handled per tab button below
        const EDITABLE = new Set(["label", "button", "toggle_button", "checkbox", "slider", "input"]);
        if (!EDITABLE.has(widget.type)) return;
        e.stopPropagation();
        setInlineEdit({ id: widget.id, text: widget.text });
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
      resizeHandleStyles={isSelected ? RESIZE_HANDLE_STYLES : undefined}
      resizeHandleComponent={isSelected ? RESIZE_HANDLE_COMPONENT : undefined}
    >
      <WidgetVisual widget={previewWidget} scale={scale} interactState="idle" />
      {inlineEdit?.id === widget.id && (() => {
        // Mirror WidgetVisual's text alignment and padding so the edit position matches display.
        const align = widget.type === "label"
          ? (widget.props.align === "center" ? "center" : widget.props.align === "right" ? "right" : "left")
          : "center";
        return (
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
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.75)",
              color: "#fff",
              border: "2px solid #ff0",
              outline: "none",
              fontSize: 7,
              fontFamily: '"Minecraft", monospace',
              paddingLeft: "2px", paddingRight: "2px",
              textAlign: align,
              width: "100%", height: "100%",
              boxSizing: "border-box",
              zIndex: 100,
            }}
          />
        );
      })()}
      {isContainer && !isTabs && (
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
      {isTabs && (() => {
        const topSlice = 4;
        const sideSlice = 3;
        const leftSlice = 4;
        const GAP = 2;
        // Compute layout: equal distribution when tabs haven't been sized yet (both x and w are 0)
        const allDefault = tabChildren.length > 0 && tabChildren.every(t => t.w === 0);
        const defaultTabW = tabChildren.length > 0
          ? Math.max(16, Math.floor((widget.w - GAP * Math.max(0, tabChildren.length - 1)) / tabChildren.length))
          : 0;
        const getW = (t: WidgetSpec) => allDefault ? defaultTabW : Math.max(16, t.w || defaultTabW);
        const getX = (t: WidgetSpec, i: number) => allDefault
          ? tabChildren.slice(0, i).reduce((acc, prev) => acc + getW(prev) + GAP, 0)
          : t.x;
        // per-tab min width = content chars × ~4px + 8px padding per side (16px total)
        const getMinW = (t: WidgetSpec) => {
          const text = t.text || t.id || "";
          return Math.max(16, text.length * 4 + 16);
        };
        const computedTabs = tabChildren.map((t, i) => ({ t, w: getW(t), x: getX(t, i) }));
        const tabCount = computedTabs.length;

        // Commit all tab layout defaults as ONE history entry before a drag starts.
        const initIfDefault = () => {
          if (allDefault) updateWidgets(tabChildren.map((tc, i) => ({ ...tc, x: getX(tc, i), w: getW(tc) })));
        };

        return (
          <div style={{ position: "absolute", inset: 0 }}>
            {/* Tab selector row — absolutely positioned tabs, overflow visible */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: tabHeaderHeight, overflow: "visible" }}>
              {computedTabs.map(({ t: tab, x: tabX, w: tabW }, idx) => {
                const isActive = tab.id === activeTabId;
                const touchesLeft = tabX <= 0;
                const touchesRight = tabX + tabW >= widget.w;
                const pos = touchesLeft ? "left" : touchesRight ? "right" : "middle";
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
                      zIndex: isActive ? 2 : 0,
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
                <div style={{ position: "absolute", left: 0, top: 0, width: widget.w, height: widget.h - tabHeaderHeight, boxSizing: "border-box",
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
      })()}
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
  // slotSize is in MC pixels (inner canvas is 1:1)
  const slotSize = parseInt(widget.props.slot_size ?? "18", 10);
  const fullW    = cols * slotSize;
  const fullH    = rows * slotSize;
  const viewW    = widget.w;
  const viewH    = widget.h;

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

  const barW = 4;
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
      // e.clientY is CSS px; innerViewH - thumbH is MC px — divide client delta by scale
      const delta = (e.clientY - thumbDrag.startClient) / scale / (innerViewH - thumbH) * maxScrollTop;
      setScroll({ ...pos, y: Math.max(0, Math.min(maxScrollTop, thumbDrag.startScroll + delta)) });
    } else {
      const delta = (e.clientX - thumbDrag.startClient) / scale / (innerViewW - thumbW) * maxScrollLeft;
      setScroll({ ...pos, x: Math.max(0, Math.min(maxScrollLeft, thumbDrag.startScroll + delta)) });
    }
  };

  return (
    <div
      style={{ position: "absolute", left: widget.x, top: widget.y, width: viewW, height: viewH, zIndex: zBase }}
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
        <div style={{ position: "absolute", top: 0, right: 0, width: barW, height: innerViewH, background: "#1a1a1a", borderLeft: `1px solid #444` }}>
          <div style={{ position: "absolute", top: thumbTop, width: "100%", height: thumbH, background: "#555", cursor: "pointer" }}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setThumbDrag({ axis: "v", startClient: e.clientY, startScroll: pos.y }); }} />
        </div>
      )}
      {showBuiltinX && (
        <div style={{ position: "absolute", bottom: 0, left: 0, width: innerViewW, height: barW, background: "#1a1a1a", borderTop: `1px solid #444` }}>
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
  const borderPx   = 1;

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

  // All lengths are in MC pixel units (inner canvas is 1:1)
  const trackLen   = isVertical ? widget.h : widget.w;
  const thumbLen   = 15;
  const travelLen  = Math.max(1, trackLen - thumbLen - 2 * borderPx);
  const thumbOffset = pct * travelLen;

  const dragRef = React.useRef<{ startClient: number; startPct: number } | null>(null);

  const trackRef = React.useRef<HTMLDivElement>(null);

  const snapPct = (rawPct: number) => {
    // Snap to whole MC pixels
    const snapped = Math.round(rawPct * travelLen);
    return Math.max(0, Math.min(travelLen, snapped)) / travelLen;
  };

  const getPctFromEvent = (e: React.PointerEvent) => {
    const rect = trackRef.current!.getBoundingClientRect();
    // rect values are CSS px; divide by scale to convert to MC px
    const offset = isVertical
      ? (e.clientY - rect.top) / scale
      : (e.clientX - rect.left) / scale;
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
    // client coords are CSS px, travelLen is MC px — divide by scale
    const deltaPct = ((isVertical ? e.clientY : e.clientX) - dragRef.current.startClient) / scale / travelLen;
    const nextPct  = snapPct(dragRef.current.startPct + deltaPct);
    scrollCtx.setScroll(widget.id, isVertical ? { x: 0, y: nextPct } : { x: nextPct, y: 0 });
  };

  const fixedW = isVertical ? SCROLLBAR_FIXED_PX : widget.w;
  const fixedH = isVertical ? widget.h : SCROLLBAR_FIXED_PX;

  return (
    <div
      ref={trackRef}
      style={{
        position: "absolute",
        left: widget.x, top: widget.y,
        width: fixedW, height: fixedH,
        zIndex: zBase,
        cursor: "pointer",
      }}
      onPointerDown={onTrackPointerDown}
      onPointerMove={onTrackPointerMove}
      onPointerUp={() => { dragRef.current = null; if (trackRef.current) trackRef.current.style.cursor = "pointer"; }}
    >
      {tex("mc_slot_tile.png") && (
        <div style={{ position: "absolute", left: 0, top: 0, width: fixedW, height: fixedH, boxSizing: "border-box",
          borderImage: `url("${tex("mc_slot_tile.png")}") 1 fill / ${borderPx}px stretch` }} />
      )}
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          ...(isVertical
            ? { top: thumbOffset, left: 0 }
            : { left: thumbOffset, top: (12 - 15) / 2 }),
          width: 12, height: 15,
          backgroundImage: `url("${tex("mc_scrollbar_handle.png")}")`,
          backgroundSize: `12px 15px`,
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
  const { textures: tryTextures } = React.useContext(TextureCtx);
  const tex = (name: string) => (tryTextures as Record<string, string>)[name];

  const isContainer = CONTAINER_TYPES.has(widget.type);
  const children = isContainer ? (childMap.get(widget.id) ?? []) : [];
  const clips = widget.type === "scroll";
  const isTabs = widget.type === "tabs";
  const tabChildren = isTabs ? children.filter((c) => c.type === "tab") : [];
  const tabHeaderHeight = isTabs ? parseInt(widget.props.tab_height ?? "20", 10) : 0;
  const { activeTabIds, setActiveTab } = useContext(ActiveTabCtx);
  const storedTryTabId = isTabs ? (activeTabIds.get(widget.id) ?? null) : null;
  const resolvedTabId = storedTryTabId && tabChildren.some((t) => t.id === storedTryTabId)
    ? storedTryTabId
    : tabChildren[0]?.id ?? null;
  const activeTabChildren = resolvedTabId ? (childMap.get(resolvedTabId) ?? []) : [];

  const isToggle = widget.type === "toggle_button" || widget.type === "checkbox";
  const isSlider = widget.type === "slider";
  const isInput = widget.type === "input";
  const isPassive = widget.type === "panel" || widget.type === "scroll" || widget.type === "group"
    || widget.type === "label" || widget.type === "icon" || widget.type === "tabs";
  const interactState = pressed ? "pressed" : (isInput ? focused : hovered) ? "hovered" : "idle";

  const handleSliderPointer = (e: React.PointerEvent) => {
    if (!isSlider || !trackRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const update = (ev: React.PointerEvent) => {
      const rect = trackRef.current!.getBoundingClientRect();
      const min = parseFloat(widget.props.min ?? "0");
      const max = parseFloat(widget.props.max ?? "100");
      const step = parseFloat(widget.props.step ?? "1");
      // handleW is in MC pixels; rect values are CSS px — convert rect to MC px via /scale
      const handleW = 8;
      const trackWidthMC = rect.width / scale;
      const pct = Math.max(0, Math.min(1,
        ((ev.clientX - rect.left) / scale - handleW / 2) / (trackWidthMC - handleW)
      ));
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
        left: widget.x,
        top: widget.y,
        width: widget.w,
        height: widget.h,
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
      {isContainer && !isTabs && (
        <div style={{ position: "absolute", inset: 0, overflow: clips ? "hidden" : "visible" }}>
          {children.map((child, idx) => (
            <TryWidgetRoot key={child.id} widget={child} scale={scale} childMap={childMap} zBase={idx + 1} allWidgets={allWidgets} scrollListeners={new Map()} />
          ))}
        </div>
      )}
      {isTabs && (() => {
        const topSlice = 4;
        const sideSlice = 3;
        const leftSlice = 4;
        const GAP = 2;
        // Mirror edit-mode layout: equal distribution when tabs haven't been sized yet
        const allDefault = tabChildren.length > 0 && tabChildren.every(t => t.w === 0);
        const defaultTabW = tabChildren.length > 0
          ? Math.max(16, Math.floor((widget.w - GAP * Math.max(0, tabChildren.length - 1)) / tabChildren.length))
          : 0;
        const getW = (t: WidgetSpec) => allDefault ? defaultTabW : Math.max(16, t.w || defaultTabW);
        const getX = (t: WidgetSpec, i: number) => allDefault
          ? tabChildren.slice(0, i).reduce((acc, prev) => acc + getW(prev) + GAP, 0)
          : t.x;
        const tabCount = tabChildren.length;
        return (
          <div style={{ position: "absolute", inset: 0 }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: tabHeaderHeight, overflow: "visible" }}>
              {tabChildren.map((tab, idx) => {
                const isActive = tab.id === resolvedTabId;
                const tabX = getX(tab, idx);
                const tabW = getW(tab);
                const touchesLeft = tabX <= 0;
                const touchesRight = tabX + tabW >= widget.w;
                const pos = touchesLeft ? "left" : touchesRight ? "right" : "middle";
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
                      zIndex: isActive ? 2 : 0,
                      overflow: "visible",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {tabTex && (
                      <div style={{ position: "absolute", left: 0, top: 0, width: tabW, height: tabH, boxSizing: "border-box", overflow: "visible",
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
                <div style={{ position: "absolute", left: 0, top: 0, width: widget.w, height: widget.h - tabHeaderHeight, boxSizing: "border-box",
                  borderImage: `url("${tex("mc_panel_slice.png")}") 3 fill / 3px stretch` }} />
              )}
              {activeTabChildren.map((child, idx) => (
                <TryWidgetRoot key={child.id} widget={child} scale={scale} childMap={childMap} zBase={idx + 1} allWidgets={allWidgets} scrollListeners={new Map()} />
              ))}
            </div>
          </div>
        );
      })()}
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

function CanvasContextMenu({ x, y, scale, onAdd, onClose }: {
  x: number; y: number; scale: number;
  onAdd: (type: string) => void;
  onClose: () => void;
}) {
  // A zero-size trigger div is placed at the right-click position inside the canvas.
  // DropdownMenu opens immediately (open={true}) and anchors its popup to that trigger,
  // so the popup appears exactly where the user right-clicked using the same Radix/base-ui
  // menu component as the LayersTree add-widget button.
  return (
    <DropdownMenu open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DropdownMenuTrigger
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        style={{ position: "absolute", left: x, top: y, width: 0, height: 0, border: "none", background: "none", padding: 0 }}
      />
      <DropdownMenuContent side="bottom" align="start" className="min-w-40">
        <AddWidgetItems onAdd={(type) => { onAdd(type); onClose(); }} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildGridDataUrl(px: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"><path d="M ${px} 0 L 0 0 0 ${px}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="0.5"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
