"use client";

import { commonStyle } from "../shared";
import type { VisualProps } from "../shared";

export default function ScrollVisual({ widget }: VisualProps) {
  const scrollbarW = 3;
  return (
    <div style={{ ...commonStyle(widget.type), padding: 0, position: "relative" }}>
      {/* Scrollbar track */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: scrollbarW,
        background: "#1a1a1a", borderLeft: `1px solid #444`,
      }}>
        <div style={{
          position: "absolute", top: "15%", width: "100%", height: "25%",
          background: "#555", borderRadius: 1,
        }} />
      </div>
    </div>
  );
}
