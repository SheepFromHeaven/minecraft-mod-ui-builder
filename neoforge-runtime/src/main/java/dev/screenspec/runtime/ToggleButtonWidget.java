package dev.screenspec.runtime;

import net.minecraft.client.gui.GuiGraphicsExtractor;
import net.minecraft.client.gui.components.Button;

/** A {@link Button} that additionally tracks a pressed/selected visual state. */
final class ToggleButtonWidget extends Button {
    private boolean selected;

    ToggleButtonWidget(Button.Builder builder) {
        super(builder);
    }

    void setSelected(boolean selected) {
        this.selected = selected;
    }

    boolean isSelected() {
        return selected;
    }

    @Override
    protected void extractContents(GuiGraphicsExtractor extractor, int mouseX, int mouseY, float partialTick) {
        extractDefaultSprite(extractor);
        if (selected) {
            extractor.fill(getX(), getY(), getX() + getWidth(), getY() + getHeight(), 0x665CD9FF);
            renderOutline(extractor, getX(), getY(), getWidth(), getHeight(), 0xFF5CD9FF);
        }
    }

    private static void renderOutline(GuiGraphicsExtractor extractor, int x, int y, int w, int h, int color) {
        extractor.fill(x,         y,         x + w,     y + 1,     color);
        extractor.fill(x,         y + h - 1, x + w,     y + h,     color);
        extractor.fill(x,         y + 1,     x + 1,     y + h - 1, color);
        extractor.fill(x + w - 1, y + 1,     x + w,     y + h - 1, color);
    }
}
