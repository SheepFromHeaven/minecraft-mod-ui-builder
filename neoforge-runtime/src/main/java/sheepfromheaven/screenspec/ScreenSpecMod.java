package sheepfromheaven.screenspec;

import net.neoforged.api.distmarker.Dist;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.ModContainer;
import net.neoforged.fml.common.Mod;
import net.neoforged.fml.loading.FMLEnvironment;
import sheepfromheaven.screenspec.test.TestClientSetup;

@Mod("screenspec")
public class ScreenSpecMod {

    public ScreenSpecMod(IEventBus modBus, ModContainer modContainer) {
        if (FMLEnvironment.getDist() == Dist.CLIENT) {
            TestClientSetup.register(modBus);
        }
    }
}
