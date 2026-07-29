package dev.screenspec.runtime;

/**
 * Receives action events from a {@link SpecScreen}.
 * Register via {@link SpecScreen#on} (keyed on a widget id or action id) or
 * {@link SpecScreen#onAny} (fires for every event).
 */
@FunctionalInterface
public interface ActionListener {
    /**
     * @param widgetId the id of the widget that fired
     * @param spec     the full spec of that widget
     * @param value    {@code null} for buttons; {@code Boolean} for toggle buttons;
     *                 {@code Double} for sliders; {@code String} for inputs
     */
    void on(String widgetId, WidgetSpec spec, Object value);
}
