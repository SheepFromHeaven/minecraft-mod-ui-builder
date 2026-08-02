"use client";

import type { VisualProps } from "../shared";

export default function CheckboxVisual({ widget, interactState = "idle", toggled = false, tex }: VisualProps) {
  const checked = widget.props.checked === "true" || toggled;
  const highlighted = interactState === "hovered" || interactState === "pressed";
  const boxTex =
    checked && highlighted ? tex("mc_checkbox_selected_highlighted.png") :
    checked               ? tex("mc_checkbox_selected.png") :
    highlighted           ? tex("mc_checkbox_highlighted.png") :
                            tex("mc_checkbox.png");
  const boxSize = 20;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 2, userSelect: "none" }}>
      <div style={{
        width: boxSize, height: boxSize, flexShrink: 0,
        backgroundImage: `url("${boxTex}")`,
        backgroundSize: `${boxSize}px ${boxSize}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }} />
    </div>
  );
}
