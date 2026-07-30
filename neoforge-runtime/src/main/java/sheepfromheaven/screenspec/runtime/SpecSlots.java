package sheepfromheaven.screenspec.runtime;

import net.minecraft.world.Container;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.inventory.Slot;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds vanilla {@link Slot}s at the coordinates a {@link SlotAreaSpec} describes, so the same
 * layout drives both the server-side {@code AbstractContainerMenu} a mod writes and the rendering
 * {@link SpecContainerScreen} does for it - the mod never hand-computes slot positions.
 *
 * <pre>{@code
 * public class MyMenu extends AbstractContainerMenu {
 *     public MyMenu(MenuType<?> type, int containerId, ScreenSpec spec, Inventory playerInv, Container input) {
 *         super(type, containerId);
 *         SpecSlots.forArea(spec.container.area("input"), input).forEach(this::addSlot);
 *         SpecSlots.forPlayerInventory(spec.container.area("player_inv"), playerInv).forEach(this::addSlot);
 *         SpecSlots.forPlayerHotbar(spec.container.area("player_hotbar"), playerInv).forEach(this::addSlot);
 *     }
 *     ...
 * }
 * }</pre>
 */
public final class SpecSlots {
    private SpecSlots() {}

    /** One slot per cell, in row-major order, capped at {@code container.getContainerSize()}. */
    public static List<Slot> forArea(SlotAreaSpec area, Container container) {
        int capacity = Math.min(container.getContainerSize(), area.cols * area.rows);
        List<Slot> slots = new ArrayList<>(capacity);
        for (int i = 0; i < capacity; i++) {
            int col = i % area.cols;
            int row = i / area.cols;
            slots.add(new Slot(container, i, area.slotX(col), area.slotY(row)));
        }
        return slots;
    }

    /** The player's main 3x9 inventory (indices 9-35), laid out over {@code area.cols x area.rows}. */
    public static List<Slot> forPlayerInventory(SlotAreaSpec area, Inventory playerInventory) {
        List<Slot> slots = new ArrayList<>(area.cols * area.rows);
        for (int row = 0; row < area.rows; row++) {
            for (int col = 0; col < area.cols; col++) {
                int index = 9 + col + row * area.cols;
                slots.add(new Slot(playerInventory, index, area.slotX(col), area.slotY(row)));
            }
        }
        return slots;
    }

    /** The player's hotbar (indices 0-8), laid out over {@code area.cols} columns on a single row. */
    public static List<Slot> forPlayerHotbar(SlotAreaSpec area, Inventory playerInventory) {
        List<Slot> slots = new ArrayList<>(area.cols);
        for (int col = 0; col < area.cols; col++) {
            slots.add(new Slot(playerInventory, col, area.slotX(col), area.slotY(0)));
        }
        return slots;
    }
}
