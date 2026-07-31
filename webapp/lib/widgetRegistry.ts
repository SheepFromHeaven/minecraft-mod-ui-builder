import type { WidgetSpec } from "./types";

export type PropFieldType = "text" | "number" | "boolean" | "select";

export interface PropField {
  key: string;
  label: string;
  type: PropFieldType;
  options?: string[];
  defaultValue?: string;
}

export interface WidgetDef {
  type: string;
  label: string;
  isContainer?: boolean;
  defaultWidget: Omit<WidgetSpec, "id">;
  // schema for the `props` record — fields beyond text/icon
  propSchema: PropField[];
}

const WIDGET_REGISTRY: WidgetDef[] = [
  {
    type: "group",
    label: "Group",
    isContainer: true,
    defaultWidget: { type: "group", x: 0, y: 0, w: 80, h: 40, text: "", icon: null, props: {} },
    propSchema: [],
  },
  {
    type: "panel",
    label: "Panel",
    isContainer: true,
    defaultWidget: { type: "panel", x: 8, y: 8, w: 176, h: 166, text: "", icon: null, props: { style: "default" } },
    propSchema: [
      { key: "style", label: "Style", type: "select", options: ["default", "dark", "transparent"], defaultValue: "default" },
    ],
  },
  {
    type: "scroll",
    label: "Scroll Area",
    isContainer: true,
    defaultWidget: { type: "scroll", x: 8, y: 8, w: 160, h: 120, text: "", icon: null, props: {} },
    propSchema: [],
  },
  {
    type: "tabs",
    label: "Tabs",
    isContainer: true,
    defaultWidget: {
      type: "tabs",
      x: 8, y: 8, w: 176, h: 150,
      text: "", icon: null,
      props: { tab_height: "20" },
    },
    propSchema: [
      { key: "tab_height", label: "Tab Height", type: "number", defaultValue: "20" },
    ],
  },
  {
    type: "tab",
    label: "Tab",
    isContainer: true,
    defaultWidget: { type: "tab", x: 0, y: 0, w: 0, h: 0, text: "Tab", icon: null, props: {} },
    propSchema: [],
  },
  {
    type: "button",
    label: "Button",
    defaultWidget: { type: "button", x: 8, y: 8, w: 72, h: 20, text: "Button", icon: null, props: {} },
    propSchema: [],
  },
  {
    type: "toggle_button",
    label: "Toggle Button",
    defaultWidget: { type: "toggle_button", x: 8, y: 8, w: 72, h: 20, text: "Toggle", icon: null, props: { group: "" } },
    propSchema: [
      { key: "group", label: "Group ID", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "input",
    label: "Input",
    defaultWidget: { type: "input", x: 8, y: 8, w: 120, h: 20, text: "", icon: null, props: { max_length: "32" } },
    propSchema: [
      { key: "max_length", label: "Max Length", type: "number", defaultValue: "32" },
      { key: "hint_text", label: "Hint Text", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "slider",
    label: "Slider",
    defaultWidget: { type: "slider", x: 8, y: 8, w: 150, h: 20, text: "Value: %s", icon: null, props: { min: "0", max: "100", step: "1", value: "50" } },
    propSchema: [
      { key: "min", label: "Min", type: "number", defaultValue: "0" },
      { key: "max", label: "Max", type: "number", defaultValue: "100" },
      { key: "step", label: "Step", type: "number", defaultValue: "1" },
      { key: "value", label: "Default Value", type: "number", defaultValue: "50" },
    ],
  },
  {
    type: "label",
    label: "Label",
    defaultWidget: { type: "label", x: 8, y: 8, w: 80, h: 10, text: "Label", icon: null, props: { color: "4210752", shadow: "false" } },
    propSchema: [
      { key: "color", label: "Color (ARGB int)", type: "number", defaultValue: "4210752" },
      { key: "shadow", label: "Shadow", type: "boolean", defaultValue: "false" },
      { key: "align", label: "Align", type: "select", options: ["left", "center", "right"], defaultValue: "left" },
    ],
  },
  {
    type: "scrollbar",
    label: "Scrollbar",
    defaultWidget: {
      type: "scrollbar",
      x: 8, y: 8, w: 14, h: 54,
      text: "", icon: null,
      props: { axis: "y", target: "" },
    },
    propSchema: [
      { key: "axis",   label: "Axis",            type: "select", options: ["y", "x"], defaultValue: "y" },
      { key: "target", label: "Target widget ID", type: "text",   defaultValue: "" },
    ],
  },
  {
    type: "inventory_area",
    label: "Inventory Area",
    defaultWidget: {
      type: "inventory_area",
      x: 8, y: 8,
      w: 9 * 18, h: 3 * 18,  // 9 cols × 3 rows × 18px slot_size
      text: "", icon: null,
      props: { cols: "9", rows: "3", slot_size: "18", source: "" },
    },
    propSchema: [
      { key: "cols",      label: "Columns",      type: "number",  defaultValue: "9"  },
      { key: "rows",      label: "Preview rows", type: "number",  defaultValue: "3"  },
      { key: "slot_size", label: "Slot Size",    type: "number",  defaultValue: "18" },
      { key: "source",    label: "Source",       type: "select",  options: ["", "player", "player_hotbar"], defaultValue: "" },
    ],
  },
  {
    type: "sprite",
    label: "Sprite",
    defaultWidget: { type: "sprite", x: 8, y: 8, w: 32, h: 32, text: "", icon: null, props: { src: "", fit: "fill" } },
    propSchema: [
      { key: "src", label: "Texture", type: "text", defaultValue: "" },
      { key: "fit", label: "Fit", type: "select", options: ["fill", "contain", "cover", "tile", "none"], defaultValue: "fill" },
    ],
  },
  {
    type: "list",
    label: "List",
    defaultWidget: {
      type: "list",
      x: 8, y: 8, w: 160, h: 120,
      text: "", icon: null,
      props: { item_height: "20" },
      item_template: [
        { id: "icon",  type: "sprite", x: 2,  y: 2,  w: 16, h: 16, text: "", icon: null, props: { src: "", fit: "fill" } },
        { id: "label", type: "label",  x: 22, y: 6,  w: 120, h: 12, text: "", icon: null, props: {} },
      ],
    },
    propSchema: [
      { key: "item_height", label: "Item Height (px)", type: "number", defaultValue: "20" },
    ],
  },
];

export default WIDGET_REGISTRY;

export function getWidgetDef(type: string): WidgetDef | undefined {
  return WIDGET_REGISTRY.find((d) => d.type === type);
}
