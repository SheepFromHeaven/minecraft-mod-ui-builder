"use client";

import type { VisualProps } from "../shared";

function rgbHex(colorInt: number): string {
  return "#" + (colorInt & 0xffffff).toString(16).padStart(6, "0");
}

// Preview always shows the "met" state — bindings.satisfied is only resolved at runtime.
export default function RequirementVisual({ widget, packTextures }: VisualProps) {
  const borderColor = rgbHex(parseInt(widget.props.color_met ?? "65280", 10) || 0x00ff00);
  const borderWidth = parseInt(widget.props.border_width ?? "2", 10) || 2;
  const url = widget.icon ? packTextures[widget.icon] : undefined;

  return (
    <div style={{
      width: "100%", height: "100%", boxSizing: "border-box",
      background: "#8b8b8b", border: `${borderWidth}px solid ${borderColor}`,
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          draggable={false}
          src={url}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "pixelated", display: "block" }}
        />
      ) : (
        <span style={{ fontSize: 6, color: "#666", fontFamily: '"Minecraft", monospace' }}>?</span>
      )}
    </div>
  );
}
