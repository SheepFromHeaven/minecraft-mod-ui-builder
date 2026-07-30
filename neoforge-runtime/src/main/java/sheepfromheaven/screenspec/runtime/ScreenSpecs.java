package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.screens.Screen;

import java.util.function.Supplier;

/**
 * Opens a {@link ScreenSpec} without the caller needing to discern whether it declares inventory
 * slots: a plain spec ({@code spec.container == null}) can just be rendered on the client, while a
 * spec with a {@code container} needs a real {@code AbstractContainerMenu} - which only exists
 * server-side until the server round-trips it back (see the README's container/menu system note),
 * so opening one always means networking, not a direct {@code setScreen} call. That's the one
 * difference between the two that's inherent to Minecraft itself and can't be hidden here (see
 * {@link SpecContainerScreen}'s class doc) - everything else about calling this is identical
 * either way.
 *
 * <pre>{@code
 * // works the same whether "my_screen" turns out to be plain or have a container
 * ScreenSpec spec = ScreenSpecLoader.fromResource(mc.getResourceManager(), "my_mod", "my_screen");
 * ScreenSpecs.open(spec,
 *     () -> new MyScreen(spec),                                   // only called for plain specs
 *     () -> ClientPacketDistributor.sendToServer(new OpenMyScreenPayload())); // only for container specs
 * }</pre>
 */
public final class ScreenSpecs {
    private ScreenSpecs() {}

    /** Requests the server open this spec's menu; the mod supplies how, since only it knows its own {@code MenuProvider}. */
    @FunctionalInterface
    public interface ContainerOpener {
        void open();
    }

    /**
     * Opens {@code spec} the right way: {@code plainScreen} is called and its result handed to
     * {@link Minecraft#setScreen} when {@code spec.container} is {@code null}; otherwise
     * {@code containerOpener} is called instead and {@code plainScreen} is never touched.
     */
    public static void open(ScreenSpec spec, Supplier<Screen> plainScreen, ContainerOpener containerOpener) {
        if (spec.container != null) {
            containerOpener.open();
        } else {
            Minecraft.getInstance().setScreen(plainScreen.get());
        }
    }
}
