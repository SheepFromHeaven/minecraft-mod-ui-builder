import type { ScreenSpec, BindingsSchema } from "./types";

function toPascalCase(id: string): string {
  return id
    .replace(/[-_ ]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
}

function collectTextBindingPaths(schema: BindingsSchema, prefix = ""): string[] {
  const paths: string[] = [];
  for (const [key, node] of Object.entries(schema)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (node.type === "string") paths.push(path);
    if (node.children) paths.push(...collectTextBindingPaths(node.children, path));
  }
  return paths;
}


export function generateJavaClass(screen: ScreenSpec): string {
  const className = toPascalCase(screen.id);
  const modId = screen.modId ?? "your_mod";
  const hasContainer = (screen as { container?: unknown }).container != null ||
    screen.widgets.some((w) => w.type === "inventory_area");

  const baseClass = hasContainer ? "SpecContainerScreen<YourContainerMenu>" : "SpecScreen";
  const importBase = hasContainer ? "sheepfromheaven.screenspec.runtime.SpecContainerScreen" : "sheepfromheaven.screenspec.runtime.SpecScreen";

  const declaredActions = screen.actions ?? [];
  const switchCases: string[] = declaredActions.map((a) => `${modId}.${a}`);

  const textBindings = collectTextBindingPaths(screen.bindingsSchema ?? {});

  const customWidgets = screen.widgets.filter((w) => w.type === "custom");

  const lines: string[] = [];

  if (textBindings.length > 0) lines.push(`import net.minecraft.client.gui.GuiGraphics;`);
  lines.push(`import net.minecraft.network.chat.Component;`);
  if (hasContainer) lines.push(`import net.minecraft.world.entity.player.Inventory;`);
  if (!hasContainer) lines.push(`import sheepfromheaven.screenspec.runtime.ScreenSpecLoader;`);
  if (switchCases.length > 0) lines.push(`import sheepfromheaven.screenspec.runtime.WidgetSpec;`);
  if (customWidgets.length > 0) lines.push(`import sheepfromheaven.screenspec.runtime.CustomWidgetRegistry;`);
  lines.push(`import ${importBase};`);
  lines.push(``);
  lines.push(`public class ${className} extends ${baseClass} {`);
  lines.push(``);

  if (hasContainer) {
    lines.push(`    public ${className}(YourContainerMenu menu, Inventory playerInventory, Component title) {`);
    lines.push(`        super(menu, playerInventory, title, "${modId}", "${screen.id}");`);
    for (const w of customWidgets) {
      const customType = w.props?.customType || `${modId}:${w.id}`;
      lines.push(`        CustomWidgetRegistry.register("${customType}", (graphics, widget, x, y) -> { /* TODO: render "${w.id}" */ });`);
    }
    lines.push(`    }`);
  } else {
    lines.push(`    public ${className}() {`);
    lines.push(`        super(Component.translatable("screen.${modId}.${screen.id}"),`);
    lines.push(`              ScreenSpecLoader.fromResource(net.minecraft.client.Minecraft.getInstance().getResourceManager(),`);
    lines.push(`                  "${modId}", "${screen.id}"));`);
    for (const w of customWidgets) {
      const customType = w.props?.customType || `${modId}:${w.id}`;
      lines.push(`        CustomWidgetRegistry.register("${customType}", (graphics, widget, x, y) -> { /* TODO: render "${w.id}" */ });`);
    }
    lines.push(`    }`);
  }

  if (switchCases.length > 0) {
    lines.push(``);
    lines.push(`    @Override`);
    lines.push(`    protected void onAction(String actionId, WidgetSpec spec, Object value) {`);
    lines.push(`        switch (actionId) {`);
    for (const c of switchCases) {
      lines.push(`            case "${c}" -> { /* TODO */ }`);
    }
    lines.push(`        }`);
    lines.push(`    }`);
  }

  if (textBindings.length > 0) {
    lines.push(``);
    lines.push(`    @Override`);
    lines.push(`    public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {`);
    for (const path of textBindings) {
      lines.push(`        bindText("${path}", /* TODO: supply value for ${path} */);`);
    }
    lines.push(`        super.render(graphics, mouseX, mouseY, partialTick);`);
    lines.push(`    }`);
  }

  lines.push(`}`);

  return lines.join("\n");
}
