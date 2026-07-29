# minecraft-mod-ui-builder

A visual designer for Minecraft mod GUI screens, plus a runtime library to consume its output.

**Designer:** https://minecraft-mod-ui-builder.vercel.app/

- **[`webapp/`](webapp/)** — Next.js app for visually laying out a screen (drag/resize widgets on a canvas) and exporting it as `ScreenSpec` JSON.
- **[`neoforge-runtime/`](neoforge-runtime/)** — NeoForge 1.21.5 Java library that reads that JSON at runtime and builds a real `Screen`, so mod developers don't hand-code widget layouts.

Each subproject is released independently (see `release-please-config.json`) with its own version and changelog.

## Workflow

1. Open the [designer](https://minecraft-mod-ui-builder.vercel.app/), lay out your screen with drag-and-drop, then click **Export JSON**.
2. Add the runtime library to your mod (see below) and drop the JSON file into your resources.
3. Extend `SpecScreen` and respond to widget actions — no manual widget positioning needed.

## Using the runtime library in your NeoForge mod

Targets **Minecraft 1.21.5 / NeoForge 21.5.98 / Java 21**.

### 1. Add the dependency

Grab the jar from the [GitHub Releases](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/releases) page and add it via a local or hosted Maven repo:

```gradle
repositories {
    mavenLocal() // or wherever you published the jar
}

dependencies {
    implementation "sheepfromheaven.screenspec:screenspec-neoforge:<version>"
}
```

### 2. Drop in the JSON

Put the file exported by the designer at:

```
src/main/resources/assets/<your_modid>/screenspec/<name>.json
```

### 3. Load and open the screen

```java
ScreenSpec spec = ScreenSpecLoader.fromResource(
    Minecraft.getInstance().getResourceManager(),
    "your_modid",       // your mod's namespace
    "settings_screen"); // filename without .json

SpecScreen screen = new SpecScreen(Component.literal("Settings"), spec);
screen
    .on("save_button",     (id, s, v) -> save())
    .on("volume_slider",   (id, s, v) -> setVolume((Double) v))
    .on("name_input",      (id, s, v) -> setName((String) v))
    .on("hardcore_toggle", (id, s, v) -> setHardcore((Boolean) v));
Minecraft.getInstance().setScreen(screen);
```

Widget ids are exactly what you named them in the designer.
A subclass / `onAction` override is also supported for class-per-screen style — see the [full docs](neoforge-runtime/README.md).

### Widget reference

| Designer widget  | Minecraft widget                  | Notes |
|------------------|-----------------------------------|-------|
| `button`         | `Button`                          | |
| `toggle_button`  | `Button` subclass with selection  | Widgets sharing the same non-empty `group` prop are mutually exclusive (radio group); empty group = independent on/off. |
| `input`          | `EditBox`                         | `max_length` / `hint_text` props applied. |
| `slider`         | `AbstractSliderButton` subclass   | `min` / `max` / `step` / `value` props; `text` is the display template (`%s` → current value). |
| `panel`          | Drawn directly (not a widget)     | Override `renderPanel` to use your mod's texture. |
| `label`          | Drawn directly                    | Honors `color`, `shadow`, `align` props. Override `renderLabel` to customize. |
| `icon`           | Drawn directly                    | Override `resolveIcon` to map an icon id to your mod's `ResourceLocation`. |

Need a custom widget type? Register your own factory:

```java
WidgetFactories.register("my_custom_type", (spec, screen) -> myWidget(spec));
```

## Releases & CI

[release-please](https://github.com/googleapis/release-please) tracks `webapp/` and `neoforge-runtime/` as separate packages. Merging conventional-commit PRs to `main` keeps a per-package release PR (with changelog) up to date; merging *that* PR tags a release (`webapp-vX.Y.Z` or `neoforge-runtime-vX.Y.Z`), which triggers:

- `neoforge-runtime-v*` tag → `.github/workflows/release-neoforge.yml` builds the Gradle project and attaches the jar (+ sources jar) to the GitHub release.
- `webapp-v*` tag → Vercel redeploys automatically on push to `main`.
