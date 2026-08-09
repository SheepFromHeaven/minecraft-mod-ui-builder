package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphicsExtractor;
import net.minecraft.client.gui.components.ObjectSelectionList;
import net.minecraft.client.gui.narration.NarrationElementOutput;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;

/**
 * A scrollable, selectable list widget backed by a {@code list} WidgetSpec.
 * <p>
 * Each visible row is drawn by iterating the {@code item_template} from the spec
 * and substituting per-row data for matching keys.  Data is set at runtime:
 * <pre>{@code
 * SpecListWidget list = screen.getWidget("item_list");
 * list.setItems(List.of(
 *     Map.of("icon", "minecraft:diamond", "label", "Diamond"),
 *     Map.of("icon", "minecraft:gold_ingot", "label", "Gold Ingot")
 * ));
 * }</pre>
 *
 * {@code onAction} fires with the selected row index (as an {@link Integer}) when a
 * row is clicked.
 */
public class SpecListWidget extends ObjectSelectionList<SpecListWidget.Row> {

    private final WidgetSpec spec;
    private final ActionHost screen;
    private final BiConsumer<Integer, Map<String, String>> selectionListener;

    public SpecListWidget(WidgetSpec spec, ActionHost screen, BiConsumer<Integer, Map<String, String>> selectionListener) {
        super(
            Minecraft.getInstance(),
            spec.w, spec.h,
            spec.y,
            spec.propInt("item_height", 20)
        );
        this.spec = spec;
        this.screen = screen;
        this.selectionListener = selectionListener;
        // updateSizeAndPosition(x, y, w, h) was removed in NeoForge 21.11.45;
        // position is passed to the super constructor above.
    }

    /**
     * Replaces the displayed rows. Each map entry should have keys matching the
     * {@code id} of a widget in the {@code item_template}.
     */
    public void setItems(List<Map<String, String>> items) {
        clearEntries();
        for (int i = 0; i < items.size(); i++) {
            addEntry(new Row(i, items.get(i)));
        }
    }

    /**
     * Returns the index of the currently selected row, or -1 if nothing is selected.
     */
    public int getSelectedIndex() {
        Row selected = getSelected();
        return selected != null ? selected.index : -1;
    }

    /**
     * Returns the data map of the currently selected row, or an empty map if nothing is selected.
     */
    public Map<String, String> getSelectedItem() {
        Row selected = getSelected();
        return selected != null ? selected.data : Collections.emptyMap();
    }

    /**
     * Makes getRowLeft() return a position inside this widget's bounds.
     * The default (220) ignores the actual widget width and causes text clipping.
     */
    @Override
    public int getRowWidth() {
        return this.getWidth();
    }

    @Override
    public void updateWidgetNarration(NarrationElementOutput output) {
        Row selected = getSelected();
        if (selected != null) {
            output.add(net.minecraft.client.gui.narration.NarratedElementType.TITLE,
                Component.literal(String.valueOf(selected.index)));
        }
    }

    public class Row extends ObjectSelectionList.Entry<Row> {
        final int index;
        final Map<String, String> data;

        Row(int index, Map<String, String> data) {
            this.index = index;
            this.data = data;
        }

        @Override
        public Component getNarration() {
            return Component.literal(String.valueOf(index));
        }

        @Override
        public boolean mouseClicked(MouseButtonEvent event, boolean consumed) {
            SpecListWidget.this.setSelected(this);
            selectionListener.accept(index, data);
            return true;
        }

        @Override
        public void extractContent(GuiGraphicsExtractor guiGraphics, int mouseX, int mouseY, boolean hovered, float partialTick) {
            int left = SpecListWidget.this.getRowLeft();
            int top  = SpecListWidget.this.getRowTop(index);
            for (WidgetSpec template : spec.item_template) {
                String value = data.getOrDefault(template.id, template.text);
                renderTemplateWidget(guiGraphics, template, left + template.x, top + template.y, value);
            }
        }

        private void renderTemplateWidget(GuiGraphicsExtractor g, WidgetSpec t, int x, int y, String value) {
            if (t.type.equals("label")) {
                int color = t.propInt("color", 0xFFFFFF);
                boolean shadow = t.propBoolean("shadow", false);
                g.text(screen.getFont(), value, x, y, color, shadow);
            }
            // icon and other template widget types can be handled by overriding this class
        }
    }
}
