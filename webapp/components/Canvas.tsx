"use client";

import { useState } from "react";
import React from "react";
import { Rnd } from "react-rnd";
import type { WidgetSpec } from "@/lib/types";
import WidgetVisual from "./WidgetVisual";

const WORLD_IMAGE_URL =
  "https://res.cloudinary.com/ddbybfkod/image/upload/v1710808247/blogs/Roman/tips-for-starting-a-new-world-in-minecraft/img1_usdnlh.jpg";

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
      onClick={(e) => {
        if (!tryMode && e.target === e.currentTarget) onSelect(null);
      }}
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

      {widgets.map((widget) =>
        tryMode
          ? <TryWidget key={widget.id} widget={widget} scale={scale} />
          : <EditWidget key={widget.id} widget={widget} scale={scale} selectedId={selectedId} snapPx={snapPx} onSelect={onSelect} onUpdateWidget={onUpdateWidget} />
      )}
    </div>
  );
}

// ── Edit mode widget ──────────────────────────────────────────────────────────

function EditWidget({ widget, scale, selectedId, snapPx, onSelect, onUpdateWidget }: {
  widget: WidgetSpec;
  scale: number;
  selectedId: string | null;
  snapPx: number;
  onSelect: (id: string | null) => void;
  onUpdateWidget: (widget: WidgetSpec) => void;
}) {
  const isSelected = widget.id === selectedId;
  return (
    <Rnd
      position={{ x: widget.x * scale, y: widget.y * scale }}
      size={{ width: widget.w * scale, height: widget.h * scale }}
      dragGrid={[snapPx, snapPx]}
      resizeGrid={[snapPx, snapPx]}
      bounds="parent"
      onMouseDown={(e: MouseEvent) => { e.stopPropagation(); onSelect(widget.id); }}
      onDragStop={(_e, d) => {
        onUpdateWidget({ ...widget, x: Math.max(0, Math.round(d.x / scale)), y: Math.max(0, Math.round(d.y / scale)) });
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        onUpdateWidget({
          ...widget,
          x: Math.max(0, Math.round(position.x / scale)),
          y: Math.max(0, Math.round(position.y / scale)),
          w: Math.max(1, Math.round(parseInt(ref.style.width) / scale)),
          h: Math.max(1, Math.round(parseInt(ref.style.height) / scale)),
        });
      }}
      style={{
        outline: isSelected ? `2px solid #ff0` : "none",
        outlineOffset: 1,
        zIndex: widget.type === "panel" ? 2 : 3,
        cursor: "move",
      }}
      enableResizing={isSelected}
    >
      <WidgetVisual widget={widget} scale={scale} interactState="idle" />
    </Rnd>
  );
}

// ── Try mode widget ───────────────────────────────────────────────────────────

function TryWidget({ widget, scale }: { widget: WidgetSpec; scale: number }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [sliderVal, setSliderVal] = useState(() => parseFloat(widget.props.value ?? "50"));
  const [inputVal, setInputVal] = useState(widget.props.default_text ?? "");
  const [focused, setFocused] = useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isToggle = widget.type === "toggle_button";
  const isSlider = widget.type === "slider";
  const isInput = widget.type === "input";
  const isPassive = widget.type === "panel" || widget.type === "label" || widget.type === "icon";
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
        zIndex: widget.type === "panel" ? 2 : 3,
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
