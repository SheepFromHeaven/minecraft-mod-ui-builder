package sheepfromheaven.screenspec.runtime;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Global registry of {@link DataProvider}s that supply live values to bound
 * widget properties. Register once at mod initialisation; every
 * {@link SpecScreen} that references the same provider id will pick it up
 * automatically.
 *
 * <pre>{@code
 * // mod init
 * DataRegistry.register("my_mod:player_health",
 *     () -> String.valueOf((int) Minecraft.getInstance().player.getHealth()));
 *
 * DataRegistry.register("my_mod:difficulty",
 *     () -> Minecraft.getInstance().level.getDifficulty().getKey());
 * }</pre>
 */
public final class DataRegistry {
    private static final Map<String, DataProvider> PROVIDERS = new LinkedHashMap<>();

    private DataRegistry() {}

    /** Registers or replaces a provider under {@code id}. */
    public static void register(String id, DataProvider provider) {
        PROVIDERS.put(id, provider);
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
