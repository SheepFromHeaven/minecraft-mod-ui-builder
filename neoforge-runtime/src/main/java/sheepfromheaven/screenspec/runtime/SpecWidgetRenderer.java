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
    // src path → Identifier cache for sprite widgets - avoids allocation on every render frame
    private final Map<String, Identifier> spriteTexCache = new HashMap<>();

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
        renderVanillaPanel(graphics, x, y, w.w, w.h);
    }

    // Vanilla's own survival-inventory background - the raised-panel bevel look shared by every
    // vanilla container screen. Only its top-left 176x166 is real content (the rest of the 256x256
    // texture is unused atlas padding); its border is a uniform 3px bevel on all four sides (checked
    // pixel-by-pixel along each edge), so it nine-slices cleanly. (88, 10) is a flat-grey point deep
    // enough in the fill to dodge the player-model/crafting-grid/armor-slot art drawn over the middle
    // of this same texture - same reference point `scripts/extractMCTextures.py` uses on the webapp
    // side. Referencing vanilla's own texture (rather than shipping a copy) means a resource pack
    // that reskins the inventory background reskins our panels too, for free.
    private static final Identifier PANEL_TEX = Identifier.withDefaultNamespace("textures/gui/container/inventory.png");
    private static final int PANEL_TEX_W = 256;
    private static final int PANEL_TEX_H = 256;
    private static final int PANEL_CONTENT_W = 176;
    private static final int PANEL_CONTENT_H = 166;
    private static final int PANEL_BORDER = 3;
    private static final int PANEL_SAFE_U = 88;
    private static final int PANEL_SAFE_V = 10;

    /**
     * Draws a raised MC panel at an arbitrary rect by nine-slicing vanilla's own inventory
     * background texture (see above) - shared by {@link #renderPanel} and a {@code tabs} widget's
     * body area, which needs the same "framed panel" look without being an actual {@code panel}
     * widget itself.
     */
    void renderVanillaPanel(GuiGraphics graphics, int x, int y, int w, int h) {
        int rightU  = PANEL_CONTENT_W - PANEL_BORDER;
        int bottomV = PANEL_CONTENT_H - PANEL_BORDER;
        int destFillW = Math.max(0, w - PANEL_BORDER * 2);
        int destFillH = Math.max(0, h - PANEL_BORDER * 2);

        // top row: corners plus a horizontally-stretched top edge sampled from a safe column
        ninePatch(graphics, PANEL_TEX, x,                y, 0,               0, PANEL_BORDER,   PANEL_BORDER, PANEL_BORDER, PANEL_BORDER, PANEL_TEX_W, PANEL_TEX_H);
        ninePatch(graphics, PANEL_TEX, x + PANEL_BORDER,  y, PANEL_SAFE_U,    0, 1,               PANEL_BORDER, destFillW,    PANEL_BORDER, PANEL_TEX_W, PANEL_TEX_H);
        ninePatch(graphics, PANEL_TEX, x + w - PANEL_BORDER, y, rightU,      0, PANEL_BORDER,   PANEL_BORDER, PANEL_BORDER, PANEL_BORDER, PANEL_TEX_W, PANEL_TEX_H);

        if (destFillH > 0) {
            // middle rows: left/right edges stretched vertically, center fill stretched both ways
            int midY = y + PANEL_BORDER;
            ninePatch(graphics, PANEL_TEX, x,                    midY, 0,            PANEL_SAFE_V, PANEL_BORDER, 1, PANEL_BORDER, destFillH, PANEL_TEX_W, PANEL_TEX_H);
            ninePatch(graphics, PANEL_TEX, x + PANEL_BORDER,      midY, PANEL_SAFE_U, PANEL_SAFE_V, 1,            1, destFillW,    destFillH, PANEL_TEX_W, PANEL_TEX_H);
            ninePatch(graphics, PANEL_TEX, x + w - PANEL_BORDER,  midY, rightU,       PANEL_SAFE_V, PANEL_BORDER, 1, PANEL_BORDER, destFillH, PANEL_TEX_W, PANEL_TEX_H);
        }

        // bottom row: corners plus a horizontally-stretched bottom edge, only if taller than the top border alone
        int bottomDestY = y + h - PANEL_BORDER;
        if (bottomDestY > y + PANEL_BORDER) {
            ninePatch(graphics, PANEL_TEX, x,                    bottomDestY, 0,            bottomV, PANEL_BORDER, PANEL_BORDER, PANEL_BORDER, PANEL_BORDER, PANEL_TEX_W, PANEL_TEX_H);
            ninePatch(graphics, PANEL_TEX, x + PANEL_BORDER,      bottomDestY, PANEL_SAFE_U, bottomV, 1,            PANEL_BORDER, destFillW,    PANEL_BORDER, PANEL_TEX_W, PANEL_TEX_H);
            ninePatch(graphics, PANEL_TEX, x + w - PANEL_BORDER,  bottomDestY, rightU,       bottomV, PANEL_BORDER, PANEL_BORDER, PANEL_BORDER, PANEL_BORDER, PANEL_TEX_W, PANEL_TEX_H);
        }
    }

    /**
     * Draws a {@code label} widget's text at {@code (x, y)} in screen space, honoring the
     * {@code color}, {@code shadow} and {@code align} props from the designer and this widget's
     * resolved bound/pinned text (see {@link #resolveText}).
     *
     * <p>The default color 0xFF404040 matches vanilla's own container title color (-12566464), which
     * includes full alpha — without the 0xFF alpha byte, drawString treats the text as transparent.
     */
    void renderLabel(GuiGraphics graphics, Font font, WidgetSpec w, int x, int y) {
        int color = w.propInt("color", 0xFF404040);
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

    // Vanilla's own creative-inventory tab sprites - the recognizable "folder tab" look the webapp's
    // canvas mimics. The selected tab uses one of three column variants that differ at their left/right
    // edges (_1 = leftmost, _2 = middle, _7 = rightmost); the unselected state always uses _1 since
    // the subtle edge difference is invisible at reduced size. Referencing vanilla's own sprites means
    // a resource pack that reskins these also reskins ours. Unlike `widget/tab`, these have no
    // nine-slice .mcmeta (vanilla only ever blits them at a fixed 26×32), so the slicing below is
    // done by hand: 4px border on all four sides. 4 (not the outline+bevel's 3) because the corner
    // transition art extends one pixel past it: the white inner bevel's diagonal pixel sits at
    // (3,3), and the bottom corners' art that fades the side border into the panel bevel spans the
    // last rows. The unselected variant is the same art shifted down 2px (it sits 2px shorter).
    private static final Identifier TAB_SEL_LEFT   = Identifier.withDefaultNamespace("textures/gui/sprites/container/creative_inventory/tab_top_selected_1.png");
    private static final Identifier TAB_SEL_MIDDLE = Identifier.withDefaultNamespace("textures/gui/sprites/container/creative_inventory/tab_top_selected_2.png");
    private static final Identifier TAB_SEL_RIGHT  = Identifier.withDefaultNamespace("textures/gui/sprites/container/creative_inventory/tab_top_selected_7.png");
    private static final Identifier TAB_UNSELECTED = Identifier.withDefaultNamespace("textures/gui/sprites/container/creative_inventory/tab_top_unselected_1.png");
    private static final int TAB_TEX_W = 26;
    private static final int TAB_TEX_H = 32;
    private static final int TAB_BORDER = 4;
    private static final int TAB_UNSELECTED_TOP_V = 2;
    // Safe sampling coordinates for the stretched regions, mirroring the webapp's *_slice.png files
    // (which are only 7px wide - 3px edges + a single mid column): the corner diagonal in these
    // sprites extends past the 3px corner into the interior, so stretching the whole interior drags
    // the diagonal out. Sampling a single flat column/row deep in the sprite avoids that.
    private static final int TAB_SAFE_U = 13;
    private static final int TAB_SAFE_V = 16;

    /** Draws a {@code tabs} selector button by nine-slicing vanilla's creative-inventory tab sprite (see above). */
    void renderTab(GuiGraphics graphics, boolean active, TabButtonWidget.Position position, int x, int y, int w, int h) {
        Identifier tex;
        if (!active) {
            tex = TAB_UNSELECTED;
        } else {
            tex = switch (position) {
                case LEFT  -> TAB_SEL_LEFT;
                case RIGHT -> TAB_SEL_RIGHT;
                default    -> TAB_SEL_MIDDLE;
            };
        }
        int topV = active ? 0 : TAB_UNSELECTED_TOP_V;
        int rightU    = TAB_TEX_W - TAB_BORDER;
        int bottomV   = TAB_TEX_H - TAB_BORDER;
        int destFillW = Math.max(0, w - TAB_BORDER * 2);
        int destFillH = Math.max(0, h - TAB_BORDER * 2);

        // top row: fixed corners, top edge stretched from a 1px-wide safe column
        ninePatch(graphics, tex, x,                y, 0,          topV, TAB_BORDER, TAB_BORDER, TAB_BORDER, TAB_BORDER, TAB_TEX_W, TAB_TEX_H);
        ninePatch(graphics, tex, x + TAB_BORDER,    y, TAB_SAFE_U, topV, 1,          TAB_BORDER, destFillW,  TAB_BORDER, TAB_TEX_W, TAB_TEX_H);
        ninePatch(graphics, tex, x + w - TAB_BORDER, y, rightU,    topV, TAB_BORDER, TAB_BORDER, TAB_BORDER, TAB_BORDER, TAB_TEX_W, TAB_TEX_H);

        if (destFillH > 0) {
            // middle rows: left/right edges stretched from a 1px-tall safe row, flat center fill
            int fillY = y + TAB_BORDER;
            ninePatch(graphics, tex, x,                 fillY, 0,          TAB_SAFE_V, TAB_BORDER, 1, TAB_BORDER, destFillH, TAB_TEX_W, TAB_TEX_H);
            ninePatch(graphics, tex, x + TAB_BORDER,     fillY, TAB_SAFE_U, TAB_SAFE_V, 1,          1, destFillW,  destFillH, TAB_TEX_W, TAB_TEX_H);
            ninePatch(graphics, tex, x + w - TAB_BORDER, fillY, rightU,     TAB_SAFE_V, TAB_BORDER, 1, TAB_BORDER, destFillH, TAB_TEX_W, TAB_TEX_H);
        }

        // bottom row: fixed corners from the texture's last 3 rows — these hold the connection art
        // where the tab's side border fades into the panel's top bevel (e.g. the selected sprite's
        // right shadow turns white then grey over rows 29-31). The bottom edge between them is
        // plain fill, stretched from the safe column.
        int bottomDestY = y + h - TAB_BORDER;
        if (bottomDestY > y + TAB_BORDER) {
            ninePatch(graphics, tex, x,                 bottomDestY, 0,          bottomV, TAB_BORDER, TAB_BORDER, TAB_BORDER, TAB_BORDER, TAB_TEX_W, TAB_TEX_H);
            ninePatch(graphics, tex, x + TAB_BORDER,     bottomDestY, TAB_SAFE_U, bottomV, 1,          TAB_BORDER, destFillW,  TAB_BORDER, TAB_TEX_W, TAB_TEX_H);
            ninePatch(graphics, tex, x + w - TAB_BORDER, bottomDestY, rightU,     bottomV, TAB_BORDER, TAB_BORDER, TAB_BORDER, TAB_BORDER, TAB_TEX_W, TAB_TEX_H);
        }
    }

    /**
     * Draws a {@code sprite} widget: a flat textured quad sampled from a mod or vanilla texture.
     *
     * <p>{@code src} is the path under a resource pack's {@code assets/<namespace>/textures/}
     * directory (e.g. {@code "gui/sprites/widget/button.png"}). The namespace defaults to
     * {@code minecraft}; mod-specific textures must be placed in the vanilla namespace or the
     * src format extended in a future revision.
     *
     * <p>{@code fit} is {@code "fill"} (default) or {@code "tile"}. Fill stretches the full
     * texture to the widget bounds. Tile repeats it at {@code tile_w}/{@code tile_h} pixel
     * intervals (default 16×16), clipping the last partial tile at each edge.
     * {@code contain}/{@code cover}/{@code none} require the natural texture size, which is
     * not available at render time without querying the texture manager; they fall back to fill.
     */
    void renderSprite(GuiGraphics graphics, WidgetSpec w, int x, int y) {
        String src = w.prop("src", "");
        if (src.isEmpty()) return;
        Identifier tex = spriteTexCache.computeIfAbsent(src, s -> Identifier.withDefaultNamespace("textures/" + s));
        String fit = w.prop("fit", "fill");
        if ("tile".equals(fit)) {
            int tileW = w.propInt("tile_w", 16);
            int tileH = w.propInt("tile_h", 16);
            for (int ty = 0; ty < w.h; ty += tileH) {
                for (int tx = 0; tx < w.w; tx += tileW) {
                    int dw = Math.min(tileW, w.w - tx);
                    int dh = Math.min(tileH, w.h - ty);
                    // srcW/texW = dw/tileW samples the correct fractional UV for the partial last tile
                    ninePatch(graphics, tex, x + tx, y + ty, 0, 0, dw, dh, dw, dh, tileW, tileH);
                }
            }
        } else {
            // Treat the texture as a 1×1 atlas so UV spans 0..1 = full texture, stretched to widget bounds.
            ninePatch(graphics, tex, x, y, 0, 0, 1, 1, w.w, w.h, 1, 1);
        }
    }

    /** Blits one nine-slice piece: a {@code srcW x srcH} source region (from a {@code texW x texH} texture) stretched to {@code destW x destH}. */
    private void ninePatch(GuiGraphics graphics, Identifier tex, int x, int y, int u, int v, int srcW, int srcH, int destW, int destH, int texW, int texH) {
        if (destW <= 0 || destH <= 0) return;
        graphics.blit(RenderPipelines.GUI_TEXTURED, tex, x, y, u, v, destW, destH, srcW, srcH, texW, texH, -1);
    }
}
