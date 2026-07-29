"use client";

import { useState } from "react";
import React from "react";
import { Rnd } from "react-rnd";
import type { WidgetSpec } from "@/lib/types";
import WidgetVisual from "./WidgetVisual";
import WIDGET_REGISTRY from "@/lib/widgetRegistry";

const WORLD_IMAGE_URL =
  "https://res.cloudinary.com/ddbybfkod/image/upload/v1710808247/blogs/Roman/tips-for-starting-a-new-world-in-minecraft/img1_usdnlh.jpg";

const CONTAINER_TYPES = new Set(
  WIDGET_REGISTRY.filter(d => d.isContainer).map(d => d.type),
);

interface Props {
  width: number;
  height: number;
  scale: number;
  widgets: WidgetSpec[];
  selectedId: string | null;
  gridSize: number;
  showGrid: boolean;
  tryMode: boolean;
  onSelect: (id: string | null) => void;
  onUpdateWidget: (widget: WidgetSpec) => void;
}

export default function Canvas({
  width, height, scale, widgets, selectedId, gridSize, showGrid, tryMode, onSelect, onUpdateWidget,
}: Props) {
  const cssWidth = width * scale;
  const cssHeight = height * scale;
  const snapPx = gridSize * scale;
  const gridDataUrl = showGrid && !tryMode ? buildGridDataUrl(snapPx) : undefined;

  const childMap = buildChildMap(widgets);
  const rootWidgets = widgets.filter(w => !w.parentId);

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
        backgroundImage: `url("${WORLD_IMAGE_URL}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        flexShrink: 0,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        cursor: tryMode ? "default" : undefined,
      }}
      onMouseDown={handleCanvasMouseDown}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.48)", pointerEvents: "none", zIndex: 0 }} />

      {gridDataUrl && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("${gridDataUrl}")`,
          backgroundSize: `${snapPx}px ${snapPx}px`,
          pointerEvents: "none", zIndex: 1, opacity: 0.4,
        }} />
      )}

      {rootWidgets.map((widget, idx) =>
        tryMode
          ? <TryWidget key={widget.id} widget={widget} scale={scale} childMap={childMap} zBase={idx + 2} />
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
      size={{ width: renderW * scale, height: renderH * scale }}
      resizeGrid={[snapPx, snapPx]}
      // All dragging is handled centrally by Canvas's own mousedown listener
      // (see handleCanvasMouseDown) — it can redirect movement to an
      // ancestor widget, which react-rnd's own per-node dragging cannot do.
      disableDragging
      data-widget-id={widget.id}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        const x = Math.max(0, Math.round(position.x / scale));
        const y = Math.max(0, Math.round(position.y / scale));
        const w = Math.max(1, Math.round(parseInt(ref.style.width) / scale));
        const h = Math.max(1, Math.round(parseInt(ref.style.height) / scale));
        if (x === widget.x && y === widget.y && w === widget.w && h === widget.h) return;
        onResizeCommit({ ...widget, x, y, w, h });
      }}
      style={{
        outline: isSelected ? `2px solid #ff0` : "none",
        outlineOffset: 1,
        zIndex: zBase,
        cursor: "move",
      }}
      enableResizing={isSelected && !isGroup}
    >
      <WidgetVisual widget={widget} scale={scale} interactState="idle" />
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

// ── Try mode widget ───────────────────────────────────────────────────────────

function TryWidget({ widget, scale, childMap, zBase }: {
  widget: WidgetSpec;
  scale: number;
  childMap: Map<string, WidgetSpec[]>;
  zBase: number;
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
            <TryWidget key={child.id} widget={child} scale={scale} childMap={childMap} zBase={idx + 1} />
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
