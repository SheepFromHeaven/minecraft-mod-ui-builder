import { describe, it, expect } from "vitest";
import { generateJavaClass } from "@/lib/generateJavaClass";
import { makeScreen, makeWidget } from "./fixtures";

describe("generateJavaClass", () => {
  it("plain screen — extends SpecScreen, no-arg constructor", () => {
    const java = generateJavaClass(makeScreen({ id: "my-screen" }));
    expect(java).toContain("public class MyScreen extends SpecScreen");
    expect(java).toContain('import sheepfromheaven.screenspec.runtime.SpecScreen;');
    expect(java).toContain("public MyScreen()");
    expect(java).toContain('Component.translatable("screen.my_mod.my-screen")');
    expect(java).toContain('ScreenSpecLoader.fromResource(');
    expect(java).not.toContain("SpecContainerScreen");
    expect(java).not.toContain("onAction");
    expect(java).not.toContain("render");
  });

  it("container screen — extends SpecContainerScreen when inventory_area widget present", () => {
    const java = generateJavaClass(makeScreen({
      id: "chest-screen",
      widgets: [makeWidget({ id: "inv", type: "inventory_area" })],
    }));
    expect(java).toContain("extends SpecContainerScreen<YourContainerMenu>");
    expect(java).toContain('import sheepfromheaven.screenspec.runtime.SpecContainerScreen;');
    expect(java).toContain("YourContainerMenu menu, Inventory playerInventory, Component title");
    expect(java).toContain('super(menu, playerInventory, title, "my_mod", "chest-screen")');
    expect(java).not.toContain("SpecScreen");
  });

  it("falls back to 'your_mod' when modId is absent", () => {
    const java = generateJavaClass({ id: "screen", width: 320, height: 180, widgets: [] });
    expect(java).toContain('"your_mod"');
  });

  it("toPascalCase handles kebab, snake, and spaces", () => {
    expect(generateJavaClass(makeScreen({ id: "my-great_screen here" }))).toContain(
      "class MyGreatScreenHere"
    );
  });

  it("emits onAction override with switch cases for declared actions", () => {
    const java = generateJavaClass(makeScreen({
      id: "form",
      actions: ["submit", "cancel"],
    }));
    expect(java).toContain("protected void onAction(String actionId, WidgetSpec spec, Object value)");
    expect(java).toContain('case "my_mod.submit"');
    expect(java).toContain('case "my_mod.cancel"');
    expect(java).toContain("import sheepfromheaven.screenspec.runtime.WidgetSpec;");
  });

  it("emits render override for string bindings in schema", () => {
    const java = generateJavaClass(makeScreen({
      id: "hud",
      bindingsSchema: {
        player: { children: { name: { type: "string" }, health: { type: "number" } } },
        title: { type: "string" },
      },
    }));
    expect(java).toContain("public void render(GuiGraphics graphics");
    expect(java).toContain('bindText("player.name"');
    expect(java).toContain('bindText("title"');
    // number binding should NOT appear
    expect(java).not.toContain("player.health");
    expect(java).toContain("import net.minecraft.client.gui.GuiGraphics;");
  });

  it("no render override when only non-string bindings present", () => {
    const java = generateJavaClass(makeScreen({
      id: "hud",
      bindingsSchema: { hp: { type: "number" } },
    }));
    expect(java).not.toContain("render");
  });

  it("output is valid Java structure — opens and closes the class brace", () => {
    const java = generateJavaClass(makeScreen({ id: "x" }));
    const lines = java.split("\n");
    expect(lines.at(-1)).toBe("}");
    expect(lines.some(l => l.trim().startsWith("public class"))).toBe(true);
  });
});
