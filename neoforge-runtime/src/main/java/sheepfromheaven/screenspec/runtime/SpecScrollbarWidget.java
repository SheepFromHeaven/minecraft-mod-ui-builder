package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.AbstractWidget;
import net.minecraft.client.gui.narration.NarrationElementOutput;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;

/**
 * A scrollbar bound to a {@link ScrollableSlotArea}, driven by a {@code scrollbar} WidgetSpec
 * whose {@code target} prop names the inventory area to scroll and whose {@code axis} prop
 * ({@code "y"}, the default, or {@code "x"}) picks vertical vs horizontal - mirroring the target
 * area's own {@link SlotAreaSpec#axis}. Renders vanilla's creative-inventory scroller sprite at
 * its real fixed size (12x15, rotated 90 degrees when horizontal) - the track never resizes it -
 * and drags full-travel with line-snapping, mirroring the MC Screen Designer's try mode.
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
    /** Width (or, if horizontal, height) used when {@link SpecContainerScreen} auto-attaches a scrollbar the designer didn't place. */
    static final int DEFAULT_WIDTH = 14;

    private final SpecContainerScreen<?> screen;
    private final ScrollableSlotArea target;
    private final boolean horizontal;
    private boolean dragging;
    // continuous pixel position during a drag (0–1); -1 means use the target's snapped line pct
    private double dragPct = -1;

    SpecScrollbarWidget(int x, int y, int w, int h, SpecContainerScreen<?> screen, ScrollableSlotArea target, boolean horizontal) {
        super(x, y, w, h, Component.empty());
        this.screen = screen;
        this.target = target;
        this.horizontal = horizontal;
    }

    private boolean scrollable() {
        return target != null && target.maxScrollRow() > 0;
    }

    /** Track length available to the thumb, along whichever axis this bar scrolls. */
    private int travel() {
        int trackLength = horizontal ? getWidth() : getHeight();
        // 1px inset at each end so the thumb never overlaps the track border
        return Math.max(1, trackLength - THUMB_H - 2);
    }

    private double currentPct() {
        // during a drag use the raw pixel pct so the thumb moves smoothly;
        // otherwise snap to the actual line position
        return (dragging && dragPct >= 0) ? dragPct : (target != null ? target.scrollPct() : 0);
    }

    private int thumbOffset() {
        int origin = horizontal ? getX() : getY();
        return origin + 1 + (int) Math.round(currentPct() * travel());
    }

    private void updateFromMouse(double mouseX, double mouseY) {
        if (target == null) return;
        double mousePos = horizontal ? mouseX : mouseY;
        double origin = horizontal ? getX() : getY();
        double rel = mousePos - origin - THUMB_H / 2.0;
        dragPct = Math.max(0, Math.min(1.0, rel / travel()));
        // content only advances when the threshold to the next line is crossed
        int line = (int) Math.round(dragPct * target.maxScrollRow());
        screen.sendScrollButton(target, line);
    }

    @Override
    public boolean mouseClicked(MouseButtonEvent event, boolean doubleClick) {
        if (event.button() != 0 || !this.active || !this.visible || !scrollable() || !isMouseOver(event.x(), event.y())) {
            return false;
        }
        dragging = true;
        updateFromMouse(event.x(), event.y());
        return true;
    }

    @Override
    public boolean mouseDragged(MouseButtonEvent event, double dragX, double dragY) {
        if (!dragging) {
            return false;
        }
        updateFromMouse(event.x(), event.y());
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

        Identifier sprite = scrollable() ? SCROLLER : SCROLLER_DISABLED;
        if (horizontal) {
            int thumbX = thumbOffset();
            int thumbY = getY() + (getHeight() - THUMB_W) / 2;
            // sprite is drawn for a vertical track; rotate it 90 degrees about the thumb's center to lay it on its side
            float cx = thumbX + THUMB_H / 2f;
            float cy = thumbY + THUMB_W / 2f;
            graphics.pose().pushMatrix();
            graphics.pose().translate(cx, cy);
            graphics.pose().rotate((float) Math.toRadians(90));
            graphics.blitSprite(RenderPipelines.GUI_TEXTURED, sprite, -THUMB_W / 2, -THUMB_H / 2, THUMB_W, THUMB_H);
            graphics.pose().popMatrix();
        } else {
            int thumbX = getX() + (getWidth() - THUMB_W) / 2;
            graphics.blitSprite(RenderPipelines.GUI_TEXTURED, sprite, thumbX, thumbOffset(), THUMB_W, THUMB_H);
        }
    }

    @Override
    protected void updateWidgetNarration(NarrationElementOutput output) {
    }
}
