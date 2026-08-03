package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.GuiGraphics;

/**
 * Renders one mod-defined {@code custom} widget type at its reserved position/size. {@code x}/
 * {@code y} are already resolved to screen space (parent offsets applied); {@code widget.w}/
 * {@code widget.h} are the reserved size. Register via {@link CustomWidgetRegistry#register}.
 */
@FunctionalInterface
public interface CustomWidgetRenderer {
    void render(GuiGraphics graphics, WidgetSpec widget, int x, int y);
}
