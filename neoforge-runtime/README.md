# screenspec-neoforge

Runtime library for NeoForge (Minecraft 1.21.5) that turns the `ScreenSpec`
JSON exported by the [MC Screen Designer](https://minecraft-mod-ui-builder.vercel.app/)
into a real, working `Screen` — no codegen, no hand-laid-out widgets.

**Targets:** Minecraft 1.21.5 / NeoForge 21.5.98 / Java 21

---

## Table of contents

1. [Installation](#installation)
2. [Quick start](#quick-start)
3. [Handling widget events](#handling-widget-events)
   - [Listener API (recommended)](#listener-api-recommended)
   - [Declarative actions in JSON](#declarative-actions-in-json)
   - [Subclass hook](#subclass-hook)
4. [Data bindings — game state into widgets](#data-bindings--game-state-into-widgets)
5. [Widget reference](#widget-reference)
6. [Widget props reference](#widget-props-reference)
7. [Extending and customising](#extending-and-customising)
8. [Known limitations](#known-limitations)
9. [Building locally](#building-locally)

---

## Installation

Grab the jar from [GitHub Releases](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/releases)
and add it to your mod's `build.gradle`:

```gradle
repositories {
    mavenLocal() // or wherever you published / vendored the jar
}

dependencies {
    implementation "sheepfromheaven.screenspec:screenspec-neoforge:<version>"
}
```

---

## Quick start

**1. Export** your screen from the designer — click "Export JSON" — and drop
the file into your mod's resources:

```
src/main/resources/assets/<your_modid>/screenspec/<name>.json
```

**2. Load** the spec at runtime:

```java
ScreenSpec spec = ScreenSpecLoader.fromResource(
    Minecraft.getInstance().getResourceManager(),
    "your_modid",        // your mod's namespace
    "settings_screen");  // filename without .json
```

**3. Open** the screen:

```java
SpecScreen screen = new SpecScreen(Component.literal("Settings"), spec);
Minecraft.getInstance().setScreen(screen);
```

That's it — widgets are positioned and sized exactly as they appear in the
designer. Wire up behavior using listeners (see below).

---

## Handling widget events

Every interactive widget fires an event when the player uses it. There are
three ways to handle those events; they can be combined freely.

### Listener API (recommended)

Register lambdas on the `SpecScreen` instance. No subclassing required.

```java
SpecScreen screen = new SpecScreen(Component.literal("Settings"), spec);

screen
    .on("save_btn",    (id, s, v) -> save())
    .on("cancel_btn",  (id, s, v) -> onClose())
    .on("volume",      (id, s, v) -> setVolume((Double) v))
    .on("name_input",  (id, s, v) -> setName((String) v))
    .on("hardcore",    (id, s, v) -> setHardcore((Boolean) v));

Minecraft.getInstance().setScreen(screen);
```

The key passed to `on()` matches either the **widget id** (assigned in the
designer) or the widget's **action id** (set via the `action` field — see
below). Both are checked on every event, so either key works.

Use `onAny` to observe all events (useful for logging or analytics):

```java
screen.onAny((id, spec, value) -> LOGGER.debug("action: {} = {}", id, value));
```

**Value types by widget:**

| Widget | Value type | Notes |
|--------|-----------|-------|
| `button` | `null` | fires on click |
| `toggle_button` | `Boolean` | `true` = selected |
| `input` | `String` | fires on every keystroke |
| `slider` | `Double` | current value within min–max range |

### Declarative actions in JSON

Set an `action` field on any widget in the designer's property panel.
The value is any string you choose; it is dispatched in addition to the widget
id, so a single listener can react to many widgets sharing the same action.

Built-in action ids handled automatically (no listener needed):

| Action id | Effect |
|-----------|--------|
| `close` | Closes the screen (`onClose()`) |

Example JSON fragment:
```json
{ "id": "quit_btn", "type": "button", "text": "Quit", "action": "close" }
```

Custom action ids — register a listener on the action id and reuse it across
any screen that declares the same action:

```json
{ "id": "btn1", "type": "button", "text": "Save", "action": "my_mod:save_config" }
```

```java
screen.on("my_mod:save_config", (id, s, v) -> saveConfig());
```

**Dispatch order** for each event:
1. Built-in action handler (if `action` matches a built-in id)
2. Listeners registered for the `action` id
3. Listeners registered for the widget id
4. Global `onAny` listeners
5. `onAction` subclass hook

### Subclass hook

If you prefer a class-per-screen style, extend `SpecScreen` and override
`onAction`:

```java
public class SettingsScreen extends SpecScreen {
    public SettingsScreen(ScreenSpec spec) {
        super(Component.literal("Settings"), spec);
    }

    @Override
    protected void onAction(String widgetId, WidgetSpec spec, Object value) {
        switch (widgetId) {
            case "save_btn"   -> save();
            case "volume"     -> setVolume((Double) value);
            case "name_input" -> setName((String) value);
            case "hardcore"   -> setHardcore((Boolean) value);
        }
    }
}
```

`onAction` fires after all listeners, so both approaches work side-by-side.

---

## Data bindings — game state into widgets

Bindings push live values from your mod into widget properties every render
frame — no polling, no manual widget updates.

### 1. Register a provider at mod init

```java
DataRegistry.register("my_mod:player_health",
    () -> String.valueOf((int) Minecraft.getInstance().player.getHealth()));

DataRegistry.register("my_mod:difficulty",
    () -> Minecraft.getInstance().level.getDifficulty().getKey());
```

Providers are plain lambdas — they have closure access to anything in scope.

### 2. Declare bindings in the designer

Open the property panel for any widget and use the **Bindings** section to
map a binding target to a provider id. The binding is stored in the exported
JSON under `bindings`:

```json
{ "id": "health_label", "type": "label", "text": "HP",
  "bindings": { "text": "my_mod:player_health" } }

{ "id": "save_btn", "type": "button", "text": "Save",
  "bindings": { "enabled": "my_mod:has_changes" } }
```

### Supported binding targets

| Target | Applies to | Effect |
|--------|-----------|--------|
| `text` | `label`, `button`, `toggle_button`, `input` | Replaces displayed text each frame |
| `enabled` | `button`, `toggle_button`, `input`, `slider` | Enables/disables widget (`"true"` / `"false"`) |
| `visible` | all types | Shows/hides widget (`"true"` / `"false"`) |

---

## Widget reference

| Designer type | Minecraft class | Event value |
|---------------|-----------------|-------------|
| `button` | `Button` | `null` |
| `toggle_button` | `Button` subclass | `Boolean` (selected state) |
| `input` | `EditBox` | `String` (current text) |
| `slider` | `AbstractSliderButton` subclass | `Double` (current value) |
| `panel` | Drawn directly | — |
| `label` | Drawn directly | — |
| `icon` | Drawn directly | — |

`panel`, `label`, and `icon` are not interactive widgets — they are drawn
directly by `SpecScreen` and never fire events.

---

## Widget props reference

Props are set in the designer's property panel and serialised under `props` in
the JSON. All values are strings; the library parses them to the right type.

### `button`
_(no props beyond the common fields)_

### `toggle_button`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `group` | string | `""` | Widgets sharing the same non-empty group are mutually exclusive (radio group). Empty = independent on/off toggle. |

### `input`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `max_length` | int | `32` | Maximum character count. |
| `hint_text` | string | `""` | Placeholder shown when empty. |

### `slider`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `min` | double | `0` | Minimum value. |
| `max` | double | `100` | Maximum value. |
| `step` | double | `1` | Snap increment. |
| `value` | double | `min` | Initial value. |
| `text` | string | `"%s"` | Display template — `%s` is replaced with the formatted value. |

### `panel`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `style` | `default` \| `dark` \| `transparent` | `default` | Background fill style. Override `renderPanel` to use your mod's texture. |

### `label`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | int (hex) | `0x404040` | Text colour. |
| `shadow` | boolean | `false` | Drop shadow. |
| `align` | `left` \| `center` \| `right` | `left` | Horizontal alignment within the widget bounds. |

### `icon`

_(no props — see [Extending and customising](#extending-and-customising) for how to render icons)_

---

## Extending and customising

### Rendering custom panel textures

```java
public class MyScreen extends SpecScreen {
    private static final ResourceLocation PANEL =
        ResourceLocation.fromNamespaceAndPath("my_mod", "textures/gui/panel.png");

    public MyScreen(ScreenSpec spec) {
        super(Component.literal("My Screen"), spec);
    }

    @Override
    protected void renderPanel(GuiGraphics g, WidgetSpec w) {
        g.blit(RenderType::guiTextured, PANEL, w.x, w.y, 0f, 0f, w.w, w.h, w.w, w.h);
    }
}
```

### Rendering icons

`resolveIcon` maps the `icon` id set in the designer to a `ResourceLocation`.
Return `null` to skip rendering.

```java
@Override
protected ResourceLocation resolveIcon(WidgetSpec w) {
    return switch (w.icon) {
        case "sword" -> ResourceLocation.fromNamespaceAndPath("my_mod", "textures/gui/icons/sword.png");
        default      -> null;
    };
}
```

### Custom widget types

Register a factory once at mod initialisation; it is available to every screen.

```java
WidgetFactories.register("my_custom_type", (spec, screen) -> {
    // build and return any AbstractWidget
    return new MyCustomWidget(spec.x, spec.y, spec.w, spec.h);
});
```

### Looking up a widget by id

```java
EditBox nameBox = screen.getWidget("name_input");
nameBox.setValue("default name");
```

---

## Known limitations

- **Z-order** is fixed: panels are drawn behind all interactive widgets;
  labels and icons are drawn in front. Arbitrary layering from the designer
  canvas is not yet supported.
- **`panel` and `icon` rendering** are intentional placeholders — real artwork
  is mod-specific; override `renderPanel` / `resolveIcon` for your textures.
- **Porting to other MC versions** means updating `neo_version` and
  `minecraft_version` in `gradle.properties` and auditing API drift (e.g.
  `GuiGraphics.blit` changed signature between 1.21.1 and 1.21.5 — always
  verify against the actual decompiled jar via `javap`).

---

## Building locally

```
cd neoforge-runtime
./gradlew build               # produces build/libs/screenspec-neoforge-<version>.jar
./gradlew publishToMavenLocal # installs to ~/.m2 for local testing
```
