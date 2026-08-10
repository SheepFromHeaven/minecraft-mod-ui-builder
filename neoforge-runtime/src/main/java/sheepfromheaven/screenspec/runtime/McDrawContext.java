package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.Font;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.resources.Identifier;

/** Adapts {@link GuiGraphics} to the version-neutral {@link DrawContext} interface. */
final class McDrawContext implements DrawContext {
    private final GuiGraphics g;

    McDrawContext(GuiGraphics g) {
        this.g = g;
    }

    @Override
    public void fill(int x1, int y1, int x2, int y2, int color) {
        g.fill(x1, y1, x2, y2, color);
    }

    @Override
    public void blitRegion(Identifier tex, int x, int y, float u, float v, int destW, int destH, int srcW, int srcH, int texW, int texH) {
        g.blit(RenderPipelines.GUI_TEXTURED, tex, x, y, u, v, destW, destH, srcW, srcH, texW, texH, -1);
    }

    @Override
    public void blitIcon(Identifier tex, int x, int y, int w, int h) {
        g.blit(RenderPipelines.GUI_TEXTURED, tex, x, y, 0f, 0f, w, h, w, h);
    }

    @Override
    public void drawText(Font font, String text, int x, int y, int color, boolean shadow) {
        g.drawString(font, text, x, y, color, shadow);
    }
}
