import { runWidgetVisualCases } from "../../../tests/support/widgetVisualCase";

runWidgetVisualCases([
  {
    name: "input",
    widget: { type: "input", x: 0, y: 0, w: 100, h: 16, text: "hello", icon: null, props: { max_length: "32" } },
  },
]);
