"use client";

import { FONT_SIZE } from "../shared";
import type { VisualProps } from "../shared";

export default function SliderVisual({ widget, tex }: VisualProps) {
  const min = parseFloat(widget.props.min ?? "0");
  const max = parseFloat(widget.props.max ?? "100");
  const val = parseFloat(widget.props.value ?? "50");
  const pct = max > min ? (val - min) / (max - min) : 0.5;

  // Handle is 8 MC pixels wide (same as vanilla). Track fills the full widget.
  const handleWidthPx = 8;
  const handleLeft = `calc(${pct} * (100% - ${handleWidthPx}px))`;
  const borderPx = 2;
  const H = widget.h;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Track */}
      {tex("mc_slider_track_slice.png") && (
        <div style={{ position: "absolute", inset: 0, boxSizing: "border-box",
          borderImage: `url("${tex("mc_slider_track_slice.png")}") 2 fill / ${borderPx}px stretch` }} />
      )}

      {/* Handle */}
      <div style={{ position: "absolute", top: 0, left: handleLeft, width: handleWidthPx, height: H, zIndex: 1 }}>
        {tex("mc_slider_handle_slice.png") && (
          <div style={{ position: "absolute", inset: 0, boxSizing: "border-box",
            borderImage: `url("${tex("mc_slider_handle_slice.png")}") 2 fill / ${borderPx}px stretch` }} />
        )}
      </div>

      {/* Label centred over the track */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: FONT_SIZE, fontFamily: '"Minecraft", monospace',
        color: "#fff",
        textShadow: `1px 1px 0 #333`,
        userSelect: "none",
        pointerEvents: "none",
      }}>
        {widget.text.replace("%s", String(val))}
      </div>
    </div>
  );
}
