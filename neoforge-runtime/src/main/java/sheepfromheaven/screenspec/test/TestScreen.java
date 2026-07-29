package sheepfromheaven.screenspec.test;

import net.minecraft.client.Minecraft;
import net.minecraft.network.chat.Component;
import sheepfromheaven.screenspec.runtime.ScreenSpec;
import sheepfromheaven.screenspec.runtime.SpecScreen;
import sheepfromheaven.screenspec.runtime.WidgetSpec;

import java.util.HashMap;
import java.util.List;

/** Smoke-test screen: exercises button, toggle, label, slider, and input widgets. */
public class TestScreen extends SpecScreen {

    public TestScreen() {
        super(Component.literal("ScreenSpec Test"), buildSpec());
    }

    public static void open() {
        Minecraft.getInstance().setScreen(new TestScreen());
    }

    @Override
    protected void init() {
        super.init();
        on("close_btn", (id, s, v) -> onClose());
        on("toggle_a",  (id, s, v) -> System.out.println("[screenspec-test] toggle_a = " + v));
        on("slider_1",  (id, s, v) -> System.out.println("[screenspec-test] slider   = " + v));
        on("input_1",   (id, s, v) -> System.out.println("[screenspec-test] input    = " + v));
    }

    private static ScreenSpec buildSpec() {
        ScreenSpec spec = new ScreenSpec();
        spec.id     = "test";
        spec.modId  = "screenspec";
        spec.width  = 320;
        spec.height = 180;
        spec.widgets = List.of(
            panel ("bg",       10,  10, 300, 160),
            label ("title",    20,  18, 280,  12, "ScreenSpec runtime test"),
            button("close_btn",20,  38, 100,  20, "Close"),
            toggle("toggle_a", 130, 38, 100,  20, "Toggle A"),
            slider("slider_1", 20,  70, 200,  20, "Volume: %s", 0, 100, 1, 50),
            input ("input_1",  20, 102, 200,  20, "type here…")
        );
        return spec;
    }

    private static WidgetSpec w(String type, String id, int x, int y, int w, int h, String text) {
        WidgetSpec s = new WidgetSpec();
        s.type = type; s.id = id;
        s.x = x; s.y = y; s.w = w; s.h = h; s.text = text;
        s.props = new HashMap<>();
        return s;
    }
    private static WidgetSpec panel(String id, int x, int y, int w, int h) {
        return w("panel", id, x, y, w, h, "");
    }
    private static WidgetSpec label(String id, int x, int y, int w, int h, String text) {
        return w("label", id, x, y, w, h, text);
    }
    private static WidgetSpec button(String id, int x, int y, int w, int h, String text) {
        return w("button", id, x, y, w, h, text);
    }
    private static WidgetSpec toggle(String id, int x, int y, int w, int h, String text) {
        return w("toggle_button", id, x, y, w, h, text);
    }
    private static WidgetSpec slider(String id, int x, int y, int w, int h, String text,
                                     double min, double max, double step, double value) {
        WidgetSpec s = w("slider", id, x, y, w, h, text);
        s.props.put("min",   String.valueOf(min));
        s.props.put("max",   String.valueOf(max));
        s.props.put("step",  String.valueOf(step));
        s.props.put("value", String.valueOf(value));
        return s;
    }
    private static WidgetSpec input(String id, int x, int y, int w, int h, String hint) {
        WidgetSpec s = w("input", id, x, y, w, h, "");
        s.props.put("hint_text", hint);
        return s;
    }
}
