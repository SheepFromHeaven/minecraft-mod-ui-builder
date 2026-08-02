"use client";

import { commonStyle } from "./shared";
import type { VisualProps } from "./shared";

/** Rendered for any widget.type not handled by a dedicated <Type>Visual component. */
export default function FallbackVisual({ widget }: VisualProps) {
  return (
    <div style={{
      ...commonStyle(widget.type),
      boxShadow: `inset -1px -1px 0 #555, inset 1px 1px 0 #fff`,
    }}>
      {widget.text}
    </div>
  );
}
