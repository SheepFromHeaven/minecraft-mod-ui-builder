import { runWidgetVisualCases } from "../../../tests/support/widgetVisualCase";

runWidgetVisualCases([
  {
    name: "scrollbar-vertical",
    widget: { type: "scrollbar", x: 0, y: 0, w: 14, h: 60, text: "", icon: null, props: { axis: "y" } },
  },
  {
    name: "scrollbar-horizontal",
    widget: { type: "scrollbar", x: 0, y: 0, w: 60, h: 14, text: "", icon: null, props: { axis: "x" } },
  },
  {
    // Knob at the far end of the track — locks in the rotation-correction fix
    // for the horizontal knob's travel offset (it used to only clear the
    // bevel at pct=0, drifting out of alignment as it approached 100%).
    name: "scrollbar-vertical-scrolled-100",
    widget: { type: "scrollbar", x: 0, y: 0, w: 14, h: 60, text: "", icon: null, props: { axis: "y" } },
    scrollPct: 1,
  },
  {
    name: "scrollbar-horizontal-scrolled-100",
    widget: { type: "scrollbar", x: 0, y: 0, w: 60, h: 14, text: "", icon: null, props: { axis: "x" } },
    scrollPct: 1,
  },
]);
