package sheepfromheaven.screenspec.runtime;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Maps a {@code custom} widget's {@code customType} prop (e.g. {@code "my_mod:enchantment_picker"})
 * to the {@link CustomWidgetRenderer} that draws it. The designer only reserves a position/size for
 * {@code custom} widgets and shows a placeholder — a mod registers its own renderer here (typically
 * during client setup) so {@link SpecWidgetRenderer#renderCustom} can delegate to it. Widgets whose
 * {@code customType} has no registered renderer fall back to the same placeholder the designer shows.
 */
public final class CustomWidgetRegistry {
    private static final Map<String, CustomWidgetRenderer> RENDERERS = new LinkedHashMap<>();

    private CustomWidgetRegistry() {}

    public static void register(String customType, CustomWidgetRenderer renderer) {
        RENDERERS.put(customType, renderer);
    }

    public static CustomWidgetRenderer get(String customType) {
        return RENDERERS.get(customType);
    }
}
