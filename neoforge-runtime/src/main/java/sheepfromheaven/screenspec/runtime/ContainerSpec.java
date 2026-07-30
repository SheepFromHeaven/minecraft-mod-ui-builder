package sheepfromheaven.screenspec.runtime;

import java.util.Collections;
import java.util.List;

/**
 * Mirrors the {@code ContainerSpec} shape exported by the MC Screen Designer web tool (see
 * {@code lib/types.ts}). Field names and JSON shape must stay in sync with that file.
 *
 * <p>Present only on screens that opt into inventory slots (a {@code container} key in the
 * {@code ScreenSpec} JSON); {@code null} otherwise.
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
}
