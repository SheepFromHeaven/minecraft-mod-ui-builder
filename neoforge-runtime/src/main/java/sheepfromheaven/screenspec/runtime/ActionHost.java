package sheepfromheaven.screenspec.runtime;

import net.minecraft.client.gui.Font;

/**
 * Minimal interface that {@link WidgetFactory} implementations need from the host screen.
 * Implemented by both {@link SpecScreen} and {@link SpecContainerScreen} so that interactive
 * widgets can be built in either context without coupling to {@link SpecScreen} specifically.
 */
public interface ActionHost {
    /** Dispatch a widget action to the screen's listeners / {@code onAction} hook. */
    void dispatchAction(String widgetId, WidgetSpec widgetSpec, Object value);

    /** Select all members of a named toggle group, marking only {@code selectedId} as active. */
    void selectToggleGroup(String group, String selectedId);

    /** Font used for text-input widgets. */
    Font getFont();
}
