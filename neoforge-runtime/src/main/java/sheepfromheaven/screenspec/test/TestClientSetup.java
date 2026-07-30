package sheepfromheaven.screenspec.test;

import com.mojang.blaze3d.platform.InputConstants;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraft.resources.Identifier;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.neoforge.client.event.RegisterKeyMappingsEvent;
import net.neoforged.neoforge.client.event.RegisterMenuScreensEvent;
import net.neoforged.neoforge.client.network.ClientPacketDistributor;
import net.neoforged.neoforge.client.settings.KeyConflictContext;
import net.neoforged.neoforge.common.NeoForge;
import net.neoforged.neoforge.client.event.ClientTickEvent;
import sheepfromheaven.screenspec.runtime.ScreenSpec;
import sheepfromheaven.screenspec.runtime.ScreenSpecLoader;
import sheepfromheaven.screenspec.runtime.ScreenSpecs;

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

    static final KeyMapping OPEN_TEST_CONTAINER_SCREEN = new KeyMapping(
        "key.screenspec.open_test_container",
        KeyConflictContext.IN_GAME,
        InputConstants.Type.KEYSYM,
        InputConstants.KEY_J, // not L - that's vanilla's default Advancements key
        CATEGORY
    );

    public static void register(IEventBus modBus) {
        modBus.addListener(TestClientSetup::onRegisterKeys);
        modBus.addListener(TestClientSetup::onRegisterMenuScreens);
        NeoForge.EVENT_BUS.addListener(TestClientSetup::onClientTick);
    }

    private static void onRegisterKeys(RegisterKeyMappingsEvent event) {
        event.registerCategory(CATEGORY);
        event.register(OPEN_TEST_SCREEN);
        event.register(OPEN_TEST_CONTAINER_SCREEN);
    }

    private static void onRegisterMenuScreens(RegisterMenuScreensEvent event) {
        event.register(ModMenuTypes.TEST_CONTAINER.get(), TestContainerScreen::new);
    }

    private static void onClientTick(ClientTickEvent.Post event) {
        while (OPEN_TEST_SCREEN.consumeClick()) {
            openTestScreen("test_screen");
        }
        while (OPEN_TEST_CONTAINER_SCREEN.consumeClick()) {
            openTestScreen("test_container_screen");
        }
    }

    /**
     * Loads {@code screenName} and opens it - one call site for both demo screens, even though one
     * is a plain client-side {@link TestScreen} and the other needs a server-round-tripped menu (see
     * {@link ModMenuTypes}, {@link OpenTestContainerPayload}). {@link ScreenSpecs#open} is what
     * decides which of those two happens, from {@code spec.container} alone - this method never
     * branches on it itself.
     */
    private static void openTestScreen(String screenName) {
        Minecraft mc = Minecraft.getInstance();
        ScreenSpec spec = ScreenSpecLoader.fromResource(mc.getResourceManager(), "screenspec", screenName);
        ScreenSpecs.open(spec,
            () -> new TestScreen(spec),
            () -> ClientPacketDistributor.sendToServer(new OpenTestContainerPayload()));
    }
}
