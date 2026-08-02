"use client";

import { NineSlice } from "@/components/NineSlice";
import type { VisualProps } from "../shared";

// Shared by the static preview below and ScrollbarTry.tsx's interactive
// version — one source of truth for the track bevel + knob geometry (a
// bevel-offset or slice fix made in only one place was exactly the class of
// bug that kept resurfacing before this was unified).
export const SCROLLBAR_THUMB_LEN = 15;
export const SCROLLBAR_BORDER_PX = 1;

export function ScrollbarVisual({ axis, width, height, tex, pct }: {
  axis: "x" | "y";
  width: number;
  height: number;
  tex: (name: string) => string | undefined;
  /** Scroll position, 0-1, along the track's axis. */
  pct: number;
}) {
  const isVertical = axis === "y";
  const handleW = 12;
  const handleH = 15;
  const W = width;
  const H = height;
  const trackLen = isVertical ? H : W;
  const travelLen = Math.max(1, trackLen - SCROLLBAR_THUMB_LEN - 2 * SCROLLBAR_BORDER_PX);
  const thumbOffset = pct * travelLen;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {tex("mc_slot_tile.png") && (
        <NineSlice
          src={tex("mc_slot_tile.png")!}
          srcW={18} srcH={18}
          sTop={SCROLLBAR_BORDER_PX} sLeft={SCROLLBAR_BORDER_PX}
          dTop={SCROLLBAR_BORDER_PX} dLeft={SCROLLBAR_BORDER_PX}
          width={W} height={H}
        />
      )}
      <div style={{
        position: "absolute",
        // The knob is a 12×15 portrait sprite, rotated 90° for the horizontal
        // orientation. `left`/`top` position its PRE-rotation box, whose center
        // stays fixed under the rotation — so the travel axis (left, for
        // horizontal) needs the same (handleH-handleW)/2 correction already
        // applied to the perpendicular axis, or the rotated visual footprint
        // ends up offset from where the un-rotated math assumes it is.
        top: isVertical ? thumbOffset + SCROLLBAR_BORDER_PX : (handleW - handleH) / 2 + SCROLLBAR_BORDER_PX,
        // -1 here: mirroring with scaleX(-1) below flips which side of the pre-rotation
        // box maps to the visible left edge, and that flip also inverts the sign of
        // this term's contribution to final screen position — verified by rendering
        // and measuring against the track bevel, not derived analytically.
        left: isVertical ? SCROLLBAR_BORDER_PX : thumbOffset + SCROLLBAR_BORDER_PX + (handleH - handleW) / 2 - 1,
        width: handleW, height: handleH,
        backgroundImage: `url("${tex("mc_scrollbar_handle.png")}")`,
        backgroundSize: `${handleW}px ${handleH}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        pointerEvents: "none",
        // The 12×15 sprite has an odd height, so rotating it 90° pivots around a
        // fractional center (7.5px) — Chrome's rasterizer then renders the
        // actual pixelated content half a pre-scale pixel off from where the
        // box's own geometry (confirmed via getBoundingClientRect) says it is.
        // Adjusting `left`/`top` didn't fix this (fractional layout position hits
        // the same rotation-pivot snapping); composing a small translate() INSIDE
        // the same transform — applied before the rotation, so the rotation
        // remaps it — does. Values solved empirically by rendering and measuring
        // against the track bevel pixel-by-pixel, not derived analytically.
        // scaleX(-1) (outermost, applied last) mirrors left/right without touching
        // top/bottom: a plain rotate(90deg) puts the raised bevel's light edge on
        // top+right and dark edge on bottom+left, when it should match the
        // vertical knob's own top+left-light convention.
        transform: isVertical ? undefined : "scaleX(-1) rotate(90deg) translate(-0.5px, 0.5px)",
        transformOrigin: "center",
        zIndex: 1,
      }} />
    </div>
  );
}

export default function ScrollbarWidgetVisual({ widget, tex }: VisualProps) {
  // pct=0 here — a static idle preview. Try-mode's interactive scrollbar
  // (ScrollbarTry.tsx) renders this same visual at a live pct, wrapped with
  // its own drag handlers, so the two never drift apart.
  const axis = widget.props.axis === "x" ? "x" : "y";
  return (
    <ScrollbarVisual
      axis={axis}
      width={widget.w}
      height={widget.h}
      tex={tex}
      pct={0}
    />
  );
}
