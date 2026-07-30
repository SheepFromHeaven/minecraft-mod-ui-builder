package sheepfromheaven.screenspec.runtime;

import com.google.gson.Gson;
import net.minecraft.resources.Identifier;
import net.minecraft.server.packs.resources.Resource;
import net.minecraft.server.packs.resources.ResourceManager;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Reads {@code ScreenSpec} JSON exported by the MC Screen Designer web tool.
 */
public final class ScreenSpecLoader {
    private static final Gson GSON = new Gson();

    private ScreenSpecLoader() {}

    public static ScreenSpec fromJson(String json) {
        ScreenSpec spec = GSON.fromJson(json, ScreenSpec.class);
        if (spec == null) throw new IllegalArgumentException("Empty ScreenSpec JSON");
        validate(spec);
        return spec;
    }

    public static ScreenSpec fromReader(Reader reader) {
        ScreenSpec spec = GSON.fromJson(reader, ScreenSpec.class);
        if (spec == null) throw new IllegalArgumentException("Empty ScreenSpec JSON");
        validate(spec);
        return spec;
    }

    private static void validate(ScreenSpec spec) {
        if (spec.container != null) {
            spec.container.validate();
        }
    }

    /**
     * Loads a screen from a mod's resources at
     * {@code assets/<namespace>/screenspec/<name>.json}, e.g.
     * {@code ScreenSpecLoader.fromResource(manager, "mymod", "settings_screen")}.
     */
    public static ScreenSpec fromResource(ResourceManager resourceManager, String namespace, String name) {
        Identifier location = Identifier.fromNamespaceAndPath(namespace, "screenspec/" + name + ".json");
        Optional<Resource> resource = resourceManager.getResource(location);
        if (resource.isEmpty()) {
            throw new IllegalArgumentException("No ScreenSpec resource at " + location);
        }
        try (BufferedReader reader = resource.get().openAsReader()) {
            return fromReader(reader);
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read ScreenSpec resource at " + location, e);
        }
    }

    /**
     * Loads a screen straight off the classpath at {@code assets/<namespace>/screenspec/<name>.json},
     * for code that runs on the (resource-manager-less) logical server - e.g. a menu built from a
     * {@code MenuProvider}. Client code with a live {@link ResourceManager} should prefer
     * {@link #fromResource}, which honors resource pack overrides.
     */
    public static ScreenSpec fromClasspath(String namespace, String name) {
        String path = "assets/" + namespace + "/screenspec/" + name + ".json";
        try (InputStream in = ScreenSpecLoader.class.getClassLoader().getResourceAsStream(path)) {
            if (in == null) {
                throw new IllegalArgumentException("No ScreenSpec resource on classpath at " + path);
            }
            return fromReader(new InputStreamReader(in, StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read ScreenSpec resource at " + path, e);
        }
    }
}
