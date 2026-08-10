package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.Font;
import net.minecraft.resources.Identifier;

/**
 * Version-neutral drawing surface passed to {@link SpecWidgetRenderer} methods. The single
 * MC-version-specific class ({@code GuiGraphics} in 1.21.1, {@code GuiGraphicsExtractor} in
 * 26.2+) is wrapped at the boundary in {@link McDrawContext}, keeping the renderer free of
 * MC-version imports.
 */
interface DrawContext {
    void fill(int x1, int y1, int x2, int y2, int color);

    /** Blits a texture region (for nine-slicing). */
    void blitRegion(Identifier tex, int x, int y, float u, float v, int destW, int destH, int srcW, int srcH, int texW, int texH);

    /** Blits a full texture scaled to the given size (for icons and sprites). */
    void blitIcon(Identifier tex, int x, int y, int w, int h);

    void drawText(Font font, String text, int x, int y, int color, boolean shadow);
}
