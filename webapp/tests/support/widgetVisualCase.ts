import { test, expect } from "@playwright/test";
import { openWidgetHarness } from "./seed";
import type { WidgetSpec } from "../../lib/types";

/**
 * Shared test-generation helper for per-widget visual regression specs (see
 * components/widgets/<type>/*.visual.spec.ts). Each spec defines its own
 * CASES and calls this once — avoids repeating the same test-loop boilerplate
 * in every widget folder.
 */
export type WidgetVisualCase = {
  name: string;
  widget: Omit<WidgetSpec, "id">;
  interactState?: "idle" | "hovered" | "pressed";
  toggled?: boolean;
  scrollPct?: number;
};

export function runWidgetVisualCases(cases: WidgetVisualCase[]): void {
  for (const c of cases) {
    test(`widget visual: ${c.name}`, async ({ page }) => {
      await openWidgetHarness(page, {
        widget: c.widget,
        interactState: c.interactState,
        toggled: c.toggled,
        scrollPct: c.scrollPct,
        scale: 6,
      });
      await expect(page.locator("[data-harness-state]")).toHaveScreenshot(`${c.name}.png`);
    });
  }
}
