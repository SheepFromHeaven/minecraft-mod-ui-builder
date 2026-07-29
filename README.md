# minecraft-mod-ui-builder

A visual designer for Minecraft mod GUI screens, plus a runtime library to consume its output.

- **[`webapp/`](webapp/)** — Next.js app for visually laying out a screen (drag/resize widgets on a canvas) and exporting it as `ScreenSpec` JSON.
- **[`neoforge-runtime/`](neoforge-runtime/)** — NeoForge 1.21.1 Java library that reads that JSON at runtime and builds a real `Screen`, so mod developers don't hand-code widget layouts.

Each subproject is released independently (see `release-please-config.json`) with its own version and changelog.

## Releases & CI

[release-please](https://github.com/googleapis/release-please) tracks `webapp/` and `neoforge-runtime/` as separate packages. Merging conventional-commit PRs to `main` keeps a per-package release PR (with changelog) up to date; merging *that* PR tags a release (`webapp-vX.Y.Z` or `neoforge-runtime-vX.Y.Z`), which triggers:

- `neoforge-runtime-v*` tag → `.github/workflows/release-neoforge.yml` builds the Gradle project and attaches the jar (+ sources jar) to the GitHub release.
- `webapp-v*` tag → `.github/workflows/release-webapp.yml` builds the Next.js app and deploys it to Vercel.

The Vercel workflow needs these repo secrets (from `vercel link` in `webapp/`, then the Vercel dashboard's project settings): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. It also assumes the Vercel project's Root Directory is set to `webapp`.
