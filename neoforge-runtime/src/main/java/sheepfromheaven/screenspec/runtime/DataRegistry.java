package sheepfromheaven.screenspec.runtime;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Global registry of {@link DataProvider}s that supply live values to bound
 * widget properties. Register once at mod initialisation; every
 * {@link SpecScreen} that references the same provider id will pick it up
 * automatically.
 *
 * <h3>Unvalidated (legacy) registration</h3>
 * <pre>{@code
 * DataRegistry.register("my_mod.player_health",
 *     () -> String.valueOf((int) Minecraft.getInstance().player.getHealth()));
 * }</pre>
 *
 * <h3>Validated, schema-scoped registration (preferred)</h3>
 * <pre>{@code
 * // spec has modId = "my_mod" and bindingsSchema contains "player.health"
 * DataRegistry.register(spec, "player.health",
 *     () -> String.valueOf((int) Minecraft.getInstance().player.getHealth()));
 * // → registered as "my_mod.player.health"; throws if path not in schema
 * }</pre>
 */
public final class DataRegistry {
    private static final Map<String, DataProvider> PROVIDERS = new LinkedHashMap<>();

    private DataRegistry() {}

    /** Registers or replaces a provider under the given fully-qualified {@code id}. */
    public static void register(String id, DataProvider provider) {
        PROVIDERS.put(id, provider);
    }

    /**
     * Validated, scoped registration. Checks that {@code localPath} is declared
     * in {@code spec}'s {@link ScreenSpec#bindingsSchema}, then registers the
     * provider under {@code spec.modId + "." + localPath} (or just
     * {@code localPath} when {@code modId} is absent).
     *
     * <p>Throws {@link IllegalArgumentException} at startup time if the path is
     * unknown — catching misconfiguration before the game runs.
     *
     * <pre>{@code
     * // spec has modId="my_mod", bindingsSchema contains "player.health"
     * DataRegistry.register(spec, "player.health",
     *     () -> String.valueOf((int) mc.player.getHealth()));
     * // → stored as "my_mod.player.health"
     * }</pre>
     */
    public static void register(ScreenSpec spec, String localPath, DataProvider provider) {
        Set<String> known = spec.knownBindingPaths();
        if (!known.isEmpty() && !known.contains(localPath)) {
            throw new IllegalArgumentException(
                "Binding path \"" + localPath + "\" is not declared in screen \""
                + spec.id + "\". Known paths: " + known
            );
        }
        String qualified = (spec.modId != null && !spec.modId.isEmpty())
            ? spec.modId + "." + localPath
            : localPath;
        PROVIDERS.put(qualified, provider);
    }

    /**
     * Calls the provider registered under {@code id} and returns its value.
     * Returns {@code null} if no provider is registered for {@code id}.
     */
    public static String resolve(String id) {
        DataProvider provider = PROVIDERS.get(id);
        return provider != null ? provider.get() : null;
    }

    /** Removes the provider registered under {@code id}, if any. */
    public static void unregister(String id) {
        PROVIDERS.remove(id);
    }
}
