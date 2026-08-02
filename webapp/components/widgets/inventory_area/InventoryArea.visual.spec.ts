import { runWidgetVisualCases } from "../../../tests/support/widgetVisualCase";

runWidgetVisualCases([
  {
    name: "inventory-area-9x3",
    widget: { type: "inventory_area", x: 0, y: 0, w: 162, h: 54, text: "", icon: null, props: { cols: "9", rows: "3", slot_size: "18" } },
  },
  {
    name: "inventory-area-clipped",
    widget: { type: "inventory_area", x: 0, y: 0, w: 90, h: 36, text: "", icon: null, props: { cols: "9", rows: "3", slot_size: "18" } },
  },
]);
