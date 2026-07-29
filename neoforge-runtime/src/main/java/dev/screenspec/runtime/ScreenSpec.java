package dev.screenspec.runtime;

import java.util.Collections;
import java.util.List;

/**
 * Mirrors the {@code ScreenSpec} shape exported by the MC Screen Designer web
 * tool (see {@code lib/types.ts}). Field names and JSON shape must stay in
 * sync with that file.
 */
public final class ScreenSpec {
    public String id;
    /** Namespace prepended to unqualified binding/action ids (e.g. {@code "my_mod"}). */
    public String modId;
    public int width;
    public int height;
    public List<WidgetSpec> widgets = Collections.emptyList();
}
