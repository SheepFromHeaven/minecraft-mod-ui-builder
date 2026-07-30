package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.AbstractWidget;
import net.minecraft.client.gui.narration.NarrationElementOutput;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;

/**
 * A vertical scrollbar bound to a {@link ScrollableSlotArea}, driven by a {@code scrollbar}
 * WidgetSpec whose {@code target} prop names the inventory area to scroll. Renders vanilla's
 * creative-inventory scroller sprite at its real fixed size (12x15) - the track never resizes
 * it - and drags full-travel with row-snapping, mirroring the MC Screen Designer's try mode.
 *
 * <p>Built by {@link SpecContainerScreen}, which is also the only class allowed to call
 * {@link SpecContainerScreen#sendScrollButton}, since that's what keeps the server's copy of the
 * target's {@link ScrollableSlotArea} in sync (see {@link SpecScroll}).
 */
final class SpecScrollbarWidget extends AbstractWidget {
    private static final Identifier SCROLLER = Identifier.withDefaultNamespace("container/creative_inventory/scroller");
    private static final Identifier SCROLLER_DISABLED = Identifier.withDefaultNamespace("container/creative_inventory/scroller_disabled");
    private static final int THUMB_W = 12;
    private static final int THUMB_H = 15;
    /** Width used when {@link SpecContainerScreen} auto-attaches a scrollbar the designer didn't place. */
    static final int DEFAULT_WIDTH = 14;

    private final SpecContainerScreen<?> screen;
    private final ScrollableSlotArea target;
    private boolean dragging;
    // continuous pixel position during a drag (0–1); -1 means use the target's snapped row pct
    private double dragPct = -1;

    SpecScrollbarWidget(int x, int y, int w, int h, SpecContainerScreen<?> screen, ScrollableSlotArea target) {
        super(x, y, w, h, Component.empty());
        this.screen = screen;
        this.target = target;
    }

    private boolean scrollable() {
        return target != null && target.maxScrollRow() > 0;
    }

    private int travel() {
        // 1px inset at each end so the thumb never overlaps the track border
        return Math.max(1, getHeight() - THUMB_H - 2);
    }

    private int thumbTop() {
        // during a drag use the raw pixel pct so the thumb moves smoothly;
        // otherwise snap to the actual row position
        double pct = (dragging && dragPct >= 0) ? dragPct : (target != null ? target.scrollPct() : 0);
        return getY() + 1 + (int) Math.round(pct * travel());
    }

    private void updateFromMouseY(double mouseY) {
        if (target == null) return;
        double rel = mouseY - getY() - THUMB_H / 2.0;
        dragPct = Math.max(0, Math.min(1.0, rel / travel()));
        // content only advances when the threshold to the next row is crossed
        int row = (int) Math.round(dragPct * target.maxScrollRow());
        screen.sendScrollButton(target, row);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        if (event.button() != 0 || !this.active || !this.visible || !scrollable() || !isMouseOver(event.x(), event.y())) {
            return false;
        }
        dragging = true;
        updateFromMouseY(event.y());
        return true;
    }

    @Override
    public boolean mouseDragged(MouseButtonEvent event, double dragX, double dragY) {
        if (!dragging) {
            return false;
        }
        updateFromMouseY(event.y());
        return true;
    }

    @Override
    public boolean mouseReleased(MouseButtonEvent event) {
        boolean was = dragging;
        dragging = false;
        dragPct = -1;
        return was;
    }

    @Override
    public boolean mouseScrolled(double mouseX, double mouseY, double scrollX, double scrollY) {
        if (!scrollable() || !isMouseOver(mouseX, mouseY)) {
            return false;
        }
        screen.sendScrollButton(target, target.scrollRow() - (int) Math.signum(scrollY));
        return true;
    }

    @Override
    protected void renderWidget(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
        // same bevel as a slot cell (matches webapp's mc_slot_tile.png border-image on the track)
        int x = getX(), y = getY(), r = x + getWidth(), b = y + getHeight();
        graphics.fill(x,     y,     r,     y + 1, 0xFF373737); // top dark
        graphics.fill(x,     y,     x + 1, b,     0xFF373737); // left dark
        graphics.fill(x,     b - 1, r,     b,     0xFFFFFFFF); // bottom light
        graphics.fill(r - 1, y,     r,     b,     0xFFFFFFFF); // right light
        graphics.fill(x + 1, y + 1, r - 1, b - 1, 0xFF8B8B8B); // interior

        int thumbX = getX() + (getWidth() - THUMB_W) / 2;
        Identifier sprite = scrollable() ? SCROLLER : SCROLLER_DISABLED;
        graphics.blitSprite(RenderPipelines.GUI_TEXTURED, sprite, thumbX, thumbTop(), THUMB_W, THUMB_H);
    }

    @Override
    protected void updateWidgetNarration(NarrationElementOutput output) {
    }
}
