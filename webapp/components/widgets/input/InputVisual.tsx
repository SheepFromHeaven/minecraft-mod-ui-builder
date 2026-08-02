"use client";

import { commonStyle } from "../shared";
import type { VisualProps } from "../shared";

export default function InputVisual({ widget, interactState = "idle" }: VisualProps) {
  const hint = widget.props.hint_text || "";
  const hasText = !!widget.text;
  const focused = interactState === "hovered" || interactState === "pressed";
  const borderColor = focused ? "#fff" : "#a0a0a0";
  return (
    <div style={{
      ...commonStyle(widget.type),
      background: "#000",
      border: `1px solid ${borderColor}`,
      justifyContent: "flex-start",
      padding: `0 2px`,
      color: hasText ? "#fff" : "#707070",
      gap: 0,
    }}>
      {hasText
        ? <><span>{widget.text}</span><span style={{ animation: "mc-blink 1s step-end infinite" }}>_</span></>
        : focused
          ? <span style={{ animation: "mc-blink 1s step-end infinite" }}>_</span>
          : <span>{hint}</span>
      }
    </div>
  );
}
