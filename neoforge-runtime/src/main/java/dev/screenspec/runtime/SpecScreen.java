package dev.screenspec.runtime;

import net.minecraft.client.gui.Font;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.AbstractWidget;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds a real Minecraft {@link Screen} from a {@link ScreenSpec} exported by
 * the MC Screen Designer web tool. Subclass it and override {@link #onAction}
 * to wire up behavior; look widgets up by the id assigned in the designer via
 * {@link #getWidget}.
 * <pre>{@code
 * public class MyOptionsScreen extends SpecScreen {
 *     public MyOptionsScreen(ScreenSpec spec) {
 *         super(Component.literal("My Options"), spec);
 *     }
 *
 *     protected void onAction(String widgetId, WidgetSpec spec, Object value) {
 *         if (widgetId.equals("save_button")) {
 *             // ...
 *         }
 *     }
 * }
 * }</pre>
 */
public abstract class SpecScreen extends Screen {
    private final ScreenSpec spec;
    private final Map<String, AbstractWidget> widgetsById = new LinkedHashMap<>();
    private final Map<String, List<String>> toggleGroups = new HashMap<>();

    protected SpecScreen(Component title, ScreenSpec spec) {
        super(title);
        this.spec = spec;
    }

    public ScreenSpec spec() {
        return spec;
    }

    public Font getFont() {
        return this.font;
    }

    @SuppressWarnings("unchecked")
    public <T extends AbstractWidget> T getWidget(String id) {
        return (T) widgetsById.get(id);
    }

    /**
     * Called whenever a widget produces a value: a button press ({@code
     * value} is {@code null}), a toggle button's new selected state ({@code
     * Boolean}), a slider's new value ({@code Double}), or an input box's new
     * text ({@code String}). Override to wire up behavior; the widget id is
     * whatever was assigned to it in the designer.
     */
    protected void onAction(String widgetId, WidgetSpec spec, Object value) {
    }

    /** Called for any {@code WidgetSpec.type} with no registered {@link WidgetFactory} and that isn't panel/label/icon. */
    protected void onUnknownWidgetType(WidgetSpec spec) {
    }

    void dispatchAction(String widgetId, WidgetSpec widgetSpec, Object value) {
        onAction(widgetId, widgetSpec, value);
    }

    void selectToggleGroup(String group, String selectedId) {
        for (String memberId : toggleGroups.getOrDefault(group, List.of())) {
            if (widgetsById.get(memberId) instanceof ToggleButtonWidget toggle) {
                toggle.setSelected(memberId.equals(selectedId));
            }
        }
    }

    @Override
    protected void init() {
        widgetsById.clear();
        toggleGroups.clear();
        for (WidgetSpec w : spec.widgets) {
            if (w.type.equals("panel") || w.type.equals("label") || w.type.equals("icon")) {
                continue;
            }
            WidgetFactory factory = WidgetFactories.get(w.type);
            if (factory == null) {
                onUnknownWidgetType(w);
                continue;
            }
            AbstractWidget widget = addRenderableWidget(factory.create(w, this));
            widgetsById.put(w.id, widget);
            if (w.type.equals("toggle_button")) {
                String group = w.prop("group", "");
                if (!group.isEmpty()) {
                    toggleGroups.computeIfAbsent(group, g -> new ArrayList<>()).add(w.id);
                }
            }
        }
    }

    @Override
    public void render(GuiGraphics guiGraphics, int mouseX, int mouseY, float partialTick) {
        for (WidgetSpec w : spec.widgets) {
            if (w.type.equals("panel")) {
                renderPanel(guiGraphics, w);
            }
        }
        super.render(guiGraphics, mouseX, mouseY, partialTick);
        for (WidgetSpec w : spec.widgets) {
            if (w.type.equals("label")) {
                renderLabel(guiGraphics, w);
            } else if (w.type.equals("icon")) {
                renderIcon(guiGraphics, w);
            }
        }
    }

    /**
     * Draws a {@code panel} widget's background. The default is a flat,
     * loader-neutral box so screens render sensibly out of the box; override
     * to draw your mod's actual panel texture per {@code style}.
     */
    protected void renderPanel(GuiGraphics guiGraphics, WidgetSpec w) {
        String style = w.prop("style", "default");
        if (style.equals("transparent")) {
            return;
        }
        int fill = style.equals("dark") ? 0xF0000000 : 0xC0101010;
        guiGraphics.fill(w.x, w.y, w.x + w.w, w.y + w.h, fill);
        guiGraphics.renderOutline(w.x, w.y, w.w, w.h, 0xFF8B8B8B);
    }

    /**
     * Draws a {@code label} widget's text, honoring the {@code color},
     * {@code shadow} and {@code align} props from the designer.
     */
    protected void renderLabel(GuiGraphics guiGraphics, WidgetSpec w) {
        int color = w.propInt("color", 0x404040);
        boolean shadow = w.propBoolean("shadow", false);
        String align = w.prop("align", "left");
        int textWidth = this.font.width(w.text);
        int x = switch (align) {
            case "center" -> w.x + (w.w - textWidth) / 2;
            case "right" -> w.x + w.w - textWidth;
            default -> w.x;
        };
        guiGraphics.drawString(this.font, w.text, x, w.y, color, shadow);
    }

    /**
     * Draws an {@code icon} widget. No-op by default since icon artwork is
     * mod-specific; override (or override {@link #resolveIcon}) to blit your
     * mod's texture atlas.
     */
    protected void renderIcon(GuiGraphics guiGraphics, WidgetSpec w) {
        var location = resolveIcon(w);
        if (location == null) {
            return;
        }
        int scale = w.propInt("scale", 1);
        guiGraphics.blit(location, w.x, w.y, 0, 0, w.w * scale, w.h * scale, w.w * scale, w.h * scale);
    }

    /** Resolves an {@code icon} widget's {@code icon} id to a texture location. Returns {@code null} (no-op) by default. */
    protected net.minecraft.resources.ResourceLocation resolveIcon(WidgetSpec w) {
        return null;
    }
}
