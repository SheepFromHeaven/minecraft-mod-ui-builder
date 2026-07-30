package sheepfromheaven.screenspec.test;

import net.minecraft.core.registries.Registries;
import net.minecraft.world.inventory.MenuType;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.neoforge.common.extensions.IMenuTypeExtension;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredRegister;

/** Registers the {@link MenuType} backing {@link TestContainerMenu}. */
public final class ModMenuTypes {
    private static final DeferredRegister<MenuType<?>> MENUS = DeferredRegister.create(Registries.MENU, "screenspec");

    static final DeferredHolder<MenuType<?>, MenuType<TestContainerMenu>> TEST_CONTAINER =
        MENUS.register("test_container", () -> IMenuTypeExtension.create(TestContainerMenu::new));

    private ModMenuTypes() {}

    public static void register(IEventBus modBus) {
        MENUS.register(modBus);
    }
}
