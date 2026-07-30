package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.Font;
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
public class SpecContainerScreen<T extends AbstractContainerMenu> extends AbstractContainerScreen<T> implements ActionHost {
    private final ScreenSpec spec;
    private final ContainerSpec containerSpec;
    private final Map<String, ScrollableSlotArea> scrollableAreas;
    private final SpecWidgetRenderer renderer;
    private SpecWidgetBuilder builder;

    /**
     * Opens this screen by re-reading the spec JSON from disk on every open — use this constructor
     * during development so "Save to test mod" + reopen takes effect immediately without restarting
     * or triggering F3+T. Reads via the ClassLoader (which opens a fresh stream for directory
     * classpath entries in dev, bypassing the ResourceManager's in-memory cache). In production,
     * prefer the {@link #SpecContainerScreen(AbstractContainerMenu, Inventory, Component, ScreenSpec)}
     * overload with a {@code static final} spec.
     */
    public SpecContainerScreen(T menu, Inventory playerInventory, Component title, String namespace, String specName) {
        this(menu, playerInventory, title, ScreenSpecLoader.fromClasspath(namespace, specName));
    }

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

    private SpecWidgetBuilder builder() {
        if (builder == null) {
            builder = new SpecWidgetBuilder(spec, this, renderer,
                () -> leftPos, () -> topPos,
                this::addRenderableWidget,
                this::switchTab);
        }
        return builder;
    }

    /**
     * Sets the display text of a label widget, overriding the static {@code text} field from the
     * spec. Safe to call from {@link #render} each frame for live data.
     */
    protected void bindText(String widgetId, String text) {
        renderer.bindText(widgetId, text);
    }

    // --- ActionHost implementation ---

    @Override
    public void dispatchAction(String widgetId, WidgetSpec widgetSpec, Object value) {
        onAction(widgetId, widgetSpec, value);
    }

    @Override
    public void selectToggleGroup(String group, String selectedId) {
        builder().selectToggleGroup(group, selectedId);
    }

    @Override
    public Font getFont() {
        return this.font;
    }

    /**
     * Called whenever a widget fires an action (button press, toggle, slider, input).
     * Override in subclasses to wire up behavior — mirrors {@link SpecScreen#onAction}.
     */
    protected void onAction(String widgetId, WidgetSpec widgetSpec, Object value) {
    }

    /** Switches a {@code tabs} widget to the given child tab and rebuilds interactive widgets. */
    public void switchTab(String tabsWidgetId, String tabId) {
        if (tabId.equals(builder().activeTab(tabsWidgetId))) return;
        builder().setActiveTab(tabsWidgetId, tabId);
        this.clearWidgets();
        init();
    }

    @Override
    protected void init() {
        super.init();
        builder().build();
        syncAreaVisibility();
        Set<String> explicitTargets = new HashSet<>();
        for (WidgetSpec w : this.spec.widgets) {
            if (!w.type.equals("scrollbar") || !builder().isVisible(w)) continue;
            String targetId = w.prop("target", "");
            ScrollableSlotArea target = scrollableAreas.get(targetId);
            explicitTargets.add(targetId);
            // an explicitly-placed scrollbar still only shows up once its target actually overflows
            if (target != null && !target.scrollable()) continue;
            int[] origin = builder().originOf(w);
            addRenderableWidget(new SpecScrollbarWidget(origin[0], origin[1], w.w, w.h, this, target));
        }
        // no designer widget targets these — default to the area's right edge
        for (SlotAreaSpec area : this.containerSpec.slots) {
            if (!isAreaVisible(area.id)) continue;
            ScrollableSlotArea scrollArea = scrollableAreas.get(area.id);
            if (scrollArea == null || !scrollArea.scrollable() || explicitTargets.contains(area.id)) continue;
            int barX = leftPos + area.x + area.cols * area.slot_size;
            int barY = topPos + area.y;
            int barH = scrollArea.visibleRows() * area.slot_size;
            addRenderableWidget(new SpecScrollbarWidget(barX, barY, SpecScrollbarWidget.DEFAULT_WIDTH, barH, this, scrollArea));
        }
    }

    /**
     * If {@link #menu} implements {@link TabAwareAreaHost}, hides/shows each {@code inventory_area}
     * widget's slots to match the current tab state — otherwise vanilla would keep rendering an
     * inactive tab's slot items on top of whichever tab is actually showing (see {@link
     * SlotAreaVisibility}).
     */
    private void syncAreaVisibility() {
        if (!(this.menu instanceof TabAwareAreaHost host)) return;
        for (WidgetSpec w : this.spec.widgets) {
            if (!"inventory_area".equals(w.type)) continue;
            host.setAreaVisible(w.id, builder().isVisible(w));
        }
    }

    /** Whether {@code areaId}'s backing {@code inventory_area} widget is visible given the current tab state. */
    private boolean isAreaVisible(String areaId) {
        WidgetSpec w = builder().widgetSpec(areaId);
        return w == null || builder().isVisible(w);
    }

    /**
     * Draws the screen background: vanilla panel texture covering the full spec area, then
     * the tab-body panel, then explicit {@code panel} widgets, then slot grid borders.
     * Called by the MC rendering pipeline before interactive widgets and labels.
     */
    @Override
    public void renderBg(GuiGraphics graphics, float partialTick, int mouseX, int mouseY) {
        boolean hasTabs = this.spec.widgets.stream().anyMatch(w -> w.type.equals("tabs"));
        if (!hasTabs) renderer.renderVanillaPanel(graphics, leftPos, topPos, imageWidth, imageHeight);
        for (WidgetSpec w : this.spec.widgets) {
            if (!w.type.equals("tabs")) continue;
            // Inactive tabs render beneath the body panel (extended by the bevel so their bottom
            // edge tucks behind it) — vanilla creative-inventory layering. The active tab's sprite
            // is drawn by its TabButtonWidget, on top of the panel.
            builder().forEachTab(w, (tab, pos, active, x, y, tw, th) -> {
                if (!active) renderer.renderTab(graphics, false, pos, x, y, tw, th + SpecWidgetBuilder.TAB_OVERLAP);
            });
            renderTabBody(graphics, w);
        }
        for (WidgetSpec w : this.spec.widgets) {
            if (w.type.equals("panel") && builder().isVisible(w)) renderPanel(graphics, w);
        }
        for (SlotAreaSpec area : this.containerSpec.slots) {
            if (isAreaVisible(area.id)) drawSlotGrid(graphics, area);
        }
    }

    /** Draws the raised-panel bevel for the body area below a {@code tabs} widget's header row. */
    protected void renderTabBody(GuiGraphics graphics, WidgetSpec tabsWidget) {
        int[] origin = builder().originOf(tabsWidget);
        int tabHeight = tabsWidget.propInt("tab_height", 20);
        renderer.renderVanillaPanel(graphics, origin[0], origin[1] + tabHeight, tabsWidget.w, tabsWidget.h - tabHeight);
    }

    /**
     * Renders spec {@code label} and {@code icon} widgets (and suppresses vanilla's automatic
     * title/"Inventory" text). Called by {@link AbstractContainerScreen} already inside a
     * {@code pose().translate(leftPos, topPos)} block, so all coordinates here must be
     * screen-relative (0,0 = screen top-left corner).
     */
    @Override
    protected void renderLabels(GuiGraphics graphics, int mouseX, int mouseY) {
        renderer.refreshBoundText();
        for (WidgetSpec w : builder().visibleWidgets()) {
            int[] o = builder().originOf(w);
            int rx = o[0] - this.leftPos;
            int ry = o[1] - this.topPos;
            if (w.type.equals("label"))     renderer.renderLabel(graphics, this.font, w, rx, ry);
            else if (w.type.equals("icon")) renderer.renderIcon(graphics, w, rx, ry, this::resolveIcon);
        }
    }

    @Override
    public boolean mouseScrolled(double mouseX, double mouseY, double scrollX, double scrollY) {
        for (SlotAreaSpec area : this.containerSpec.slots) {
            if (!isAreaVisible(area.id)) continue;
            ScrollableSlotArea scrollArea = scrollableAreas.get(area.id);
            if (scrollArea == null) continue;
            int x = leftPos + area.x, y = topPos + area.y;
            int w = area.cols * area.slot_size, h = scrollArea.visibleRows() * area.slot_size;
            if (mouseX >= x && mouseX < x + w && mouseY >= y && mouseY < y + h) {
                sendScrollButton(scrollArea, scrollArea.scrollRow() - (int) Math.signum(scrollY));
                return true;
            }
        }
        return super.mouseScrolled(mouseX, mouseY, scrollX, scrollY);
    }

    /**
     * Applies a scroll locally (for instant feedback) and networks it to the server.
     * Called by {@link SpecScrollbarWidget} and {@link #mouseScrolled}; not meant for mod code.
     */
    void sendScrollButton(ScrollableSlotArea area, int row) {
        int id = SpecScroll.encode(this.containerSpec, area.area().id, row);
        this.menu.clickMenuButton(this.minecraft.player, id);
        this.minecraft.gameMode.handleInventoryButtonClick(this.menu.containerId, id);
    }

    /**
     * Draws a vanilla-styled slot grid for {@code area}. Row count comes from
     * {@link ScrollableSlotArea#visibleRows()} when scrollable, otherwise {@code area.viewport_rows}.
     */
    protected void drawSlotGrid(GuiGraphics graphics, SlotAreaSpec area) {
        int x = leftPos + area.x;
        int y = topPos + area.y;
        ScrollableSlotArea scrollArea = scrollableAreas.get(area.id);
        int rows = scrollArea != null ? scrollArea.visibleRows() : area.viewport_rows;
        int size = area.slot_size;
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < area.cols; col++) {
                int sx = x + col * size;
                int sy = y + row * size;
                graphics.fill(sx,            sy,            sx + size,     sy + 1,        0xFF373737);
                graphics.fill(sx,            sy,            sx + 1,        sy + size,     0xFF373737);
                graphics.fill(sx,            sy + size - 1, sx + size,     sy + size,     0xFFFFFFFF);
                graphics.fill(sx + size - 1, sy,            sx + size,     sy + size,     0xFFFFFFFF);
                graphics.fill(sx + 1,        sy + 1,        sx + size - 1, sy + size - 1, 0xFF8B8B8B);
            }
        }
    }

    protected void renderPanel(GuiGraphics graphics, WidgetSpec w) {
        int[] o = builder().originOf(w);
        renderer.renderPanel(graphics, w, o[0], o[1]);
    }

    protected void renderLabel(GuiGraphics graphics, WidgetSpec w) {
        int[] o = builder().originOf(w);
        renderer.renderLabel(graphics, this.font, w, o[0], o[1]);
    }

    protected void renderIcon(GuiGraphics graphics, WidgetSpec w) {
        int[] o = builder().originOf(w);
        renderer.renderIcon(graphics, w, o[0], o[1], this::resolveIcon);
    }

    /** Resolves an {@code icon} widget's {@code icon} id to a texture location. Returns {@code null} (no-op) by default. */
    protected Identifier resolveIcon(WidgetSpec w) {
        return null;
    }
}
