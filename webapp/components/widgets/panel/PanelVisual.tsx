"use client";

import { NineSlice } from "@/components/NineSlice";
import type { VisualProps } from "../shared";

export default function PanelVisual({ widget, tex }: VisualProps) {
  const style = widget.props.style ?? "default";
  const fillColor =
    style === "dark"        ? "rgba(0,0,0,0.5)" :
    style === "transparent" ? "rgba(198,198,198,0.15)" :
                              "#c6c6c6";
  // Border is 3 MC pixels: 1px black outer + 2px bevel (white top-left, #555 bottom-right).
  // mc_panel_slice.png is a 7×7 nine-slice sprite (3px border | 1px center | 3px border) with
  // transparent cut corners (authentic MC look) — fillColor must only cover the interior
  // (inset by borderPx), not the full rect, or it bleeds into those corners.
  // Uses NineSlice (background-image) rather than CSS border-image: border-image ignores
  // `image-rendering: pixelated` and smoothly interpolates the corner's transparent-to-opaque
  // diagonal, leaking gray into what should be fully transparent corner pixels.
  const borderPx = 3;
  const W = widget.w;
  const H = widget.h;
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", inset: borderPx, background: fillColor }} />
      {tex("mc_panel_slice.png") && (
        <NineSlice
          src={tex("mc_panel_slice.png")!}
          srcW={7} srcH={7}
          sTop={borderPx} sLeft={borderPx}
          dTop={borderPx} dLeft={borderPx}
          width={W} height={H}
        />
      )}
    </div>
  );
}
