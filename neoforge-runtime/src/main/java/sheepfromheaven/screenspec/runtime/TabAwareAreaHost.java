package sheepfromheaven.screenspec.runtime;

/**
 * Implemented by a mod's {@code AbstractContainerMenu} when one or more of its {@link SlotAreaSpec}
 * areas is nested under a {@code tab} widget, so {@link SpecContainerScreen} can hide/show that
 * area's slots as the active tab changes - see {@link SlotAreaVisibility}.
 */
public interface TabAwareAreaHost {
    /** Shows or hides the named area's slots. {@code areaId} matches {@link SlotAreaSpec#id}. */
    void setAreaVisible(String areaId, boolean visible);
}
