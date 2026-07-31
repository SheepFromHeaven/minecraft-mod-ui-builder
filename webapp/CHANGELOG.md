# Changelog

## [0.3.3](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.3.2...webapp-v0.3.3) (2026-07-30)


### Bug Fixes

* **webapp:** don't block editor on full texture set ([b37e389](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/b37e389efc6ea3743b42a9cdc280870e7bea5aa1))
* **webapp:** save new project to localStorage before navigating to editor ([7a6e5a2](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/7a6e5a20852576c7c929806ebf6249be273a457a))

## [0.3.2](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.3.1...webapp-v0.3.2) (2026-07-30)


### Bug Fixes

* **webapp:** prevent infinite loading when IndexedDB is blocked or fails ([ee1d343](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/ee1d343a1fab23e7f163d5faed734647a16f197a))

## [0.3.1](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.3.0...webapp-v0.3.1) (2026-07-30)


### Bug Fixes

* **webapp:** only redirect to setup when setupRequired, not on partial textures ([f3146cd](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/f3146cd5ee448a8ee2b66d47de1b410d33e403fe))

## [0.3.0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.2.0...webapp-v0.3.0) (2026-07-30)


### Features

* add tabs widget with vanilla-accurate rendering, panel fixes, and hot-reload ([8e47175](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/8e47175fe86c2901362afa9d3f75d78bb52bbb1e))
* **webapp:** add docs page and toolbar link ([b2b68e7](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/b2b68e7a99c5e1016cba554f0445dcd61329be91))
* **webapp:** add horizontal scrollbar axis with smart orientation toggle ([ac5854b](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/ac5854b0ddc67f3bfde9be01130940ee9085495d))
* **webapp:** add inventory slot areas, scrollbars, and data-binding tree ([8b578b9](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/8b578b90fb235ed399d9da5cd0f88f2ee068fef5))
* **webapp:** add pixel-art favicon with Minecraft beveled panel ([77fc454](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/77fc454c5b7a37bcbc1504f5e6eb6e4950dd90e9))
* **webapp:** add tab widget canvas rendering with vanilla textures ([b3346a6](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/b3346a6bc03a591a5b140c9e951b7c82c1375185))
* **webapp:** load real MC textures from user-supplied JAR / resource pack ([9e41187](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/9e4118712a6b88299ecc595a7ea8f25d27011bce))
* **webapp:** multi-container export, multi-select layers, scrollbar target dropdown ([3d64529](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/3d64529690573f9e9ed85bb27ad3e9d65ace2953))


### Bug Fixes

* **webapp:** pass onUpdateWidgets prop to Canvas ([fa86d88](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/fa86d883e2ba6e2e1c4f4d97d6cf1b3de6a3a76b))
* **webapp:** prevent uncontrolled input warning in PropertyPanel ([a921e71](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/a921e713b3111bd6d7a8e4daed0f64e8acad0f25))
* **webapp:** serve world background image locally via &lt;img&gt; tag ([f1cf211](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/f1cf2113070fd23e66a27487e73549e8dea60587))

## [0.2.0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.1.0...webapp-v0.2.0) (2026-07-29)


### Features

* **neoforge-runtime:** center screens and render panels with MC nine-slice sprite ([66c4145](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/66c4145e133688f35c54eff3df6539103f657fca))
* **webapp:** add scroll, list, and group container widgets ([bb385dc](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/bb385dc944737bcc3adcf80fdb36f6f791574a6d))
* **webapp:** add widget hierarchy tree with drag-and-drop and grouping ([324c936](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/324c936555143a49fc44d1533b70dc9ae7c2d92d))

## 0.1.0 (2026-07-29)


### Features

* data bindings — push game state into widget properties ([#5](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/5)) ([2dd2ed9](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/2dd2ed9ed80ab1f989cf9943db27be82dd8f22dc))
* global mod ID — auto-qualify binding and action ids ([980bc2d](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/980bc2dbe4f6550659b7b0323431acf4c13b072d))
* **neoforge-runtime:** action listener API on SpecScreen ([#4](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/4)) ([ad5fbf1](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/ad5fbf1c0340ebdfd180d077b84401de204548ec))
* **webapp:** add Google AdSense script to root layout ([237946c](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/237946c1987e04ebe571f61a7e3db5f3ad01f25a))
* **webapp:** add ShadCN UI with dark mode token system ([565da91](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/565da91ee14448a533bc00738a97e6247ad4f922))
* **webapp:** add sidebar, settings dialog, theme provider, and UI polish ([1ea8bec](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/1ea8bec2485329907bebb24a636ce4116181410c))
* **webapp:** collapse texture buttons into Textures dropdown ([5a044bc](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/5a044bc8eb11a57ed4b1464264b4bbc0721e8050))
* **webapp:** disable Text field and show binding id when text is bound ([b878dd8](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/b878dd8f5db7bf82ec73a12d5e93c83dd203653e))
* **webapp:** first-run welcome screen with new project flow ([da32253](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/da32253a8ba3780007e6580ae431a4e4d63b564a))
* **webapp:** migrate sidebar to shadcn Sidebar, auto-fit zoom, 16:9 default canvas ([839d952](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/839d952bf3befb1f167d39e271d50bdcae433a8b))
* **webapp:** replace AdSense script with meta verification tag ([867bc09](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/867bc094227c400cc97382b7a269ac8ecd7af774))


### Bug Fixes

* **webapp:** keep Screen ID and Mod ID in same flex group to prevent wrapping ([3bc2d56](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/3bc2d5665861ee98ec477e711b90d63181323ca7))
* **webapp:** move AdSense script into &lt;head&gt; with beforeInteractive ([b82c9fc](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/b82c9fc181bc126a4c730a6050f6df753ea5cac4))
* **webapp:** prevent undefined screen crash on first-run welcome view ([4067316](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/40673164f765f2bfeff3a686d28b3265c64ec438))
* **webapp:** remove turbopack.root from next.config.ts ([aed38c3](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/aed38c3c671cb1a344e05d22acb58768c6278789))
* **webapp:** simplify bindings UI — replace dropdown+button with + Add binding ([58ab7b1](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/58ab7b1c0eacee7c2a2510285a936797ef5c4c32))
