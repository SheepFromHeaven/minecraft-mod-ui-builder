"use client";

import { commonStyle } from "../shared";
import type { VisualProps } from "../shared";

export default function ListVisual({ widget }: VisualProps) {
  const itemHeight = parseInt(widget.props.item_height ?? "20", 10);
  const visibleRows = Math.max(1, Math.floor(widget.h / itemHeight));
  const template = widget.item_template ?? [];
  return (
    <div style={{ ...commonStyle(widget.type), flexDirection: "column", justifyContent: "flex-start", alignItems: "stretch", padding: 0, overflow: "hidden" }}>
      {Array.from({ length: visibleRows }).map((_, i) => (
        <div key={i} style={{
          height: itemHeight,
          minHeight: itemHeight,
          borderBottom: `1px solid #333`,
          display: "flex",
          alignItems: "center",
          position: "relative",
          background: i === 0 ? "rgba(255,255,255,0.15)" : "transparent",
          flexShrink: 0,
        }}>
          {template.map((t) => (
            <div key={t.id} style={{
              position: "absolute",
              left: t.x,
              top: t.y,
              width: t.w,
              height: t.h,
              display: "flex",
              alignItems: "center",
              fontSize: 7,
              fontFamily: '"Minecraft", monospace',
              color: "#aaa",
              overflow: "hidden",
            }}>
              {t.type === "icon" ? (
                <div style={{ width: "100%", height: "100%", background: "#222", border: "1px solid #555" }} />
              ) : (
                <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{t.text || t.id}</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
