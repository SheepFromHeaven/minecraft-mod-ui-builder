package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.Font;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.components.AbstractWidget;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;

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
 * <p>{@code on(key)} matches both widget ids and declared {@code action} ids.
 * Action ids are qualified at runtime: a widget with {@code "action": "save"}
 * and a spec with {@code modId = "my_mod"} fires as {@code "my_mod.save"}.
 * Prefer {@link #onDeclaredAction} for validated, schema-checked registration.
 * The built-in action {@code "close"} closes the screen automatically — no
 * listener needed.
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
    // subclass-driven text overrides — NOT cleared each frame; take priority over boundText
    private final Map<String, String> pinnedText = new HashMap<>();
    // centering offset — recalculated in init() each time the screen is (re)sized
    private int originX;
    private int originY;

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

    /**
     * Sets the display text of a label widget, overriding the static {@code text}
     * field from the spec. Safe to call from {@link #render} each frame for live data.
     */
    protected void bindText(String widgetId, String text) {
        pinnedText.put(widgetId, text);
    }

    /** Called for any {@code WidgetSpec.type} with no registered {@link WidgetFactory} and that isn't panel/label/icon. */
    protected void onUnknownWidgetType(WidgetSpec spec) {
    }

    /**
     * Qualifies a short id with the screen's {@code modId} namespace using
     * a {@code "."} separator (e.g. {@code "save"} → {@code "my_mod.save"}).
     * Ids that are {@code null}, empty, already contain {@code "."}, or whose
     * spec has no {@code modId} are returned unchanged.
     */
    private String qualify(String id) {
        if (id == null || id.isEmpty() || id.contains(".") || spec.modId == null || spec.modId.isEmpty()) {
            return id;
        }
        return spec.modId + "." + id;
    }

    /**
     * Registers a validated listener for a declared action id. Throws
     * {@link IllegalArgumentException} at startup time if {@code localAction}
     * is not listed in {@link ScreenSpec#actions}, catching misconfiguration
     * before the game runs.
     *
     * <pre>{@code
     * // spec has modId="my_mod", actions contains "save"
     * screen.onDeclaredAction("save", (id, s, v) -> save());
     * // listens for "my_mod.save"; throws if "save" not in spec.actions
     * }</pre>
     *
     * @param localAction unscoped action name as declared in the designer
     */
    public SpecScreen onDeclaredAction(String localAction, ActionListener listener) {
        java.util.Set<String> known = spec.knownActions();
        if (!known.isEmpty() && !known.contains(localAction)) {
            throw new IllegalArgumentException(
                "Action \"" + localAction + "\" is not declared in screen \""
                + spec.id + "\". Known actions: " + known
            );
        }
        return on(qualify(localAction), listener);
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
        originX = (this.width  - spec.width)  / 2;
        originY = (this.height - spec.height) / 2;
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
            widget.setX(w.x + originX);
            widget.setY(w.y + originY);
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

    private static final Identifier PANEL_DEFAULT = Identifier.fromNamespaceAndPath("screenspec", "panel/default");

    /**
     * Draws a {@code panel} widget using the MC nine-slice sprite so it matches
     * the webapp's WYSIWYG preview. Override for custom textures per {@code style}.
     */
    protected void renderPanel(GuiGraphics guiGraphics, WidgetSpec w) {
        String style = w.prop("style", "default");
        if (style.equals("transparent")) {
            return;
        }
        int x = w.x + originX, y = w.y + originY;
        int tint = style.equals("dark") ? 0x80000000 : 0xFFFFFFFF;
        guiGraphics.blitSprite(RenderPipelines.GUI_TEXTURED, PANEL_DEFAULT, x, y, w.w, w.h, tint);
    }

    /**
     * Draws a {@code label} widget's text, honoring the {@code color},
     * {@code shadow} and {@code align} props from the designer.
     */
    protected void renderLabel(GuiGraphics guiGraphics, WidgetSpec w) {
        int color = w.propInt("color", 0x404040);
        boolean shadow = w.propBoolean("shadow", false);
        String align = w.prop("align", "left");
        String text = pinnedText.getOrDefault(w.id, boundText.getOrDefault(w.id, w.text));
        int textWidth = this.font.width(text);
        int baseX = w.x + originX;
        int x = switch (align) {
            case "center" -> baseX + (w.w - textWidth) / 2;
            case "right"  -> baseX + w.w - textWidth;
            default       -> baseX;
        };
        guiGraphics.drawString(this.font, text, x, w.y + originY, color, shadow);
    }

    /**
     * Draws an {@code icon} widget. No-op by default; override
     * {@link #resolveIcon} to map an icon id to your mod's texture.
     */
    protected void renderIcon(GuiGraphics guiGraphics, WidgetSpec w) {
        Identifier location = resolveIcon(w);
        if (location == null) {
            return;
        }
        int scale = w.propInt("scale", 1);
        guiGraphics.blit(RenderPipelines.GUI_TEXTURED, location, w.x + originX, w.y + originY, 0f, 0f, w.w * scale, w.h * scale, w.w * scale, w.h * scale);
    }

    /** Resolves an {@code icon} widget's {@code icon} id to a texture location. Returns {@code null} (no-op) by default. */
    protected Identifier resolveIcon(WidgetSpec w) {
        return null;
    }
}
