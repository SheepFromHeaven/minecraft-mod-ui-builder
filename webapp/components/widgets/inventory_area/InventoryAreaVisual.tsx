"use client";

import type { VisualProps } from "../shared";

export default function InventoryAreaVisual({ widget, tex }: VisualProps) {
  const cols = parseInt(widget.props.cols ?? "9", 10);
  const rows = parseInt(widget.props.rows ?? "3", 10);
  const slotSize = parseInt(widget.props.slot_size ?? "18", 10);
  const fullW = cols * slotSize;
  const fullH = rows * slotSize;
  const source = widget.props.source ?? "";
  const label = source === "player" ? "player inv" : source === "player_hotbar" ? "hotbar" : `${cols}×${rows}`;
  const clippedH = widget.h < fullH - 1;
  const clippedW = widget.w < fullW - 1;
  return (
    <div style={{
      width: "100%", height: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Full-size slot grid — clipped by the viewport when smaller than cols×rows */}
      <div style={{
        width: fullW,
        height: fullH,
        backgroundImage: `url("${tex("mc_slot_tile.png")}")`,
        backgroundSize: `${slotSize}px ${slotSize}px`,
        backgroundRepeat: "repeat",
        imageRendering: "pixelated",
        flexShrink: 0,
      }} />
      {/* Scroll hint when the viewport clips the grid */}
      {(clippedW || clippedH) && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom right, transparent 60%, rgba(0,0,0,0.7) 100%)",
          pointerEvents: "none",
        }} />
      )}
      <span style={{
        position: "absolute", bottom: 2, right: 3,
        fontSize: 6,
        fontFamily: '"Minecraft", monospace',
        color: "#ffffff",
        userSelect: "none",
        pointerEvents: "none",
        textShadow: `0 0 2px #000, 0 0 1px #000`,
      }}>
        {label}{(clippedW || clippedH) ? " ↕" : ""}
      </span>
    </div>
  );
}
