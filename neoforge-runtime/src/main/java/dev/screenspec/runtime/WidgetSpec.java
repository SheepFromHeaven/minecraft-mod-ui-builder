package dev.screenspec.runtime;

import java.util.Collections;
import java.util.Map;

/**
 * Mirrors the {@code WidgetSpec} shape produced by the MC Screen Designer web
 * tool (see {@code lib/types.ts}). Field names and JSON shape must stay in
 * sync with that file.
 */
public final class WidgetSpec {
    public String id;
    public String type;
    public int x;
    public int y;
    public int w;
    public int h;
    public String text = "";
    public String icon;
    public String action;
    public Map<String, String> bindings = Collections.emptyMap();
    public Map<String, String> props = Collections.emptyMap();

    public String prop(String key, String fallback) {
        String v = props.get(key);
        return v != null ? v : fallback;
    }

    public int propInt(String key, int fallback) {
        String v = props.get(key);
        if (v == null) return fallback;
        try {
            return Integer.parseInt(v);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    public double propDouble(String key, double fallback) {
        String v = props.get(key);
        if (v == null) return fallback;
        try {
            return Double.parseDouble(v);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    public boolean propBoolean(String key, boolean fallback) {
        String v = props.get(key);
        return v != null ? Boolean.parseBoolean(v) : fallback;
    }
}
