package sheepfromheaven.screenspec.test;

import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.world.entity.player.Inventory;
import sheepfromheaven.screenspec.runtime.ScrollableSlotArea;
import sheepfromheaven.screenspec.runtime.SpecContainerScreen;
import sheepfromheaven.screenspec.runtime.WidgetSpec;

/**
 * Smoke-test screen for the scrollable {@code inv_10row} area in
 * {@code test_container_screen.json}. Closes on Escape like any vanilla container screen - no
 * close button needed, since {@code SpecContainerScreen} doesn't yet build interactive widgets
 * other than {@code scrollbar} (see the runtime README's Known limitations).
 *
 * <p>Also exercises {@code icon} widget rendering and {@code bindText} - both now shared with
 * {@link sheepfromheaven.screenspec.runtime.SpecScreen} via {@code SpecWidgetRenderer}, so they
 * behave the same here as in {@link TestScreen}.
 */
public final class TestContainerScreen extends SpecContainerScreen<TestContainerMenu> {
    public TestContainerScreen(TestContainerMenu menu, Inventory playerInventory, Component title) {
        super(menu, playerInventory, title, TestContainerMenu.SPEC);
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
        ScrollableSlotArea area = this.menu.scrollableAreas().get("inv_10row");
        if (area != null) {
            bindText("scroll_label", "Row: " + area.scrollRow());
        }
        super.render(graphics, mouseX, mouseY, partialTick);
    }

    @Override
    protected Identifier resolveIcon(WidgetSpec w) {
        return "diamond".equals(w.icon) ? Identifier.withDefaultNamespace("textures/item/diamond.png") : null;
    }
}
