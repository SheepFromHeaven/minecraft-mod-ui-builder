"use client";

import type { VisualProps } from "../shared";

// Designer has no idea what a mod-supplied custom widget looks like — this is a
// labeled placeholder showing the reserved space and identifier; the NeoForge
// runtime looks up `customType` in CustomWidgetRegistry to render it for real.
export default function CustomVisual({ widget }: VisualProps) {
  const customType = widget.props.customType || "";
  return (
    <div style={{
      width: "100%", height: "100%", boxSizing: "border-box",
      background: "#2b2b2b", border: "1px dashed #8b8b8b",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", textAlign: "center", padding: 2,
    }}>
      <span style={{ fontSize: 6, color: "#fff", fontFamily: '"Minecraft", monospace', wordBreak: "break-all", lineHeight: 1.4 }}>
        {customType || "custom"}
        <br />
        {widget.w}×{widget.h}
      </span>
    </div>
  );
}
