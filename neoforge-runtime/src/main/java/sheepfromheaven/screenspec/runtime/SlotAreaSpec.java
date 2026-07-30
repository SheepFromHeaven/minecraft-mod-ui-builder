package sheepfromheaven.screenspec.runtime;

/**
 * One rectangular grid of inventory slots within a {@link ContainerSpec}, exported by the MC Screen
 * Designer web tool (see {@code lib/types.ts}). Field names and JSON shape must stay in sync with
 * that file.
 *
 * <p>{@code source} is {@code null} for a mod-provided container (looked up by {@code id} - see
 * {@link SpecSlots#forArea}), or one of the reserved ids {@code "player"} / {@code "player_hotbar"}
 * (see {@link SpecSlots#forPlayerInventory} / {@link SpecSlots#forPlayerHotbar}).
 */
public final class SlotAreaSpec {
    public String id;
    public int x;
    public int y;
    public int cols = 1;
    public int rows = 1;
    public int slot_size = 18;
    public String source;

    public int slotX(int col) {
        return x + col * slot_size;
    }

    public int slotY(int row) {
        return y + row * slot_size;
    }
}
