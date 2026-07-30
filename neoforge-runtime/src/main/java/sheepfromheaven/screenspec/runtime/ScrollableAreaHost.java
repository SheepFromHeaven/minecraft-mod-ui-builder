package sheepfromheaven.screenspec.runtime;

import java.util.Map;

/**
 * Implemented by a mod's {@code AbstractContainerMenu} subclass to expose the
 * {@link ScrollableSlotArea}s it built with {@link SpecSlots#forScrollableViewport}, so
 * {@link SpecContainerScreen} can find them by {@link SlotAreaSpec#id} to draw scrollbars,
 * handle mouse wheel input, and clip the rendered slot grid to the viewport.
 */
public interface ScrollableAreaHost {
    /** Keyed by {@link SlotAreaSpec#id}. */
    Map<String, ScrollableSlotArea> scrollableAreas();
}
