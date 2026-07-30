package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.inventory.AbstractContainerScreen;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.inventory.AbstractContainerMenu;

import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Builds a real Minecraft {@link AbstractContainerScreen} - one with player-placeable inventory
 * slots - from a {@link ScreenSpec} whose {@code container} field is set. Counterpart to
 * {@link SpecScreen} for screens that need slots; see that class for the plain, slotless case.
 *
 * <p>The mod still writes its own {@code AbstractContainerMenu} subclass and registers a
 * {@code MenuType} for it (this library only renders - see the {@code container/menu system} note
 * in the README) - build its slots with {@link SpecSlots} so the same {@link SlotAreaSpec} layout
 * drives both the server-side slot positions and the background this class draws:
 *
 * <pre>{@code
 * public class MyScreen extends SpecContainerScreen<MyMenu> {
 *     public MyScreen(MyMenu menu, Inventory playerInventory, Component title, ScreenSpec spec) {
 *         super(menu, playerInventory, title, spec);
 *     }
 * }
 * }</pre>
 */
public class SpecContainerScreen<T extends AbstractContainerMenu> extends AbstractContainerScreen<T> {
    private final ScreenSpec spec;
    private final ContainerSpec containerSpec;
    private final Map<String, ScrollableSlotArea> scrollableAreas;
    private final SpecWidgetRenderer renderer;

    public SpecContainerScreen(T menu, Inventory playerInventory, Component title, ScreenSpec spec) {
        super(menu, playerInventory, title);
        this.spec = spec;
        this.containerSpec = Objects.requireNonNull(spec.container, "spec.container is null - use SpecScreen for slotless screens");
        this.scrollableAreas = menu instanceof ScrollableAreaHost host ? host.scrollableAreas() : Map.of();
        this.renderer = new SpecWidgetRenderer(spec);
        this.imageWidth = spec.width;
        this.imageHeight = spec.height;
        this.inventoryLabelY = this.imageHeight - 94;
    }

    /**
     * Sets the display text of a label widget, overriding the static {@code text} field from the
     * spec. Safe to call from {@link #render} each frame for live data - mirrors {@link SpecScreen#bindText}.
     */
    protected void bindText(String widgetId, String text) {
        renderer.bindText(widgetId, text);
    }

    @Override
    protected void init() {
        super.init();
        Set<String> explicitTargets = new HashSet<>();
        for (WidgetSpec w : this.spec.widgets) {
            if (!w.type.equals("scrollbar")) {
                continue;
            }
            String targetId = w.prop("target", "");
            ScrollableSlotArea target = scrollableAreas.get(targetId);
            explicitTargets.add(targetId);
            // an explicitly-placed scrollbar still only shows up once its target actually overflows
            if (target != null && !target.scrollable()) {
                continue;
            }
            // the target's own axis is the source of truth once it resolves; the widget's prop only matters standalone
            boolean horizontal = target != null ? target.horizontal() : "x".equals(w.prop("axis", "y"));
            addRenderableWidget(new SpecScrollbarWidget(leftPos + w.x, topPos + w.y, w.w, w.h, this, target, horizontal));
        }
        // no designer widget targets these, but they turned out to need one anyway - default to the area's right (or bottom) edge
        for (SlotAreaSpec area : this.containerSpec.slots) {
            ScrollableSlotArea scrollArea = scrollableAreas.get(area.id);
            if (scrollArea == null || !scrollArea.scrollable() || explicitTargets.contains(area.id)) {
                continue;
            }
            boolean horizontal = scrollArea.horizontal();
            int gridW = scrollArea.visibleCols() * area.slot_size;
            int gridH = scrollArea.visibleRows() * area.slot_size;
            int barX, barY, barW, barH;
            if (horizontal) {
                barX = leftPos + area.x;
                barY = topPos + area.y + gridH;
                barW = gridW;
                barH = SpecScrollbarWidget.DEFAULT_WIDTH;
            } else {
                barX = leftPos + area.x + gridW;
                barY = topPos + area.y;
                barW = SpecScrollbarWidget.DEFAULT_WIDTH;
                barH = gridH;
            }
            addRenderableWidget(new SpecScrollbarWidget(barX, barY, barW, barH, this, scrollArea, horizontal));
        }
    }

    @Override
    protected void renderBg(GuiGraphics graphics, float partialTick, int mouseX, int mouseY) {
        graphics.fill(leftPos, topPos, leftPos + imageWidth, topPos + imageHeight, 0xFFC6C6C6);
        // panels before slot grids: a full-screen panel fill would otherwise overwrite the slot borders
        for (WidgetSpec w : this.spec.widgets) {
            if (w.type.equals("panel")) {
                renderPanel(graphics, w);
            }
        }
        for (SlotAreaSpec area : this.containerSpec.slots) {
            drawSlotGrid(graphics, area);
        }
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
        renderer.refreshBoundText();
        super.render(graphics, mouseX, mouseY, partialTick);
        for (WidgetSpec w : this.spec.widgets) {
            if (w.type.equals("label")) {
                renderLabel(graphics, w);
            } else if (w.type.equals("icon")) {
                renderIcon(graphics, w);
            }
        }
    }

    @Override
    public boolean mouseScrolled(double mouseX, double mouseY, double scrollX, double scrollY) {
        for (SlotAreaSpec area : this.containerSpec.slots) {
            ScrollableSlotArea scrollArea = scrollableAreas.get(area.id);
            if (scrollArea == null) {
                continue;
            }
            int x = leftPos + area.x, y = topPos + area.y;
            int w = scrollArea.visibleCols() * area.slot_size, h = scrollArea.visibleRows() * area.slot_size;
            if (mouseX >= x && mouseX < x + w && mouseY >= y && mouseY < y + h) {
                sendScrollButton(scrollArea, scrollArea.scrollRow() - (int) Math.signum(scrollY));
                return true;
            }
        }
        return super.mouseScrolled(mouseX, mouseY, scrollX, scrollY);
    }

    /**
     * Applies a scroll locally (for instant feedback) and networks it to the server so its copy of
     * {@code area} stays in sync - see {@link SpecScroll}. Called by {@link SpecScrollbarWidget}
     * and this screen's own {@link #mouseScrolled} handling; not meant for mod code to call.
     */
    void sendScrollButton(ScrollableSlotArea area, int row) {
        int id = SpecScroll.encode(this.containerSpec, area.area().id, row);
        this.menu.clickMenuButton(this.minecraft.player, id);
        this.minecraft.gameMode.handleInventoryButtonClick(this.menu.containerId, id);
    }

    /**
     * Draws a vanilla-styled slot grid for {@code area} by cropping {@code area.cols x} its row
     * count straight out of the vanilla chest texture's own slot grid, so borders between adjacent
     * cells line up exactly like a real container screen's - no per-cell art needed. For an area
     * registered via {@link ScrollableAreaHost}, the row count is {@link ScrollableSlotArea#visibleRows()}
     * (derived from the real container, which may be smaller than the designed viewport); rows
     * scrolled out of view are cropped away here and their slots moved off-screen by that class.
     * Otherwise (a fixed-size area built with {@link SpecSlots#forArea}) it's {@code area.viewport_rows} directly.
     */
    protected void drawSlotGrid(GuiGraphics graphics, SlotAreaSpec area) {
        int x = leftPos + area.x;
        int y = topPos + area.y;
        ScrollableSlotArea scrollArea = scrollableAreas.get(area.id);
        int rows = scrollArea != null ? scrollArea.visibleRows() : area.viewport_rows;
        int cols = scrollArea != null ? scrollArea.visibleCols() : area.cols;
        int size = area.slot_size;
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < cols; col++) {
                int sx = x + col * size;
                int sy = y + row * size;
                graphics.fill(sx,          sy,          sx + size, sy + 1,    0xFF373737); // top dark
                graphics.fill(sx,          sy,          sx + 1,    sy + size, 0xFF373737); // left dark
                graphics.fill(sx,          sy + size - 1, sx + size, sy + size, 0xFFFFFFFF); // bottom light
                graphics.fill(sx + size - 1, sy,        sx + size, sy + size, 0xFFFFFFFF); // right light
                graphics.fill(sx + 1,      sy + 1,      sx + size - 1, sy + size - 1, 0xFF8B8B8B); // interior
            }
        }
    }

    /**
     * Draws a {@code panel} widget using the same nine-slice sprite as {@link SpecScreen#renderPanel}
     * - see {@link SpecWidgetRenderer}. Override for custom textures per {@code style}.
     */
    protected void renderPanel(GuiGraphics graphics, WidgetSpec w) {
        renderer.renderPanel(graphics, w, leftPos + w.x, topPos + w.y);
    }

    /**
     * Draws a {@code label} widget's text, honoring the {@code color}, {@code shadow} and
     * {@code align} props from the designer and this widget's bound/pinned text, same as
     * {@link SpecScreen#renderLabel}.
     */
    protected void renderLabel(GuiGraphics graphics, WidgetSpec w) {
        renderer.renderLabel(graphics, this.font, w, leftPos + w.x, topPos + w.y);
    }

    /**
     * Draws an {@code icon} widget. No-op by default; override {@link #resolveIcon} to map an icon
     * id to your mod's texture, same as {@link SpecScreen#renderIcon}.
     */
    protected void renderIcon(GuiGraphics graphics, WidgetSpec w) {
        renderer.renderIcon(graphics, w, leftPos + w.x, topPos + w.y, this::resolveIcon);
    }

    /** Resolves an {@code icon} widget's {@code icon} id to a texture location. Returns {@code null} (no-op) by default. */
    protected Identifier resolveIcon(WidgetSpec w) {
        return null;
    }
}
