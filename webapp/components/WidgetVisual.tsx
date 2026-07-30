"use client";

import type { WidgetSpec } from "@/lib/types";
import { useTextures } from "@/lib/TextureContext";

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  inventory_area:  { bg: "#8b8b8b", border: "#555555", text: "#ffffff" },
  scrollbar:       { bg: "#000000", border: "#000000", text: "#8b8b8b" },
  list:          { bg: "#000",    border: "#888", text: "#fff" },
  scroll:        { bg: "#0a0a0a", border: "#666", text: "transparent" },
  panel:         { bg: "#c6c6c6", border: "#555", text: "transparent" },
  button:        { bg: "#c6c6c6", border: "#555", text: "#000" },
  toggle_button: { bg: "#a0c4a0", border: "#2a5", text: "#000" },
  input:         { bg: "#000",    border: "#888", text: "#fff" },
  slider:        { bg: "#c6c6c6", border: "#555", text: "#000" },
  label:         { bg: "transparent", border: "transparent", text: "#333" },
  icon:          { bg: "#e8e8e8", border: "#aaa", text: "#999" },
};

const fallbackStyle = { bg: "#ddd", border: "#888", text: "#000" };

type InteractState = "idle" | "hovered" | "pressed";

interface Props {
  widget: WidgetSpec;
  scale: number;
  interactState?: InteractState;
  toggled?: boolean;
}

export default function WidgetVisual({ widget, scale, interactState = "idle", toggled = false }: Props) {
  const { textures } = useTextures();
  const s = TYPE_STYLES[widget.type] ?? fallbackStyle;

  // Use uploaded texture from IndexedDB if present, otherwise fall back to bundled placeholder.
  const tex = (name: string) => textures[name as keyof typeof textures] ?? `/textures/${name}`;
  const fontSize = Math.max(8, 7 * scale);

  const commonStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    background: s.bg,
    border: s.border !== "transparent" ? `${Math.max(1, scale)}px solid ${s.border}` : "none",
    color: s.text,
    fontSize,
    fontFamily: '"Minecraft", monospace',
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    userSelect: "none",
    padding: `0 ${2 * scale}px`,
  };

  if (widget.type === "scrollbar") {
    const axis = widget.props.axis ?? "y";
    const isVertical = axis === "y";
    // Handle is fixed 12×15 — no scaling, just position it within the track
    const handleW = 12 * scale;
    const handleH = 15 * scale;
    return (
      <div style={{
        width: "100%", height: "100%", boxSizing: "border-box", position: "relative",
        borderWidth: scale, borderStyle: "solid", borderColor: "transparent",
        borderImage: `url("${tex("mc_slot_tile.png")}") 1 fill / ${scale}px stretch`,
        imageRendering: "pixelated",
      }}>
        <div style={{
          position: "absolute",
          ...(isVertical ? { top: 0, left: 0 } : { left: 0, top: 0 }),
          width: handleW, height: handleH,
          backgroundImage: `url("${tex("mc_scrollbar_handle.png")}")`,
          backgroundSize: `${handleW}px ${handleH}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }} />
      </div>
    );
  }

  if (widget.type === "inventory_area") {
    const cols = parseInt(widget.props.cols ?? "9", 10);
    const rows = parseInt(widget.props.rows ?? "3", 10);
    const slotSize = parseInt(widget.props.slot_size ?? "18", 10) * scale;
    const fullW = cols * slotSize;
    const fullH = rows * slotSize;
    const source = widget.props.source ?? "";
    const label = source === "player" ? "player inv" : source === "player_hotbar" ? "hotbar" : `${cols}×${rows}`;
    const clippedH = widget.h * scale < fullH - 1;
    const clippedW = widget.w * scale < fullW - 1;
    return (
      <div style={{
        width: "100%", height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Full-size slot grid — clipped by the viewport when smaller than cols×rows */}
        <div style={{
          width: fullW,
          height: fullH,
          backgroundImage: `url("${tex("mc_slot_tile.png")}")`,
          backgroundSize: `${slotSize}px ${slotSize}px`,
          backgroundRepeat: "repeat",
          imageRendering: "pixelated",
          flexShrink: 0,
        }} />
        {/* Scroll hint when the viewport clips the grid */}
        {(clippedW || clippedH) && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom right, transparent 60%, rgba(0,0,0,0.7) 100%)",
            pointerEvents: "none",
          }} />
        )}
        <span style={{
          position: "absolute", bottom: 2 * scale, right: 3 * scale,
          fontSize: Math.max(6, 6 * scale),
          fontFamily: '"Minecraft", monospace',
          color: "#ffffff",
          userSelect: "none",
          pointerEvents: "none",
          textShadow: `0 0 ${scale * 2}px #000, 0 0 ${scale}px #000`,
        }}>
          {label}{(clippedW || clippedH) ? " ↕" : ""}
        </span>
      </div>
    );
  }

  if (widget.type === "group") {
    return (
      <div style={{
        width: "100%", height: "100%",
        border: `${Math.max(1, scale)}px dashed rgba(120,120,255,0.4)`,
        borderRadius: 2,
        boxSizing: "border-box",
      }} />
    );
  }

  if (widget.type === "panel") {
    const style = widget.props.style ?? "default";
    const fillColor =
      style === "dark"        ? "rgba(0,0,0,0.5)" :
      style === "transparent" ? "rgba(198,198,198,0.15)" :
                                "#c6c6c6";
    // Border is 3 MC pixels: 1px black outer + 2px bevel (white top-left, #555 bottom-right).
    // mc_panel.png is cropped to exactly 176×166 so the slice is clean from each edge.
    // mc_panel_slice.png is a 7×7 nine-slice sprite (3px border | 1px center | 3px border).
    // Corners are transparent (authentic MC cut-corner look). `fill` stretches the 1×1
    // grey center pixel across the content area, so no backgroundColor bleeds under corners.
    const borderPx = 3 * scale;
    return (
      <div style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        background: fillColor,
        backgroundClip: "padding-box",
        borderWidth: borderPx, borderStyle: "solid", borderColor: "transparent",
        borderImage: `url("${tex("mc_panel_slice.png")}") 3 fill`,
        imageRendering: "pixelated",
      }} />
    );
  }

  if (widget.type === "tabs") {
    // Canvas renders the selector row and content panel on top of this — keep transparent.
    return <div style={{ width: "100%", height: "100%", background: "transparent" }} />;
  }

  if (widget.type === "input") {
    const hint = widget.props.hint_text || "";
    const hasText = !!widget.text;
    const focused = interactState === "hovered" || interactState === "pressed";
    const borderColor = focused ? "#fff" : "#a0a0a0";
    return (
      <div style={{
        ...commonStyle,
        background: "#000",
        border: `${scale}px solid ${borderColor}`,
        justifyContent: "flex-start",
        padding: `0 ${2 * scale}px`,
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

  if (widget.type === "slider") {
    const min = parseFloat(widget.props.min ?? "0");
    const max = parseFloat(widget.props.max ?? "100");
    const val = parseFloat(widget.props.value ?? "50");
    const pct = max > min ? (val - min) / (max - min) : 0.5;

    // Handle is 8 MC pixels wide (same as vanilla). Track fills the full widget.
    const handleWidthPx = 8 * scale;
    // Handle travels from left edge (pct=0) to right edge minus its own width (pct=1)
    const handleLeft = `calc(${pct} * (100% - ${handleWidthPx}px))`;
    const borderPx = 2 * scale;

    return (
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
        {/* Track — recessed slider texture */}
        <div style={{
          position: "absolute", inset: 0,
          borderWidth: borderPx, borderStyle: "solid", borderColor: "transparent",
          borderImage: `url("${tex("mc_slider_track_slice.png")}") 2 fill / ${borderPx}px`,
          imageRendering: "pixelated",
          boxSizing: "border-box",
        }} />

        {/* Handle */}
        <div style={{
          position: "absolute",
          top: 0,
          left: handleLeft,
          width: handleWidthPx,
          height: "100%",
          borderWidth: borderPx, borderStyle: "solid", borderColor: "transparent",
          borderImage: `url("${tex("mc_slider_handle_slice.png")}") 2 fill / ${borderPx}px`,
          imageRendering: "pixelated",
          boxSizing: "border-box",
        }} />

        {/* Label centred over the track */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize, fontFamily: '"Minecraft", monospace',
          color: "#fff",
          textShadow: `${scale}px ${scale}px 0 #333`,
          userSelect: "none",
          pointerEvents: "none",
        }}>
          {widget.text.replace("%s", String(val))}
        </div>
      </div>
    );
  }

  if (widget.type === "scroll") {
    const scrollbarW = 3 * scale;
    return (
      <div style={{ ...commonStyle, padding: 0, position: "relative" }}>
        {/* Scrollbar track */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: scrollbarW,
          background: "#1a1a1a", borderLeft: `1px solid #444`,
        }}>
          <div style={{
            position: "absolute", top: "15%", width: "100%", height: "25%",
            background: "#555", borderRadius: 1,
          }} />
        </div>
      </div>
    );
  }

  if (widget.type === "list") {
    const itemHeight = parseInt(widget.props.item_height ?? "20", 10) * scale;
    const visibleRows = Math.max(1, Math.floor((widget.h * scale) / itemHeight));
    const template = widget.item_template ?? [];
    return (
      <div style={{ ...commonStyle, flexDirection: "column", justifyContent: "flex-start", alignItems: "stretch", padding: 0, overflow: "hidden" }}>
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
                left: t.x * scale,
                top: t.y * scale,
                width: t.w * scale,
                height: t.h * scale,
                display: "flex",
                alignItems: "center",
                fontSize: Math.max(6, 7 * scale),
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

  if (widget.type === "label") {
    const align = (widget.props.align ?? "left") as React.CSSProperties["justifyContent"];
    return (
      <div style={{ ...commonStyle, justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start" }}>
        {widget.text}
      </div>
    );
  }

  if (widget.type === "icon") {
    return (
      <div style={commonStyle}>
        {widget.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={widget.icon} alt="" style={{ width: "100%", height: "100%", imageRendering: "pixelated" }} />
        ) : (
          <span style={{ fontSize: fontSize * 0.7 }}>icon</span>
        )}
      </div>
    );
  }

  // button, toggle_button, tab_button
  if (widget.type === "button" || widget.type === "toggle_button") {
    const borderPx = 2 * scale;
    const isToggle = widget.type === "toggle_button";

    // Toggle "on" acts like permanently pressed: dark texture + dim overlay
    const effectivelyPressed = interactState === "pressed" || (isToggle && toggled);
    const btnTex = (interactState === "idle" && !effectivelyPressed) ? "mc_button_normal.png" : "mc_button_hover.png";

    return (
      <div style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        border: `${borderPx}px solid transparent`,
        borderImage: `url("${tex(btnTex)}") 2 fill / ${borderPx}px`,
        imageRendering: "pixelated",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontFamily: '"Minecraft", monospace',
        // toggled-on text goes green like Minecraft's "ON" state
        color: isToggle && toggled ? "#55ff55" : "#fff",
        textShadow: `${scale}px ${scale}px 0 #333`,
        overflow: "hidden",
        userSelect: "none",
        gap: scale,
        filter: effectivelyPressed ? "brightness(0.75)" : undefined,
        transform: effectivelyPressed ? `translateY(${scale}px)` : undefined,
      }}>
        {widget.icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={widget.icon} alt="" style={{ width: fontSize, height: fontSize, imageRendering: "pixelated" }} />
        )}
        {widget.text}
      </div>
    );
  }

  return (
    <div style={{
      ...commonStyle,
      boxShadow: `inset -${scale}px -${scale}px 0 #555, inset ${scale}px ${scale}px 0 #fff`,
    }}>
      {widget.text}
    </div>
  );
}
