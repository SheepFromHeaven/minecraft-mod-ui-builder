"use client";

import { commonStyle } from "../shared";
import type { VisualProps } from "../shared";

export default function LabelVisual({ widget }: VisualProps) {
  const align = (widget.props.align ?? "left") as React.CSSProperties["justifyContent"];
  return (
    <div style={{ ...commonStyle(widget.type), justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start" }}>
      {widget.text}
    </div>
  );
}
