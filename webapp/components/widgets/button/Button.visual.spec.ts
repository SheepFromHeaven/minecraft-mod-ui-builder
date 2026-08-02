import { runWidgetVisualCases } from "../../../tests/support/widgetVisualCase";

runWidgetVisualCases([
  {
    name: "button-idle",
    widget: { type: "button", x: 0, y: 0, w: 48, h: 16, text: "OK", icon: null, props: {} },
  },
  {
    name: "button-hover",
    widget: { type: "button", x: 0, y: 0, w: 48, h: 16, text: "OK", icon: null, props: {} },
    interactState: "hovered",
  },
  {
    name: "button-pressed",
    widget: { type: "button", x: 0, y: 0, w: 48, h: 16, text: "OK", icon: null, props: {} },
    interactState: "pressed",
  },
  {
    name: "toggle-button-on",
    widget: { type: "toggle_button", x: 0, y: 0, w: 48, h: 16, text: "On", icon: null, props: { group: "" } },
    toggled: true,
  },
]);
