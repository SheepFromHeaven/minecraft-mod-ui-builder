package sheepfromheaven.screenspec.runtime;

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
    protected void extractContents(GuiGraphicsExtractor graphics, int mouseX, int mouseY, float partialTicks) {
        extractDefaultSprite(graphics);
        extractDefaultLabel(graphics.textRendererForWidget(this, GuiGraphicsExtractor.HoveredTextEffects.NONE));
        if (selected) {
            graphics.fill(getX(), getY(), getX() + getWidth(), getY() + getHeight(), 0x665CD9FF);
            graphics.outline(getX(), getY(), getWidth(), getHeight(), 0xFF5CD9FF);
        }
    }
}
