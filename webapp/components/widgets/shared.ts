// Shared style plumbing used by several of the simpler widget Visual
// components (those that don't have real texture-driven rendering yet).

export const TYPE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
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

export const FALLBACK_STYLE = { bg: "#ddd", border: "#888", text: "#000" };

export const FONT_SIZE = 7;

export function commonStyle(widgetType: string): React.CSSProperties {
  const s = TYPE_STYLES[widgetType] ?? FALLBACK_STYLE;
  return {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    background: s.bg,
    border: s.border !== "transparent" ? `1px solid ${s.border}` : "none",
    color: s.text,
    fontSize: FONT_SIZE,
    fontFamily: '"Minecraft", monospace',
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    userSelect: "none",
    padding: `0 2px`,
  };
}

export type InteractState = "idle" | "hovered" | "pressed";

export interface VisualProps {
  widget: import("@/lib/types").WidgetSpec;
  scale: number;
  interactState?: InteractState;
  toggled?: boolean;
  tex: (name: string) => string | undefined;
  packTextures: Record<string, string>;
}
