package sheepfromheaven.screenspec.runtime;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Mirrors the {@code ContainerSpec} shape exported by the MC Screen Designer web tool (see
 * {@code lib/types.ts}). Field names and JSON shape must stay in sync with that file.
 *
 * <p>Present only on screens that opt into inventory slots (a {@code container} key in the
 * {@code ScreenSpec} JSON); {@code null} otherwise. A screen can declare any number of slot
 * areas - e.g. an input area, an output area, the player's own inventory, and a mod's own
 * runtime-sized container can all coexist in one {@code container.slots} list; {@link SpecScroll}
 * and {@link ScrollableAreaHost} key everything by area id, so any number of them can scroll
 * independently. {@link #validate()} (called automatically by {@link ScreenSpecLoader}) is what
 * makes that safe - see its javadoc.
 */
public final class ContainerSpec {
    public List<SlotAreaSpec> slots = Collections.emptyList();

    /** Looks up a slot area by id, or {@code null} if this container has none with that id. */
    public SlotAreaSpec area(String id) {
        for (SlotAreaSpec area : slots) {
            if (area.id.equals(id)) return area;
        }
        return null;
    }

    /**
     * Throws if two areas share an id. Multiple areas are expected to coexist on one screen, but
     * {@link #area}, {@link SpecScroll}'s ordinal encoding, and a mod's own {@code
     * Map<String, ScrollableSlotArea>} all resolve by id - a duplicate would silently resolve to
     * whichever area happens to come first (or, for the mod's map, get silently overwritten),
     * misrouting scroll clicks or slot lookups to the wrong area instead of failing loudly.
     */
    public void validate() {
        Set<String> seen = new HashSet<>();
        for (SlotAreaSpec area : slots) {
            if (!seen.add(area.id)) {
                throw new IllegalArgumentException("Duplicate slot area id \"" + area.id + "\" in container spec");
            }
        }
    }
}
