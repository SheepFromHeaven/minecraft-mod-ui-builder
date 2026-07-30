package sheepfromheaven.screenspec.runtime;

import java.util.Map;

/**
 * Networks a {@link ScrollableSlotArea} scroll change over vanilla's existing container-button
 * packet ({@code ServerboundContainerButtonClickPacket}, driven by
 * {@code AbstractContainerMenu#clickMenuButton}) instead of a custom payload - client and server
 * both load the same {@link ScreenSpec} JSON, so encoding "which area, which row" as a single int
 * is enough for the server to independently reproduce the client's scroll.
 */
public final class SpecScroll {
    private static final int ROW_BITS = 16;
    private static final int ROW_MASK = (1 << ROW_BITS) - 1;

    private SpecScroll() {}

    /** Encodes a "scroll {@code areaId} to {@code row}" request into a menu button id. */
    public static int encode(ContainerSpec containerSpec, String areaId, int row) {
        return (areaOrdinal(containerSpec, areaId) << ROW_BITS) | (row & ROW_MASK);
    }

    /**
     * Call from the mod's {@code AbstractContainerMenu#clickMenuButton} override to resolve an id
     * produced by {@link #encode} against the live {@link ScrollableSlotArea}s and apply it.
     * Returns {@code false} (having done nothing) if {@code id} doesn't decode to a known area, so
     * the mod's override can fall through to handling its own button ids.
     */
    public static boolean handleClickMenuButton(ContainerSpec containerSpec,
                                                 Map<String, ScrollableSlotArea> scrollableAreas,
                                                 int id) {
        int ordinal = id >>> ROW_BITS;
        int row = id & ROW_MASK;
        if (ordinal < 0 || ordinal >= containerSpec.slots.size()) {
            return false;
        }
        ScrollableSlotArea area = scrollableAreas.get(containerSpec.slots.get(ordinal).id);
        if (area == null) {
            return false;
        }
        area.setScrollRow(row);
        return true;
    }

    private static int areaOrdinal(ContainerSpec containerSpec, String areaId) {
        for (int i = 0; i < containerSpec.slots.size(); i++) {
            if (containerSpec.slots.get(i).id.equals(areaId)) {
                return i;
            }
        }
        throw new IllegalArgumentException("No slot area \"" + areaId + "\" in container spec");
    }
}
