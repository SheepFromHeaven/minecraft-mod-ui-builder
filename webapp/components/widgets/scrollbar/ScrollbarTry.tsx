"use client";

import { useState, useRef, useContext } from "react";
import React from "react";
import type { WidgetSpec } from "@/lib/types";
import { TextureCtx, ScrollCtx } from "../tryContext";
import { ScrollbarVisual, SCROLLBAR_THUMB_LEN, SCROLLBAR_BORDER_PX } from "./ScrollbarVisual";

// Handle texture is 12px wide + 1px bevel each side
export const SCROLLBAR_FIXED_PX = 14;

/** Try-mode's interactive scrollbar — draggable, controls a target inventory_area's scroll position. */
export function ScrollbarTry({ widget, scale, zBase }: {
  widget: WidgetSpec;
  scale: number;
  zBase: number;
}) {
  const { textures } = useContext(TextureCtx);
  const tex = (name: string) => (textures as Record<string, string>)[name];
  const scrollCtx = useContext(ScrollCtx);

  const axis       = widget.props.axis === "x" ? "x" : "y";
  const isVertical = axis === "y";
  const borderPx   = SCROLLBAR_BORDER_PX;

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
  const thumbLen   = SCROLLBAR_THUMB_LEN;
  const travelLen  = Math.max(1, trackLen - thumbLen - 2 * borderPx);

  const dragRef = useRef<{ startClient: number; startPct: number } | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);

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
        boxSizing: "border-box",
        cursor: "pointer",
      }}
      onPointerDown={onTrackPointerDown}
      onPointerMove={onTrackPointerMove}
      onPointerUp={() => { dragRef.current = null; if (trackRef.current) trackRef.current.style.cursor = "pointer"; }}
    >
      <ScrollbarVisual axis={axis} width={fixedW} height={fixedH} tex={tex} pct={pct} />
    </div>
  );
}
