"use client";

import { commonStyle, FONT_SIZE } from "../shared";
import type { VisualProps } from "../shared";

export default function IconVisual({ widget }: VisualProps) {
  return (
    <div style={commonStyle(widget.type)}>
      {widget.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img draggable={false} src={widget.icon} alt="" style={{ width: "100%", height: "100%", imageRendering: "pixelated" }} />
      ) : (
        <span style={{ fontSize: FONT_SIZE * 0.7 }}>icon</span>
      )}
    </div>
  );
}
