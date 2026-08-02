import { runWidgetVisualCases } from "../../../tests/support/widgetVisualCase";

runWidgetVisualCases([
  {
    name: "label-left",
    widget: { type: "label", x: 0, y: 0, w: 80, h: 12, text: "Hello world", icon: null, props: { align: "left" } },
  },
  {
    name: "label-center",
    widget: { type: "label", x: 0, y: 0, w: 80, h: 12, text: "Hello world", icon: null, props: { align: "center" } },
  },
  {
    name: "label-right",
    widget: { type: "label", x: 0, y: 0, w: 80, h: 12, text: "Hello world", icon: null, props: { align: "right" } },
  },
  {
    name: "label-valign-top",
    widget: { type: "label", x: 0, y: 0, w: 80, h: 30, text: "Hello world", icon: null, props: { align: "left", valign: "top" } },
  },
  {
    name: "label-valign-middle",
    widget: { type: "label", x: 0, y: 0, w: 80, h: 30, text: "Hello world", icon: null, props: { align: "left", valign: "middle" } },
  },
  {
    name: "label-valign-bottom",
    widget: { type: "label", x: 0, y: 0, w: 80, h: 30, text: "Hello world", icon: null, props: { align: "left", valign: "bottom" } },
  },
]);
