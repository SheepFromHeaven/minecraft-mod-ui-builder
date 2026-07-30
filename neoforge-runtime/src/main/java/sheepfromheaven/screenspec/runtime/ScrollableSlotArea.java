package sheepfromheaven.screenspec.runtime;

import net.minecraft.core.NonNullList;
import net.minecraft.world.Container;
import net.minecraft.world.inventory.Slot;

/**
 * Vertical scroll state for one {@link SlotAreaSpec} bound to a runtime-sized {@link Container} -
 * built via {@link SpecSlots#forScrollableViewport}, whose row count is derived from
 * {@code container.getContainerSize()} rather than anything the designer authored, since the real
 * inventory (a custom block's container, sized however that mod likes) is only known once the mod
 * actually hooks it up. It scrolls whenever that turns out to be more rows than
 * {@code area.viewport_rows} can show at once.
 *
 * <p>{@link Slot#x} and {@link Slot#y} are {@code final} in vanilla, so a scroll can't reposition
 * existing {@link Slot}s - instead this replaces the area's entries in the owning
 * {@code AbstractContainerMenu#slots} list with fresh {@link Slot}s pointing at whichever
 * container indices are now in view. The list index (and therefore the slot's network id) never
 * changes, only which item it displays, so this stays transparent to menu synchronization.
 *
 * <p>The mod's {@code AbstractContainerMenu} subclass owns one of these per scrollable area,
 * built right after adding that area's initial (scroll row 0) slots:
 *
 * <pre>{@code
 * public class MyMenu extends AbstractContainerMenu implements ScrollableAreaHost {
 *     private final Map<String, ScrollableSlotArea> scrollableAreas = new HashMap<>();
 *
 *     public MyMenu(..., ScreenSpec spec, Container input) {
 *         super(...);
 *         SlotAreaSpec area = spec.container.area("input");
 *         int firstIndex = this.slots.size();
 *         SpecSlots.forScrollableViewport(area, input).forEach(this::addSlot);
 *         scrollableAreas.put(area.id, new ScrollableSlotArea(area, input, this.slots, firstIndex));
 *     }
 *
 *     @Override
 *     public Map<String, ScrollableSlotArea> scrollableAreas() {
 *         return scrollableAreas;
 *     }
 *
 *     @Override
 *     public boolean clickMenuButton(Player player, int id) {
 *         return SpecScroll.handleClickMenuButton(spec.container, scrollableAreas, id);
 *     }
 * }
 * }</pre>
 */
public final class ScrollableSlotArea {
    /** Off-screen so it's neither visible nor reachable by the mouse - see reposition(). */
    static final int OFFSCREEN = -100_000;

    private final SlotAreaSpec area;
    private final Container container;
    private final NonNullList<Slot> menuSlots;
    private final int firstIndex;
    private final int totalRows;
    private final int visibleRows;
    private int scrollRow = 0;

    public ScrollableSlotArea(SlotAreaSpec area, Container container, NonNullList<Slot> menuSlots, int firstIndex) {
        this.area = area;
        this.container = container;
        this.menuSlots = menuSlots;
        this.firstIndex = firstIndex;
        this.totalRows = area.totalRows(container.getContainerSize());
        this.visibleRows = Math.min(area.viewport_rows, totalRows);
    }

    public SlotAreaSpec area() {
        return area;
    }

    /** The topmost data row currently visible. */
    public int scrollRow() {
        return scrollRow;
    }

    /** The real container's row count, derived from its actual size - not anything authored. */
    public int totalRows() {
        return totalRows;
    }

    /** Rows actually shown at once - {@code min(area.viewport_rows, totalRows())}. */
    public int visibleRows() {
        return visibleRows;
    }

    public int maxScrollRow() {
        return Math.max(0, totalRows - area.viewport_rows);
    }

    /** Whether the real container turned out bigger than the viewport - i.e. whether this needs a scrollbar at all. */
    public boolean scrollable() {
        return maxScrollRow() > 0;
    }

    /** Current scroll position as a 0..1 fraction of {@link #maxScrollRow()} (0 if there's no travel). */
    public double scrollPct() {
        int max = maxScrollRow();
        return max == 0 ? 0 : (double) scrollRow / max;
    }

    /** Scrolls to an absolute data row, clamped to {@code [0, maxScrollRow()]}. */
    public void setScrollRow(int row) {
        int clamped = Math.max(0, Math.min(maxScrollRow(), row));
        if (clamped == scrollRow) {
            return;
        }
        scrollRow = clamped;
        reposition();
    }

    /** Scrolls to the row nearest {@code pct * maxScrollRow()}, matching the designer's row-snapping. */
    public void setScrollPct(double pct) {
        setScrollRow((int) Math.round(clamp(pct, 0, 1) * maxScrollRow()));
    }

    public void scrollBy(int deltaRows) {
        setScrollRow(scrollRow + deltaRows);
    }

    private void reposition() {
        int cols = area.cols;
        int size = container.getContainerSize();
        for (int viewRow = 0; viewRow < visibleRows; viewRow++) {
            for (int col = 0; col < cols; col++) {
                int dataIndex = (scrollRow + viewRow) * cols + col;
                int slotListIndex = firstIndex + viewRow * cols + col;
                menuSlots.set(slotListIndex, slotFor(dataIndex, col, viewRow, size));
            }
        }
    }

    /** A slot for {@code dataIndex}, or an inert off-screen one past the container's real size (e.g. a partial last row). */
    private Slot slotFor(int dataIndex, int col, int viewRow, int size) {
        if (dataIndex < size) {
            return new Slot(container, dataIndex, area.slotX(col), area.slotY(viewRow));
        }
        return new Slot(container, Math.max(0, size - 1), OFFSCREEN, OFFSCREEN);
    }

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }
}
