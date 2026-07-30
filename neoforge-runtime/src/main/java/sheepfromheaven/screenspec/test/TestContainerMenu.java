package sheepfromheaven.screenspec.test;

import net.minecraft.network.RegistryFriendlyByteBuf;
import net.minecraft.world.Container;
import net.minecraft.world.SimpleContainer;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.inventory.AbstractContainerMenu;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import sheepfromheaven.screenspec.runtime.ScreenSpec;
import sheepfromheaven.screenspec.runtime.ScreenSpecLoader;
import sheepfromheaven.screenspec.runtime.ScrollableAreaHost;
import sheepfromheaven.screenspec.runtime.ScrollableSlotArea;
import sheepfromheaven.screenspec.runtime.SlotAreaSpec;
import sheepfromheaven.screenspec.runtime.SpecScroll;
import sheepfromheaven.screenspec.runtime.SpecSlots;

import java.util.HashMap;
import java.util.Map;

/**
 * Smoke-test menu exercising *multiple* slot areas at once - see {@code
 * test_container_screen.json}: two independently-scrollable custom containers
 * ({@code inv_10row}, {@code inv_second}, different sizes) plus the player's own fixed
 * inventory, all in one menu. Proves {@link SpecScroll}'s ordinal-based button-id encoding and
 * {@link ScrollableAreaHost}'s id-keyed map correctly disambiguate more than one scrollable area.
 */
public final class TestContainerMenu extends AbstractContainerMenu implements ScrollableAreaHost {
    static final ScreenSpec SPEC = ScreenSpecLoader.fromClasspath("screenspec", "test_container_screen");

    /** Sizes for the two demo containers - shared by the server's real backing containers and the client's placeholder ones, so both sides derive the same row counts (see {@link ScrollableSlotArea}). */
    private static final int SIZE_A = 90;
    private static final int SIZE_B = 33;

    private final Map<String, ScrollableSlotArea> scrollableAreas = new HashMap<>();

    /**
     * Client-side reconstruction from the network-assigned container id (see
     * {@link ModMenuTypes}); these throwaway backing containers' contents arrive via the standard
     * slot-sync packets once the server's real menu is registered.
     */
    public TestContainerMenu(int containerId, Inventory playerInventory, RegistryFriendlyByteBuf buf) {
        this(containerId, playerInventory, new SimpleContainer(SIZE_A), new SimpleContainer(SIZE_B));
    }

    /** Server-side construction over the real backing containers. */
    public TestContainerMenu(int containerId, Inventory playerInventory, Container storageA, Container storageB) {
        super(ModMenuTypes.TEST_CONTAINER.get(), containerId);

        SlotAreaSpec areaA = SPEC.container.area("inv_10row");
        int firstIndexA = this.slots.size();
        SpecSlots.forScrollableViewport(areaA, storageA).forEach(this::addSlot);
        scrollableAreas.put(areaA.id, new ScrollableSlotArea(areaA, storageA, this.slots, firstIndexA));

        SlotAreaSpec areaB = SPEC.container.area("inv_second");
        int firstIndexB = this.slots.size();
        SpecSlots.forScrollableViewport(areaB, storageB).forEach(this::addSlot);
        scrollableAreas.put(areaB.id, new ScrollableSlotArea(areaB, storageB, this.slots, firstIndexB));

        SpecSlots.forPlayerInventory(SPEC.container.area("player_inv"), playerInventory).forEach(this::addSlot);
    }

    /** Container A: a 90-slot container filled with a repeating item pattern, so scrolling is visually obvious. */
    public static SimpleContainer demoContainerA() {
        return demoContainer(SIZE_A, Items.DIAMOND, Items.EMERALD, Items.IRON_INGOT, Items.GOLD_INGOT);
    }

    /** Container B: a differently-sized container with a different item pattern, so it's visually distinct from A. */
    public static SimpleContainer demoContainerB() {
        return demoContainer(SIZE_B, Items.REDSTONE, Items.LAPIS_LAZULI);
    }

    private static SimpleContainer demoContainer(int size, Item... pattern) {
        SimpleContainer storage = new SimpleContainer(size);
        for (int i = 0; i < storage.getContainerSize(); i++) {
            storage.setItem(i, new ItemStack(pattern[i % pattern.length]).copyWithCount((i % 64) + 1));
        }
        return storage;
    }

    @Override
    public Map<String, ScrollableSlotArea> scrollableAreas() {
        return scrollableAreas;
    }

    @Override
    public boolean clickMenuButton(Player player, int id) {
        return SpecScroll.handleClickMenuButton(SPEC.container, scrollableAreas, id);
    }

    @Override
    public ItemStack quickMoveStack(Player player, int index) {
        return ItemStack.EMPTY;
    }

    @Override
    public boolean stillValid(Player player) {
        return true;
    }
}
