package sheepfromheaven.screenspec.runtime;

/**
 * One rectangular grid of inventory slots within a {@link ContainerSpec}, exported by the MC Screen
 * Designer web tool (see {@code lib/types.ts}). Field names and JSON shape must stay in sync with
 * that file.
 *
 * <p>{@code source} is {@code null} for a mod-provided container (looked up by {@code id} - see
 * {@link SpecSlots#forArea}), or one of the reserved ids {@code "player"} / {@code "player_hotbar"}
 * (see {@link SpecSlots#forPlayerInventory} / {@link SpecSlots#forPlayerHotbar}).
 *
 * <p>There's deliberately no {@code rows} field: the designer can't know the true size of
 * whatever inventory a mod ends up binding at runtime (a custom block's container, sized however
 * that mod likes) - only {@code viewport_rows}, how many rows of it are visible at once, is a
 * layout decision the designer actually controls. For a fixed-size area (crafting grids, the
 * player's own inventory) built via {@link SpecSlots#forArea}, {@code viewport_rows} doubles as
 * the true row count. For a runtime-sized area built via {@link SpecSlots#forScrollableViewport},
 * the true row count is derived from the real {@code Container} instead - see
 * {@link ScrollableSlotArea}.
 */
public final class SlotAreaSpec {
    public String id;
    public int x;
    public int y;
    public int cols = 1;
    public int slot_size = 18;
    public String source;
    public int viewport_rows = 1;

    public int slotX(int col) {
        return x + col * slot_size + 1;
    }

    public int slotY(int row) {
        return y + row * slot_size + 1;
    }

    /** {@code ceil(itemCount / cols)}, at least 1 - the row count needed to hold itemCount items. */
    public int totalRows(int itemCount) {
        return Math.max(1, (itemCount + cols - 1) / cols);
    }
}
