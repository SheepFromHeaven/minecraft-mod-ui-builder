# screenspec-neoforge

Runtime library for NeoForge (Minecraft 1.21.5) that turns the `ScreenSpec`
JSON exported by the MC Screen Designer web tool into a real, working
`Screen` — no codegen, no hand-laid-out widgets.

The exported JSON stays the artifact. This library is the glue that reads it
at runtime and builds vanilla widgets (`Button`, `EditBox`,
`AbstractSliderButton`, ...) positioned exactly as designed.

## Using it in your mod

1. Add the dependency (published to your local Maven repo, or your own repo
   once you host it):

   ```gradle
   repositories {
       mavenLocal() // or your own maven repo once you publish there
   }

   dependencies {
       implementation "dev.screenspec:screenspec-neoforge:1.0.0"
   }
   ```

2. Drop the JSON exported from the designer ("Export JSON" button) into your
   mod's resources at `assets/<your_modid>/screenspec/<name>.json`.

3. Load it and extend `SpecScreen`:

   ```java
   public class MySettingsScreen extends SpecScreen {
       public MySettingsScreen(ScreenSpec spec) {
           super(Component.literal("My Settings"), spec);
       }

       @Override
       protected void onAction(String widgetId, WidgetSpec spec, Object value) {
           switch (widgetId) {
               case "save_button" -> { /* value is null for buttons */ save(); }
               case "volume_slider" -> setVolume((Double) value);
               case "name_input" -> setName((String) value);
               case "hardcore_toggle" -> setHardcore((Boolean) value);
           }
       }
   }
   ```

   ```java
   ScreenSpec spec = ScreenSpecLoader.fromResource(
       Minecraft.getInstance().getResourceManager(), "your_modid", "settings_screen");
   Minecraft.getInstance().setScreen(new MySettingsScreen(spec));
   ```

Widget ids and prop names are exactly what the designer assigns — the widget
you named `save_button` on the canvas is `save_button` in `onAction`.

## Widget mapping

| Designer widget  | Runtime widget                    | Notes |
|------------------|------------------------------------|-------|
| `button`         | `net.minecraft.client.gui.components.Button` | |
| `toggle_button`  | `Button` subclass with selected state | Widgets sharing the same non-empty `group` prop behave as a radio group (mutually exclusive); an empty group makes it an independent on/off toggle. |
| `input`          | `EditBox` | `max_length` / `hint_text` props applied. |
| `slider`         | `AbstractSliderButton` subclass | `min` / `max` / `step` / `value` props applied; `text` is used as the display template (`%s` substituted with the current value). |
| `panel`          | Drawn directly (not a widget) | Default rendering is a flat, loader-neutral box per `style` (`default`/`dark`/`transparent`). Override `SpecScreen.renderPanel` for your mod's real panel texture. |
| `label`          | Drawn directly | Honors `color`, `shadow`, `align` props. Override `SpecScreen.renderLabel` to customize. |
| `icon`           | Drawn directly | No texture is shipped with this library (the designer's placeholder art isn't real game art). Override `SpecScreen.resolveIcon` to map an icon id to your mod's `ResourceLocation`. |

Need a widget type this library doesn't know about? Register your own
factory instead of forking the library:

```java
WidgetFactories.register("my_custom_type", (spec, screen) -> myWidget(spec));
```

## Known limitations (v1)

- Z-order for mixed widget/decoration types is fixed (panels behind all
  widgets, labels/icons in front of all widgets) rather than following
  arbitrary layering from the designer canvas.
- `panel` and `icon` rendering are intentionally minimal placeholders — real
  artwork is mod-specific, so you're expected to override `renderPanel` /
  `resolveIcon`.
- Targets Minecraft 1.21.5 / NeoForge 21.5.98 / Java 21. Porting to another version means bumping `neo_version` and `minecraft_version` in `gradle.properties` and auditing API drift (e.g. `GuiGraphics.blit` changed signature between 1.21.1 and 1.21.5 — always verify against the actual decompiled jar via `javap`).

## Building locally

```
./gradlew build              # produces build/libs/screenspec-neoforge-1.0.0.jar
./gradlew publishToMavenLocal # makes it available as a normal Gradle dependency
```
