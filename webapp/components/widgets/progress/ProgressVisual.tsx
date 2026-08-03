"use client";

import { FONT_SIZE } from "../shared";
import type { VisualProps } from "../shared";

// Same solid-fill look as mine-now's InhabitantScreen need bars: dark track, 1px border,
// threshold-colored fill (green/amber/red at the 0.66/0.33 fraction breakpoints).
const TRACK_COLOR = "#2b2b2b";
const BORDER_COLOR = "#1a1a1a";
const THRESHOLD_HIGH = "#3cb043";
const THRESHOLD_MID = "#d9a400";
const THRESHOLD_LOW = "#cc3333";

function rgbHex(colorInt: number): string {
  return "#" + (colorInt & 0xffffff).toString(16).padStart(6, "0");
}

export default function ProgressVisual({ widget }: VisualProps) {
  const min = parseFloat(widget.props.min ?? "0");
  const max = parseFloat(widget.props.max ?? "100");
  const value = parseFloat(widget.props.value ?? "50");
  const frac = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;

  const style = widget.props.style ?? "threshold";
  const fillColor = style === "solid"
    ? rgbHex(parseInt(widget.props.color ?? "3958339", 10) || 0x3cb043)
    : frac >= 0.66 ? THRESHOLD_HIGH : frac >= 0.33 ? THRESHOLD_MID : THRESHOLD_LOW;

  const showLabel = (widget.props.show_label ?? "true") === "true";
  const pct = Math.round(frac * 100);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%", boxSizing: "border-box",
      background: TRACK_COLOR, border: `1px solid ${BORDER_COLOR}`, overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${frac * 100}%`, background: fillColor }} />
      {showLabel && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: FONT_SIZE, fontFamily: '"Minecraft", monospace',
          color: "#fff", textShadow: "1px 1px 0 #333", userSelect: "none",
        }}>
          {widget.text ? widget.text.replace("%s", String(pct)) : `${pct}%`}
        </div>
      )}
    </div>
  );
}
