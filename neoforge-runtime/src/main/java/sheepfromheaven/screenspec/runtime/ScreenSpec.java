package sheepfromheaven.screenspec.runtime;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Mirrors the {@code ScreenSpec} shape exported by the MC Screen Designer web
 * tool (see {@code lib/types.ts}). Field names and JSON shape must stay in
 * sync with that file.
 *
 * <h3>Scoping</h3>
 * <p>If {@link #modId} is set to {@code "mymod"}, a binding property named
 * {@code "player"} with a child {@code "health"} is addressed in Java as
 * {@code "mymod.player.health"}. Use {@link DataRegistry#register(ScreenSpec, String, DataProvider)}
 * to register providers with automatic scoping and schema validation.
 *
 * <p>Actions listed in {@link #actions} follow the same convention: an action
 * named {@code "save"} becomes {@code "mymod.save"} at runtime. Use
 * {@link SpecScreen#onDeclaredAction} to register listeners with validation.
 */
public final class ScreenSpec {
    public String id;
    /** Namespace prepended to binding paths and action ids (e.g. {@code "my_mod"}). */
    public String modId;
    public int width;
    public int height;
    public List<WidgetSpec> widgets = Collections.emptyList();
    /** Present only on screens with inventory slot areas; {@code null} otherwise. */
    public ContainerSpec container;
    /**
     * Declares the data bindings this screen expects. Keys are local path
     * segments; nested paths are expressed as child nodes. Used by
     * {@link DataRegistry#register(ScreenSpec, String, DataProvider)} to
     * validate registrations at startup.
     */
    public Map<String, BindingSchemaNode> bindingsSchema = Collections.emptyMap();
    /**
     * Declares the action ids this screen can fire. Values are local (unscoped)
     * action names. Used by {@link SpecScreen#onDeclaredAction} to validate
     * listener registrations at startup.
     */
    public List<String> actions = Collections.emptyList();

    // ── helpers ──────────────────────────────────────────────────────────────

    /**
     * Returns every dot-separated path defined in {@link #bindingsSchema},
     * without any modId prefix (e.g. {@code ["player", "player.health"]}).
     */
    public Set<String> knownBindingPaths() {
        Set<String> result = new HashSet<>();
        collectPaths(bindingsSchema, "", result);
        return result;
    }

    /**
     * Returns the same paths as {@link #knownBindingPaths()} but prefixed with
     * {@code modId + "."} when {@link #modId} is set (e.g. {@code "mymod.player.health"}).
     */
    public Set<String> qualifiedBindingPaths() {
        Set<String> local = knownBindingPaths();
        if (modId == null || modId.isEmpty()) return local;
        Set<String> result = new HashSet<>(local.size());
        for (String p : local) result.add(modId + "." + p);
        return result;
    }

    /**
     * Returns the declared actions without any modId prefix.
     */
    public Set<String> knownActions() {
        return new HashSet<>(actions);
    }

    /**
     * Returns declared actions prefixed with {@code modId + "."} when
     * {@link #modId} is set.
     */
    public Set<String> qualifiedActions() {
        if (modId == null || modId.isEmpty()) return knownActions();
        Set<String> result = new HashSet<>(actions.size());
        for (String a : actions) result.add(modId + "." + a);
        return result;
    }

    private static void collectPaths(Map<String, BindingSchemaNode> nodes, String prefix, Set<String> out) {
        if (nodes == null) return;
        for (Map.Entry<String, BindingSchemaNode> entry : nodes.entrySet()) {
            String path = prefix.isEmpty() ? entry.getKey() : prefix + "." + entry.getKey();
            out.add(path);
            BindingSchemaNode node = entry.getValue();
            if (node.children != null && !node.children.isEmpty()) {
                collectPaths(node.children, path, out);
            }
        }
    }
}
