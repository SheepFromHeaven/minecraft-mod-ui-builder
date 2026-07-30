package sheepfromheaven.screenspec;

import net.minecraft.network.chat.Component;
import net.minecraft.world.SimpleMenuProvider;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.ModContainer;
import net.neoforged.fml.common.Mod;
import net.neoforged.fml.loading.FMLEnvironment;
import net.neoforged.neoforge.network.event.RegisterPayloadHandlersEvent;
import sheepfromheaven.screenspec.test.ModMenuTypes;
import sheepfromheaven.screenspec.test.OpenTestContainerPayload;
import sheepfromheaven.screenspec.test.TestClientSetup;
import sheepfromheaven.screenspec.test.TestContainerMenu;

@Mod("screenspec")
public class ScreenSpecMod {

    public ScreenSpecMod(IEventBus modBus, ModContainer modContainer) {
        ModMenuTypes.register(modBus);
        modBus.addListener(ScreenSpecMod::registerPayloads);
        if (FMLEnvironment.getDist() == Dist.CLIENT) {
            TestClientSetup.register(modBus);
        }
    }

    private static void registerPayloads(RegisterPayloadHandlersEvent event) {
        event.registrar("1").playToServer(
            OpenTestContainerPayload.TYPE,
            OpenTestContainerPayload.CODEC,
            (payload, context) -> context.enqueueWork(() -> context.player().openMenu(new SimpleMenuProvider(
                (id, inv, player) -> new TestContainerMenu(id, inv, TestContainerMenu.demoContainerA(), TestContainerMenu.demoContainerB()),
                Component.literal("ScreenSpec Test")
            )))
        );
    }
}
