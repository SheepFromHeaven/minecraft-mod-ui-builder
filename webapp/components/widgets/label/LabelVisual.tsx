"use client";

import { commonStyle } from "../shared";
import type { VisualProps } from "../shared";

export default function LabelVisual({ widget }: VisualProps) {
  const align  = widget.props.align  ?? "left";
  const valign = widget.props.valign ?? "middle";
  return (
    <div style={{
      ...commonStyle(widget.type),
      justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
      alignItems: valign === "top" ? "flex-start" : valign === "bottom" ? "flex-end" : "center",
    }}>
      {widget.text}
    </div>
  );
}
