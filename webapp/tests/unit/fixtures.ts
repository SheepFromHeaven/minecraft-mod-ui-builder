import type { WidgetSpec, ScreenSpec } from "@/lib/types";

export function makeWidget(overrides: Partial<WidgetSpec> & { id: string; type: string }): WidgetSpec {
  return {
    x: 0, y: 0, w: 50, h: 50,
    text: "", icon: null,
    props: {},
    ...overrides,
  };
}

export function makeScreen(overrides: Partial<ScreenSpec> & { id: string }): ScreenSpec {
  return {
    modId: "my_mod",
    width: 320, height: 180,
    widgets: [],
    ...overrides,
  };
}
