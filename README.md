# minecraft-mod-ui-builder

A visual designer for Minecraft mod GUI screens, plus a runtime library to consume its output.

- **[`webapp/`](webapp/)** — Next.js app for visually laying out a screen (drag/resize widgets on a canvas) and exporting it as `ScreenSpec` JSON.
- **[`neoforge-runtime/`](neoforge-runtime/)** — NeoForge 1.21.1 Java library that reads that JSON at runtime and builds a real `Screen`, so mod developers don't hand-code widget layouts.

Each subproject is released independently (see `release-please-config.json`) with its own version and changelog.
