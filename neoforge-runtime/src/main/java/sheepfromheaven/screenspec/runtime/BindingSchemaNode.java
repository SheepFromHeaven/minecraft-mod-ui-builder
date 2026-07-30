package sheepfromheaven.screenspec.runtime;

import java.util.Collections;
import java.util.Map;

/**
 * One node in the {@link ScreenSpec#bindingsSchema} tree exported by the MC
 * Screen Designer. Mirrors the {@code BindingNode} type in {@code lib/types.ts}.
 */
public final class BindingSchemaNode {
    /** {@code "string"}, {@code "number"}, or {@code "boolean"}. */
    public String type = "string";
    /**
     * Preview value shown in the designer canvas (not used at runtime).
     * Deserialized as {@code String}, {@code Double}, or {@code Boolean} by Gson.
     */
    public Object previewValue;
    /** Nested child nodes, keyed by their local name segment. */
    public Map<String, BindingSchemaNode> children = Collections.emptyMap();
}
