package dev.screenspec.runtime;

import net.minecraft.client.gui.Font;
import net.minecraft.client.gui.GuiGraphicsExtractor;
import net.minecraft.client.gui.TextAlignment;
import net.minecraft.client.gui.components.AbstractWidget;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;

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
     * text ({@code String}). Override to wire up behavior.
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
    public void extractRenderState(GuiGraphicsExtractor extractor, int mouseX, int mouseY, float partialTick) {
        for (WidgetSpec w : spec.widgets) {
            if (w.type.equals("panel")) {
                renderPanel(extractor, w);
            }
        }
        super.extractRenderState(extractor, mouseX, mouseY, partialTick);
        for (WidgetSpec w : spec.widgets) {
            if (w.type.equals("label")) {
                renderLabel(extractor, w);
            } else if (w.type.equals("icon")) {
                renderIcon(extractor, w);
            }
        }
    }

    /**
     * Draws a {@code panel} widget's background. Override to draw your mod's
     * actual panel texture per {@code style}.
     */
    protected void renderPanel(GuiGraphicsExtractor extractor, WidgetSpec w) {
        String style = w.prop("style", "default");
        if (style.equals("transparent")) {
            return;
        }
        int fill = style.equals("dark") ? 0xF0000000 : 0xC0101010;
        extractor.fill(w.x, w.y, w.x + w.w, w.y + w.h, fill);
        renderOutline(extractor, w.x, w.y, w.w, w.h, 0xFF8B8B8B);
    }

    /**
     * Draws a {@code label} widget's text, honoring the {@code color},
     * {@code shadow} and {@code align} props from the designer.
     */
    protected void renderLabel(GuiGraphicsExtractor extractor, WidgetSpec w) {
        int color = w.propInt("color", 0x404040);
        boolean shadow = w.propBoolean("shadow", false);
        String align = w.prop("align", "left");

        TextAlignment textAlign = switch (align) {
            case "center" -> TextAlignment.CENTER;
            case "right"  -> TextAlignment.RIGHT;
            default       -> TextAlignment.LEFT;
        };

        Component text = Component.literal(w.text).withStyle(s -> s.withColor(color).withBold(shadow));
        extractor.textRenderer().accept(textAlign, w.x, w.y, text);
    }

    /**
     * Draws an {@code icon} widget. No-op by default since icon artwork is
     * mod-specific; override (or override {@link #resolveIcon}) to blit your
     * mod's texture.
     */
    protected void renderIcon(GuiGraphicsExtractor extractor, WidgetSpec w) {
        Identifier location = resolveIcon(w);
        if (location == null) {
            return;
        }
        int scale = w.propInt("scale", 1);
        extractor.blit(location, w.x, w.y, w.w * scale, w.h * scale, 0f, 0f, w.w, w.h);
    }

    /** Resolves an {@code icon} widget's {@code icon} id to a texture location. Returns {@code null} (no-op) by default. */
    protected Identifier resolveIcon(WidgetSpec w) {
        return null;
    }

    private static void renderOutline(GuiGraphicsExtractor extractor, int x, int y, int w, int h, int color) {
        extractor.fill(x,         y,         x + w,     y + 1,     color);
        extractor.fill(x,         y + h - 1, x + w,     y + h,     color);
        extractor.fill(x,         y + 1,     x + 1,     y + h - 1, color);
        extractor.fill(x + w - 1, y + 1,     x + w,     y + h - 1, color);
    }
}
