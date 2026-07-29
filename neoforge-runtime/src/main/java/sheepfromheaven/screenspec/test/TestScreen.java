package sheepfromheaven.screenspec.test;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.network.chat.Component;
import sheepfromheaven.screenspec.runtime.ScreenSpec;
import sheepfromheaven.screenspec.runtime.ScreenSpecLoader;
import sheepfromheaven.screenspec.runtime.SpecScreen;

/** Smoke-test screen loaded from assets/screenspec/screenspec/test_screen.json. */
public class TestScreen extends SpecScreen {

    private String currentInput = "";

    private TestScreen(ScreenSpec spec) {
        super(Component.literal("ScreenSpec Test"), spec);
    }

    public static void open() {
        Minecraft mc = Minecraft.getInstance();
        ScreenSpec spec = ScreenSpecLoader.fromResource(mc.getResourceManager(), "screenspec", "test_screen");
        mc.setScreen(new TestScreen(spec));
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
}
