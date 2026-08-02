import { runWidgetVisualCases } from "../../../tests/support/widgetVisualCase";

runWidgetVisualCases([
  {
    name: "slider",
    widget: { type: "slider", x: 0, y: 0, w: 80, h: 16, text: "Value: %s", icon: null, props: { min: "0", max: "100", step: "1", value: "50" } },
  },
]);
