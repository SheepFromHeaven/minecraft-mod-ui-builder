package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.components.AbstractWidget;
import net.minecraft.client.gui.components.Button;
import net.minecraft.client.gui.components.EditBox;
import net.minecraft.network.chat.Component;


import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Maps a {@code WidgetSpec.type} (the same strings produced by the web
 * builder's widget registry: panel, button, toggle_button, input, slider,
 * label, icon) to code that constructs the corresponding real widget.
 * <p>
 * {@code panel}, {@code label} and {@code icon} are drawn directly by
 * {@link SpecScreen} rather than built here, since they aren't interactive
 * widgets. Register additional types with {@link #register} to support
 * custom widget types added on the design side.
 */
public final class WidgetFactories {
    private static final Map<String, WidgetFactory> FACTORIES = new LinkedHashMap<>();

    static {
        register("button", WidgetFactories::button);
        register("toggle_button", WidgetFactories::toggleButton);
        register("input", WidgetFactories::input);
        register("slider", WidgetFactories::slider);
        register("list", WidgetFactories::list);
    }

    private WidgetFactories() {}

    public static void register(String type, WidgetFactory factory) {
        FACTORIES.put(type, factory);
    }

    public static WidgetFactory get(String type) {
        return FACTORIES.get(type);
    }

    private static AbstractWidget button(WidgetSpec w, SpecScreen screen) {
        return Button.builder(Component.literal(w.text), b -> screen.dispatchAction(w.id, w, null))
            .bounds(w.x, w.y, w.w, w.h)
            .build();
    }

    private static AbstractWidget toggleButton(WidgetSpec w, SpecScreen screen) {
        String group = w.prop("group", "");
        return Button.builder(Component.literal(w.text), b -> {
            ToggleButtonWidget self = (ToggleButtonWidget) b;
            boolean newState;
            if (!group.isEmpty()) {
                screen.selectToggleGroup(group, w.id);
                newState = true;
            } else {
                newState = !self.isSelected();
                self.setSelected(newState);
            }
            screen.dispatchAction(w.id, w, newState);
        }).bounds(w.x, w.y, w.w, w.h).build(ToggleButtonWidget::new);
    }

    private static AbstractWidget input(WidgetSpec w, SpecScreen screen) {
        EditBox box = new EditBox(screen.getFont(), w.x, w.y, w.w, w.h, Component.empty());
        box.setValue(w.text);
        box.setMaxLength(w.propInt("max_length", 32));
        String hint = w.prop("hint_text", "");
        if (!hint.isEmpty()) {
            box.setHint(Component.literal(hint));
        }
        box.setResponder(value -> screen.dispatchAction(w.id, w, value));
        return box;
    }

    private static AbstractWidget slider(WidgetSpec w, SpecScreen screen) {
        double min = w.propDouble("min", 0);
        double max = w.propDouble("max", 100);
        double step = w.propDouble("step", 1);
        double initial = w.propDouble("value", min);
        String template = w.text.isEmpty() ? "%s" : w.text;
        return new SpecSlider(w.x, w.y, w.w, w.h, min, max, step, initial, template,
            v -> screen.dispatchAction(w.id, w, v));
    }

    private static AbstractWidget list(WidgetSpec w, SpecScreen screen) {
        return new SpecListWidget(w, screen,
            (index, data) -> screen.dispatchAction(w.id, w, index));
    }
}
