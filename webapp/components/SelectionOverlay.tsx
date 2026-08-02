"use client";

import React from "react";
import { SELECTION_COLOR, SELECTION_OUTLINE } from "@/lib/selectionStyle";

type Side = "top" | "bottom" | "left" | "right" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

const KNOB_POSITIONS: Record<Side, React.CSSProperties> = {
  top:         { top: 0,    left: "50%", transform: "translate(-50%, -50%)" },
  bottom:      { bottom: 0, left: "50%", transform: "translate(-50%, 50%)" },
  left:        { left: 0,   top: "50%",  transform: "translate(-50%, -50%)" },
  right:       { right: 0,  top: "50%",  transform: "translate(50%, -50%)" },
  topLeft:     { top: 0,    left: 0,     transform: "translate(-50%, -50%)" },
  topRight:    { top: 0,    right: 0,    transform: "translate(50%, -50%)" },
  bottomLeft:  { bottom: 0, left: 0,     transform: "translate(-50%, 50%)" },
  bottomRight: { bottom: 0, right: 0,    transform: "translate(50%, 50%)" },
};

interface Props {
  /** Which resize knobs to show. Defaults to all eight. */
  knobs?: Side[];
  /** Canvas scale factor — knobs are scaled inversely to stay a fixed CSS pixel size. */
  scale?: number;
}

/**
 * Absolutely-positioned selection overlay: yellow outline rectangle + resize knobs.
 * Drop inside any `position: relative/absolute` container that is already sized.
 */
export function SelectionOverlay({ knobs = Object.keys(KNOB_POSITIONS) as Side[], scale = 1 }: Props) {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, outline: SELECTION_OUTLINE, pointerEvents: "none", zIndex: 12 }} />
      {knobs.map((side) => (
        <div key={side} style={{
          position: "absolute",
          ...KNOB_POSITIONS[side],
          width: 8, height: 8,
          transform: `${KNOB_POSITIONS[side].transform} scale(${1 / scale})`,
          background: "#fff",
          border: `1.5px solid ${SELECTION_COLOR}`,
          borderRadius: 1.5,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.25)",
          pointerEvents: "none",
          zIndex: 13,
        }} />
      ))}
    </>
  );
}
