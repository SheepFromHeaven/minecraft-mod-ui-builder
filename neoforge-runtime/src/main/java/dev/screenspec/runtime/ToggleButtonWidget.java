package dev.screenspec.runtime;

import net.minecraft.client.gui.GuiGraphics;
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
    protected void renderWidget(GuiGraphics guiGraphics, int mouseX, int mouseY, float partialTick) {
        super.renderWidget(guiGraphics, mouseX, mouseY, partialTick);
        if (selected) {
            guiGraphics.fill(getX(), getY(), getX() + getWidth(), getY() + getHeight(), 0x665CD9FF);
            guiGraphics.renderOutline(getX(), getY(), getWidth(), getHeight(), 0xFF5CD9FF);
        }
    }
}
