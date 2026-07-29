package sheepfromheaven.screenspec.runtime;

/**
 * Supplies a live string value to a bound widget property each render frame.
 * Register via {@link DataRegistry#register}.
 *
 * <pre>{@code
 * // registration at mod init
 * DataRegistry.register("my_mod:player_health",
 *     () -> String.valueOf((int) Minecraft.getInstance().player.getHealth()));
 * }</pre>
 */
@FunctionalInterface
public interface DataProvider {
    String get();
}
