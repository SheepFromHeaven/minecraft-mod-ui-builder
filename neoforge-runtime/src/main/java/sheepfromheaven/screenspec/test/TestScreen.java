package sheepfromheaven.screenspec.test;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import sheepfromheaven.screenspec.runtime.ScreenSpec;
import sheepfromheaven.screenspec.runtime.SpecScreen;
import sheepfromheaven.screenspec.runtime.WidgetSpec;

/**
 * Smoke-test screen loaded from assets/screenspec/screenspec/test_screen.json. Constructed by
 * {@link TestClientSetup} via {@link sheepfromheaven.screenspec.runtime.ScreenSpecs#open} - see
 * that class for how it and {@link TestContainerScreen} both get opened from the same call site
 * without {@link TestClientSetup} needing to know which one has slots.
 */
public class TestScreen extends SpecScreen {

    private String currentInput = "";

    TestScreen(ScreenSpec spec) {
        super(Component.literal("ScreenSpec Test"), spec);
    }

    @Override
    protected void init() {
        super.init();
        on("close_btn", (id, s, v) -> onClose());
        on("toggle_a",  (id, s, v) -> System.out.println("[screenspec-test] toggle_a = " + v));
        on("slider_1",  (id, s, v) -> System.out.println("[screenspec-test] slider   = " + v));
        on("input_1",   (id, s, v) -> currentInput = v instanceof String str ? str : "");
        on("send_btn",  (id, s, v) -> sendToChat());
    }

    @Override
    public void render(GuiGraphics guiGraphics, int mouseX, int mouseY, float partialTick) {
        Minecraft mc = Minecraft.getInstance();
        if (mc.player != null) {
            float health    = mc.player.getHealth();
            float maxHealth = mc.player.getMaxHealth();
            bindText("health_label", String.format("Health: %.1f / %.1f", health, maxHealth));
        }
        super.render(guiGraphics, mouseX, mouseY, partialTick);
    }

    private void sendToChat() {
        Minecraft mc = Minecraft.getInstance();
        if (mc.player == null || currentInput.isBlank()) return;
        mc.player.connection.sendChat(currentInput);
        onClose();
    }

    /** Exercises {@code icon} widget rendering - see {@code diamond_icon} in test_screen.json. */
    @Override
    protected Identifier resolveIcon(WidgetSpec w) {
        return "diamond".equals(w.icon) ? Identifier.withDefaultNamespace("textures/item/diamond.png") : null;
    }
}
