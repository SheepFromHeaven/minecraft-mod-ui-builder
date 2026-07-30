# Monorepo layout

This repo has two independently released projects:

- `webapp/` — the Next.js MC Screen Designer (visual editor, exports `ScreenSpec` JSON). See `webapp/CLAUDE.md` / `webapp/AGENTS.md` for Next.js-specific conventions — that Next.js version has breaking API changes from what you may expect, read before editing.
- `neoforge-runtime/` — the NeoForge 1.21.11 Java library that consumes exported `ScreenSpec` JSON at runtime. See `neoforge-runtime/README.md`.

Each has its own release (see `release-please-config.json`) and changelog. Don't let a JSON shape change in one land without checking the other: `webapp/lib/types.ts` and `neoforge-runtime/src/main/java/sheepfromheaven/screenspec/runtime/{ScreenSpec,WidgetSpec}.java` must stay in sync.
