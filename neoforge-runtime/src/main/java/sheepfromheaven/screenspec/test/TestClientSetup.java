package sheepfromheaven.screenspec.test;

import com.mojang.blaze3d.platform.InputConstants;
import net.minecraft.client.KeyMapping;
import net.minecraft.resources.Identifier;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.neoforge.client.event.RegisterKeyMappingsEvent;
import net.neoforged.neoforge.client.settings.KeyConflictContext;
import net.neoforged.neoforge.common.NeoForge;
import net.neoforged.neoforge.client.event.ClientTickEvent;

public class TestClientSetup {

    static final KeyMapping.Category CATEGORY = new KeyMapping.Category(
        Identifier.fromNamespaceAndPath("screenspec", "keys")
    );

    static final KeyMapping OPEN_TEST_SCREEN = new KeyMapping(
        "key.screenspec.open_test",
        KeyConflictContext.IN_GAME,
        InputConstants.Type.KEYSYM,
        InputConstants.KEY_K,
        CATEGORY
    );

    public static void register(IEventBus modBus) {
        modBus.addListener(TestClientSetup::onRegisterKeys);
        NeoForge.EVENT_BUS.addListener(TestClientSetup::onClientTick);
    }

    private static void onRegisterKeys(RegisterKeyMappingsEvent event) {
        event.registerCategory(CATEGORY);
        event.register(OPEN_TEST_SCREEN);
    }

    private static void onClientTick(ClientTickEvent.Post event) {
        while (OPEN_TEST_SCREEN.consumeClick()) {
            TestScreen.open();
        }
    }
}
