import { runWidgetVisualCases } from "../../../tests/support/widgetVisualCase";

runWidgetVisualCases([
  {
    name: "checkbox-unchecked",
    widget: { type: "checkbox", x: 0, y: 0, w: 20, h: 20, text: "", icon: null, props: { checked: "false" } },
  },
  {
    name: "checkbox-checked",
    widget: { type: "checkbox", x: 0, y: 0, w: 20, h: 20, text: "", icon: null, props: { checked: "true" } },
  },
]);
