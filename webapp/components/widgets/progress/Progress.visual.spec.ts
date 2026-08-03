import { runWidgetVisualCases } from "../../../tests/support/widgetVisualCase";

const BASE = { type: "progress" as const, x: 0, y: 0, w: 80, h: 10, text: "", icon: null };

runWidgetVisualCases([
  {
    name: "progress-threshold-low",
    widget: { ...BASE, props: { min: "0", max: "100", value: "10", style: "threshold", show_label: "true" } },
  },
  {
    name: "progress-threshold-mid",
    widget: { ...BASE, props: { min: "0", max: "100", value: "50", style: "threshold", show_label: "true" } },
  },
  {
    name: "progress-threshold-high",
    widget: { ...BASE, props: { min: "0", max: "100", value: "90", style: "threshold", show_label: "true" } },
  },
  {
    name: "progress-solid",
    widget: { ...BASE, props: { min: "0", max: "100", value: "50", style: "solid", color: "255", show_label: "true" } },
  },
  {
    name: "progress-no-label",
    widget: { ...BASE, props: { min: "0", max: "100", value: "50", style: "threshold", show_label: "false" } },
  },
]);
