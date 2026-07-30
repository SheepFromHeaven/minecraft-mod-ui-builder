package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.Font;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.resources.Identifier;

import java.util.HashMap;
import java.util.Map;

/**
 * Renders the decoration widget kinds - {@code panel}, {@code label}, {@code icon} - and resolves
 * their {@code text} bindings identically for {@link SpecScreen} and {@link SpecContainerScreen},
 * so a widget spec looks and behaves the same regardless of which one ends up hosting it. Before
 * this class existed the two screens each reimplemented these renderers by hand and had drifted -
 * {@code SpecContainerScreen} drew panels as flat fills instead of the nine-slice sprite and had no
 * {@code text} binding or {@code icon} support at all. That drift is exactly the kind of thing that
 * forces a mod author extending this library to learn two slightly different widget models
 * depending on whether their screen happens to have inventory slots; centralizing the rendering
 * here means that choice only affects slots, not everything else on the screen.
 *
 * <p>Position is passed in per call rather than owned here, since {@link SpecScreen} centers its
 * spec in the window (an {@code originX}/{@code originY} offset) while {@link SpecContainerScreen}
 * anchors it at the container's {@code leftPos}/{@code topPos} - the one difference that's actually
 * inherent to the two screens' base classes, not an accident of duplicated code.
 */
final class SpecWidgetRenderer {
    private final ScreenSpec spec;
    // resolved bound text for decoration widgets (label/icon) - cleared and recomputed each frame
    private final Map<String, String> boundText = new HashMap<>();
    // subclass-driven text overrides - NOT cleared each frame; take priority over boundText
    private final Map<String, String> pinnedText = new HashMap<>();

    SpecWidgetRenderer(ScreenSpec spec) {
        this.spec = spec;
    }

    /** See {@code SpecScreen#bindText} / {@code SpecContainerScreen#bindText}. */
    void bindText(String widgetId, String text) {
        pinnedText.put(widgetId, text);
    }

    /**
     * Qualifies a short id with {@code modId} using a {@code "."} separator (e.g. {@code "health"}
     * -> {@code "my_mod.health"}). Ids that are {@code null}, empty, already contain {@code "."}, or
     * whose spec has no {@code modId} are returned unchanged.
     */
    static String qualify(String modId, String id) {
        if (id == null || id.isEmpty() || id.contains(".") || modId == null || modId.isEmpty()) {
            return id;
        }
        return modId + "." + id;
    }

    /**
     * Recomputes {@link #boundText} from every widget's declared {@code text} binding. Call once
     * per frame before rendering labels/icons. Only the {@code text} target is handled here -
     * {@code enabled}/{@code visible} bindings apply to a live {@code AbstractWidget} and stay the
     * host screen's responsibility, since {@code SpecContainerScreen} doesn't build interactive
     * widgets of its own the way {@code SpecScreen} does.
     */
    void refreshBoundText() {
        boundText.clear();
        for (WidgetSpec w : spec.widgets) {
            String localPath = w.bindings.get("text");
            if (localPath == null) continue;
            String value = DataRegistry.resolve(qualify(spec.modId, localPath));
            if (value != null) boundText.put(w.id, value);
        }
    }

    /** Resolves a label/icon widget's display text: pinned override, then binding, then the spec's static {@code text}. */
    String resolveText(WidgetSpec w) {
        return pinnedText.getOrDefault(w.id, boundText.getOrDefault(w.id, w.text));
    }

    /**
     * Draws a {@code panel} widget using the MC nine-slice sprite, at {@code (x, y)} in screen
     * space (the caller has already added its own origin offset to {@code w.x}/{@code w.y}).
     */
    void renderPanel(GuiGraphics graphics, WidgetSpec w, int x, int y) {
        String style = w.prop("style", "default");
        if (style.equals("transparent")) {
            return;
        }
        if (style.equals("dark")) {
            graphics.fill(x, y, x + w.w, y + w.h, 0x80000000);
            return;
        }
        // vanilla MC inventory-style raised panel: fill, then 1px bevel border
        graphics.fill(x, y, x + w.w, y + w.h, 0xFFC6C6C6);
        graphics.fill(x,          y,          x + w.w, y + 1,     0xFFFFFFFF); // top light
        graphics.fill(x,          y,          x + 1,   y + w.h,   0xFFFFFFFF); // left light
        graphics.fill(x,          y + w.h - 1, x + w.w, y + w.h,  0xFF555555); // bottom dark
        graphics.fill(x + w.w - 1, y,          x + w.w, y + w.h,  0xFF555555); // right dark
    }

    /**
     * Draws a {@code label} widget's text at {@code (x, y)} in screen space, honoring the
     * {@code color}, {@code shadow} and {@code align} props from the designer and this widget's
     * resolved bound/pinned text (see {@link #resolveText}).
     */
    void renderLabel(GuiGraphics graphics, Font font, WidgetSpec w, int x, int y) {
        int color = w.propInt("color", 0x404040);
        boolean shadow = w.propBoolean("shadow", false);
        String align = w.prop("align", "left");
        String text = resolveText(w);
        int textWidth = font.width(text);
        int alignedX = switch (align) {
            case "center" -> x + (w.w - textWidth) / 2;
            case "right" -> x + w.w - textWidth;
            default -> x;
        };
        graphics.drawString(font, text, alignedX, y, color, shadow);
    }

    /** Draws an {@code icon} widget at {@code (x, y)} in screen space. No-op if {@code resolveIcon} returns {@code null}. */
    void renderIcon(GuiGraphics graphics, WidgetSpec w, int x, int y, IconResolver resolveIcon) {
        Identifier location = resolveIcon.resolve(w);
        if (location == null) {
            return;
        }
        int scale = w.propInt("scale", 1);
        graphics.blit(RenderPipelines.GUI_TEXTURED, location, x, y, 0f, 0f, w.w * scale, w.h * scale, w.w * scale, w.h * scale);
    }

    /** Maps an {@code icon} widget's {@code icon} id to a texture location; mirrors each screen's overridable {@code resolveIcon}. */
    @FunctionalInterface
    interface IconResolver {
        Identifier resolve(WidgetSpec w);
    }
}
