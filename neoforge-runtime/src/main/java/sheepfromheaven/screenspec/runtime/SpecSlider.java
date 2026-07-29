package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.components.AbstractSliderButton;
import net.minecraft.network.chat.Component;

import java.util.function.DoubleConsumer;

/** A slider driven by min/max/step/value props from a {@code slider} WidgetSpec. */
final class SpecSlider extends AbstractSliderButton {
    private final double min;
    private final double max;
    private final double step;
    private final String template;
    private final DoubleConsumer onChange;

    SpecSlider(int x, int y, int w, int h, double min, double max, double step, double initial,
               String template, DoubleConsumer onChange) {
        super(x, y, w, h, Component.literal(format(template, initial)), normalize(initial, min, max));
        this.min = min;
        this.max = max;
        this.step = step;
        this.template = template;
        this.onChange = onChange;
    }

    private static double normalize(double v, double min, double max) {
        return max > min ? clamp((v - min) / (max - min), 0, 1) : 0;
    }

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    private double currentValue() {
        double raw = min + this.value * (max - min);
        if (step > 0) {
            raw = Math.round(raw / step) * step;
        }
        return clamp(raw, min, max);
    }

    private static String format(String template, double v) {
        String display = (v == Math.floor(v) && !Double.isInfinite(v))
            ? String.valueOf((long) v)
            : String.valueOf(v);
        return template.contains("%s") ? template.replace("%s", display) : template;
    }

    @Override
    protected void updateMessage() {
        setMessage(Component.literal(format(template, currentValue())));
    }

    @Override
    protected void applyValue() {
        onChange.accept(currentValue());
    }
}
