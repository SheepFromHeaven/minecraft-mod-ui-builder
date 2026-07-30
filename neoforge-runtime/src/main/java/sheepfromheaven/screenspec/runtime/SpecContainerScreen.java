package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.inventory.AbstractContainerScreen;
import net.minecraft.client.renderer.RenderPipelines;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.inventory.AbstractContainerMenu;

import java.util.Objects;

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
    private static final Identifier SLOT_GRID_TEXTURE =
            Identifier.withDefaultNamespace("textures/gui/container/generic_54.png");
    private static final int TEXTURE_SIZE = 256;
    private static final int SLOT_GRID_ORIGIN_U = 8;
    private static final int SLOT_GRID_ORIGIN_V = 18;

    private final ScreenSpec spec;
    private final ContainerSpec containerSpec;

    public SpecContainerScreen(T menu, Inventory playerInventory, Component title, ScreenSpec spec) {
        super(menu, playerInventory, title);
        this.spec = spec;
        this.containerSpec = Objects.requireNonNull(spec.container, "spec.container is null - use SpecScreen for slotless screens");
        this.imageWidth = spec.width;
        this.imageHeight = spec.height;
        this.inventoryLabelY = this.imageHeight - 94;
    }

    @Override
    protected void renderBg(GuiGraphics graphics, float partialTick, int mouseX, int mouseY) {
        graphics.fill(leftPos, topPos, leftPos + imageWidth, topPos + imageHeight, 0xFFC6C6C6);
        for (SlotAreaSpec area : this.containerSpec.slots) {
            drawSlotGrid(graphics, area);
        }
        for (WidgetSpec w : this.spec.widgets) {
            if (w.type.equals("panel")) {
                renderPanel(graphics, w);
            }
        }
    }

    @Override
    public void render(GuiGraphics graphics, int mouseX, int mouseY, float partialTick) {
        super.render(graphics, mouseX, mouseY, partialTick);
        for (WidgetSpec w : this.spec.widgets) {
            if (w.type.equals("label")) {
                renderLabel(graphics, w);
            }
        }
    }

    /**
     * Draws a vanilla-styled slot grid for {@code area} by cropping {@code area.cols x area.rows}
     * cells straight out of the vanilla chest texture's own slot grid, so borders between adjacent
     * cells line up exactly like a real container screen's - no per-cell art needed.
     */
    protected void drawSlotGrid(GuiGraphics graphics, SlotAreaSpec area) {
        int x = leftPos + area.x;
        int y = topPos + area.y;
        int width = area.cols * area.slot_size;
        int height = area.rows * area.slot_size;
        graphics.blit(RenderPipelines.GUI_TEXTURED, SLOT_GRID_TEXTURE, x, y,
                SLOT_GRID_ORIGIN_U, SLOT_GRID_ORIGIN_V, width, height, TEXTURE_SIZE, TEXTURE_SIZE);
    }

    /**
     * Draws a {@code panel} widget. Override for custom textures per {@code style}, mirroring
     * {@link SpecScreen#renderPanel}.
     */
    protected void renderPanel(GuiGraphics graphics, WidgetSpec w) {
        String style = w.prop("style", "default");
        if (style.equals("transparent")) {
            return;
        }
        int fill = style.equals("dark") ? 0x80000000 : 0xFFC6C6C6;
        int x = leftPos + w.x, y = topPos + w.y;
        graphics.fill(x, y, x + w.w, y + w.h, fill);
    }

    /**
     * Draws a {@code label} widget's text, honoring the {@code color}, {@code shadow} and
     * {@code align} props from the designer, mirroring {@link SpecScreen#renderLabel}.
     */
    protected void renderLabel(GuiGraphics graphics, WidgetSpec w) {
        int color = w.propInt("color", 0x404040);
        boolean shadow = w.propBoolean("shadow", false);
        String align = w.prop("align", "left");
        int textWidth = this.font.width(w.text);
        int baseX = leftPos + w.x;
        int x = switch (align) {
            case "center" -> baseX + (w.w - textWidth) / 2;
            case "right" -> baseX + w.w - textWidth;
            default -> baseX;
        };
        graphics.drawString(this.font, w.text, x, topPos + w.y, color, shadow);
    }
}
