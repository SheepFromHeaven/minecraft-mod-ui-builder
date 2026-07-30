package sheepfromheaven.screenspec.test;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.world.entity.player.Inventory;
import sheepfromheaven.screenspec.runtime.ScrollableSlotArea;
import sheepfromheaven.screenspec.runtime.SpecContainerScreen;
import sheepfromheaven.screenspec.runtime.WidgetSpec;

/**
 * Smoke-test screen loaded from {@code test_container_screen.json}.
 * Two tabs: "General" (labels, button, toggle, slider, input) and
 * "Inventory" (two scrollable slot areas plus the player's fixed inventory).
 */
public final class TestContainerScreen extends SpecContainerScreen<TestContainerMenu> {

    private String currentInput = "";

    public TestContainerScreen(TestContainerMenu menu, Inventory playerInventory, Component title) {
        super(menu, playerInventory, title, "screenspec", "test_container_screen");
    }

    @Override
    protected void onAction(String id, WidgetSpec spec, Object value) {
        switch (id) {
            case "close_btn" -> onClose();
            case "toggle_a"  -> System.out.println("[screenspec-test] toggle_a = " + value);
            case "slider_1"  -> System.out.println("[screenspec-test] slider   = " + value);
            case "input_1"   -> currentInput = value instanceof String str ? str : "";
            case "send_btn"  -> sendToChat();
        }
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
        Minecraft mc = Minecraft.getInstance();
        if (mc.player != null) {
            float health    = mc.player.getHealth();
            float maxHealth = mc.player.getMaxHealth();
            bindText("health_label", String.format("Health: %.1f / %.1f", health, maxHealth));
        }
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

    private void sendToChat() {
        Minecraft mc = Minecraft.getInstance();
        if (mc.player == null || currentInput.isBlank()) return;
        mc.player.connection.sendChat(currentInput);
        onClose();
    }
}
