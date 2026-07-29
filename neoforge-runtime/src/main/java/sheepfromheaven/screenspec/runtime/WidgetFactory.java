package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.components.AbstractWidget;

/** Builds a real Minecraft widget from a {@link WidgetSpec}. */
@FunctionalInterface
public interface WidgetFactory {
    AbstractWidget create(WidgetSpec spec, SpecScreen screen);
}
