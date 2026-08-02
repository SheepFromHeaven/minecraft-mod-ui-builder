"use client";

import type { VisualProps } from "../shared";

export default function SpriteVisual({ widget, packTextures }: VisualProps) {
  const src = widget.props.src ?? "";
  const fit = widget.props.fit ?? "fill";
  const url = packTextures[src];
  if (!url) {
    return (
      <div style={{
        width: "100%", height: "100%", boxSizing: "border-box",
        border: `1px dashed rgba(180,120,60,0.6)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 6, color: "rgba(180,120,60,0.8)",
        fontFamily: '"Minecraft", monospace',
      }}>
        {src ? "texture not found" : "sprite"}
      </div>
    );
  }
  if (fit === "tile") {
    return (
      <div style={{
        width: "100%", height: "100%",
        backgroundImage: `url("${url}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
        imageRendering: "pixelated",
      }} />
    );
  }
  const objectFit: React.CSSProperties["objectFit"] =
    fit === "contain" ? "contain" :
    fit === "cover"   ? "cover"   :
    fit === "none"    ? "none"    : "fill";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img draggable={false} src={url} alt="" style={{
      width: "100%", height: "100%",
      objectFit,
      imageRendering: "pixelated",
      display: "block",
    }} />
  );
}
