package dev.screenspec.runtime;

import net.minecraft.client.gui.Font;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.AbstractWidget;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceLocation;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Builds a real Minecraft {@link Screen} from a {@link ScreenSpec} exported by
 * the MC Screen Designer web tool.
 *
 * <p>Use the listener API to wire up behavior without subclassing:
 * <pre>{@code
 * SpecScreen screen = new SpecScreen(Component.literal("Options"), spec);
 * screen.on("save_btn",    (id, s, v) -> save());
 * screen.on("volume",      (id, s, v) -> setVolume((Double) v));
 * screen.on("close_btn",   (id, s, v) -> onClose());
 * Minecraft.getInstance().setScreen(screen);
 * }</pre>
 *
 * <p>{@code on(key)} matches both widget ids and declared {@code action} ids, so
 * a button with {@code "action": "my_mod:save"} in the JSON is caught by
 * {@code screen.on("my_mod:save", ...)} as well as by
 * {@code screen.on("save_btn", ...)}. The built-in action {@code "close"} closes
 * the screen automatically — no listener needed.
 *
 * <p>Subclassing is also supported; override {@link #onAction} instead:
 * <pre>{@code
 * public class MyOptionsScreen extends SpecScreen {
 *     public MyOptionsScreen(ScreenSpec spec) {
 *         super(Component.literal("My Options"), spec);
 *     }
 *
 *     protected void onAction(String widgetId, WidgetSpec spec, Object value) {
 *         if (widgetId.equals("save_button")) save();
 *     }
 * }
 * }</pre>
 */
public class SpecScreen extends Screen {
    private final ScreenSpec spec;
    private final Map<String, AbstractWidget> widgetsById = new LinkedHashMap<>();
    private final Map<String, List<String>> toggleGroups = new HashMap<>();
    private final Map<String, List<ActionListener>> listeners = new HashMap<>();
    private final List<ActionListener> globalListeners = new ArrayList<>();
    // resolved bound text for decoration widgets (label/icon) — cleared each frame
    private final Map<String, String> boundText = new HashMap<>();

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
     * Registers a listener for a specific widget id or action id.
     * When a widget fires, listeners are looked up by both the widget's {@code id}
     * and its {@code action} field (if set), so a single key can match either.
     *
     * @param key widget id (e.g. {@code "save_btn"}) or action id (e.g. {@code "my_mod:save"})
     */
    public SpecScreen on(String key, ActionListener listener) {
        listeners.computeIfAbsent(Objects.requireNonNull(key), k -> new ArrayList<>()).add(listener);
        return this;
    }

    /**
     * Registers a listener that fires for every widget action on this screen.
     */
    public SpecScreen onAny(ActionListener listener) {
        globalListeners.add(listener);
        return this;
    }

    /**
     * Called whenever a widget produces a value: a button press ({@code
     * value} is {@code null}), a toggle button's new selected state ({@code
     * Boolean}), a slider's new value ({@code Double}), or an input box's new
     * text ({@code String}). Override in subclasses to wire up behavior.
     */
    protected void onAction(String widgetId, WidgetSpec spec, Object value) {
    }

    /** Called for any {@code WidgetSpec.type} with no registered {@link WidgetFactory} and that isn't panel/label/icon. */
    protected void onUnknownWidgetType(WidgetSpec spec) {
    }

    /**
     * Qualifies a short id with the screen's {@code modId} namespace.
     * Ids that already contain {@code ':'} are returned unchanged.
     */
    private String qualify(String id) {
        if (id == null || id.contains(":") || spec.modId == null || spec.modId.isEmpty()) {
            return id;
        }
        return spec.modId + ":" + id;
    }

    void dispatchAction(String widgetId, WidgetSpec widgetSpec, Object value) {
        // built-in actions
        String action = qualify(widgetSpec.action);
        if ("close".equals(action)) {
            onClose();
            return;
        }

        // listeners keyed on the declared action id
        if (action != null && !action.isEmpty()) {
            List<ActionListener> byAction = listeners.get(action);
            if (byAction != null) {
                for (ActionListener l : byAction) l.on(widgetId, widgetSpec, value);
            }
        }

        // listeners keyed on the widget id
        List<ActionListener> byId = listeners.get(widgetId);
        if (byId != null) {
            for (ActionListener l : byId) l.on(widgetId, widgetSpec, value);
        }

        // global listeners
        for (ActionListener l : globalListeners) l.on(widgetId, widgetSpec, value);

        // subclass hook
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
        applyBindings();
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

    private void applyBindings() {
        boundText.clear();
        for (WidgetSpec w : spec.widgets) {
            if (w.bindings.isEmpty()) continue;
            for (Map.Entry<String, String> entry : w.bindings.entrySet()) {
                String target = entry.getKey();
                String value = DataRegistry.resolve(qualify(entry.getValue()));
                if (value == null) continue;
                switch (target) {
                    case "text" -> {
                        AbstractWidget widget = widgetsById.get(w.id);
                        if (widget != null) {
                            widget.setMessage(Component.literal(value));
                        } else {
                            boundText.put(w.id, value);
                        }
                    }
                    case "enabled" -> {
                        AbstractWidget widget = widgetsById.get(w.id);
                        if (widget != null) widget.active = Boolean.parseBoolean(value);
                    }
                    case "visible" -> {
                        AbstractWidget widget = widgetsById.get(w.id);
                        if (widget != null) widget.visible = Boolean.parseBoolean(value);
                    }
                }
            }
        }
    }

    /**
     * Draws a {@code panel} widget's background. Override to draw your mod's
     * actual panel texture per {@code style}.
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
        String text = boundText.getOrDefault(w.id, w.text);
        int textWidth = this.font.width(text);
        int x = switch (align) {
            case "center" -> w.x + (w.w - textWidth) / 2;
            case "right"  -> w.x + w.w - textWidth;
            default       -> w.x;
        };
        guiGraphics.drawString(this.font, text, x, w.y, color, shadow);
    }

    /**
     * Draws an {@code icon} widget. No-op by default; override
     * {@link #resolveIcon} to map an icon id to your mod's texture.
     */
    protected void renderIcon(GuiGraphics guiGraphics, WidgetSpec w) {
        ResourceLocation location = resolveIcon(w);
        if (location == null) {
            return;
        }
        int scale = w.propInt("scale", 1);
        guiGraphics.blit(RenderType::guiTextured, location, w.x, w.y, 0f, 0f, w.w * scale, w.h * scale, w.w * scale, w.h * scale);
    }

    /** Resolves an {@code icon} widget's {@code icon} id to a texture location. Returns {@code null} (no-op) by default. */
    protected ResourceLocation resolveIcon(WidgetSpec w) {
        return null;
    }
}
