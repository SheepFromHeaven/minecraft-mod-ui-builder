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
  defaultWidget: Omit<WidgetSpec, "id">;
  // schema for the `props` record — fields beyond text/icon
  propSchema: PropField[];
}

const WIDGET_REGISTRY: WidgetDef[] = [
  {
    type: "panel",
    label: "Panel",
    defaultWidget: { type: "panel", x: 8, y: 8, w: 176, h: 166, text: "", icon: null, props: { style: "default" } },
    propSchema: [
      { key: "style", label: "Style", type: "select", options: ["default", "dark", "transparent"], defaultValue: "default" },
    ],
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
    type: "tab_button",
    label: "Tab Button",
    defaultWidget: { type: "tab_button", x: 8, y: 8, w: 56, h: 20, text: "Tab", icon: null, props: { tab_group: "", tab_index: "0" } },
    propSchema: [
      { key: "tab_group", label: "Tab Group", type: "text", defaultValue: "" },
      { key: "tab_index", label: "Tab Index", type: "number", defaultValue: "0" },
    ],
  },
  {
    type: "edit_box",
    label: "Edit Box",
    defaultWidget: { type: "edit_box", x: 8, y: 8, w: 120, h: 20, text: "", icon: null, props: { max_length: "32" } },
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
      { key: "shadow", label: "Shadow", type: "select", options: ["true", "false"], defaultValue: "false" },
      { key: "align", label: "Align", type: "select", options: ["left", "center", "right"], defaultValue: "left" },
    ],
  },
  {
    type: "icon",
    label: "Icon",
    defaultWidget: { type: "icon", x: 8, y: 8, w: 16, h: 16, text: "", icon: null, props: { scale: "1" } },
    propSchema: [
      { key: "scale", label: "Scale", type: "number", defaultValue: "1" },
    ],
  },
];

export default WIDGET_REGISTRY;

export function getWidgetDef(type: string): WidgetDef | undefined {
  return WIDGET_REGISTRY.find((d) => d.type === type);
}
