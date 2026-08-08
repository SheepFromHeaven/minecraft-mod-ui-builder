import { test, expect } from "@playwright/test";
import { seedTextures, seedProject, openEditor, screenWithWidget } from "../support/seed";

/**
 * Regression: updateWidget matched the widgets array by `updated.id` (the
 * NEW id, already edited in the ID field's onChange), not by the widget's
 * previous id. So renaming a widget's ID never actually replaced it in
 * screen.widgets, and selectedId got pointed at an id no longer present in
 * screen.widgets — selectedWidget lookup failed and the widget appeared to
 * deselect on every keystroke (most noticeably Backspace).
 * Fixed by matching on the pre-edit selectedId instead of updated.id.
 */
test("editing a widget's ID field keeps it selected after backspace", async ({ page }) => {
  await seedTextures(page);
  await seedProject(page, screenWithWidget({
    id: "label_original",
    type: "label", x: 60, y: 60, w: 60, h: 10, text: "Hi", icon: null, props: {},
  }));
  await openEditor(page);

  const widget = page.locator('[data-widget-id="label_original"]');
  await widget.click();

  const idInput = page.locator('label:text-is("ID") + input');
  await expect(idInput).toHaveValue("label_original");

  await idInput.click();
  await idInput.press("End");
  await idInput.press("Backspace");

  // The ID field itself should reflect the edit...
  await expect(idInput).toHaveValue("label_origina");
  // ...and the widget must remain selected, so the property panel stays open.
  await expect(idInput).toBeVisible();
});
