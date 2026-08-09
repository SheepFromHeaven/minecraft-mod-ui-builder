# Changelog

## [0.12.0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.11.0...webapp-v0.12.0) (2026-08-09)


### Features

* **webapp:** add PostHog analytics with cookie consent gate ([#68](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/68)) ([26f3823](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/26f3823e4e6a118ac9682981e65b20f61d41bec9))

## [0.11.0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.10.0...webapp-v0.11.0) (2026-08-08)


### Features

* **webapp:** move screen import/export into sidebar ([#59](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/59)) ([2bbe6e2](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/2bbe6e27c64029fe41e4327efdffa763838161b7))


### Bug Fixes

* correct top-row texture sampling for inactive nested tabs ([#61](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/61)) ([a00f0b6](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/a00f0b61d19e92d9274b5c1f8e3aa871edad44ec))
* round alignment coordinates and expose SpecContainerScreen accessors ([#62](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/62)) ([a4befaf](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/a4befafd98d8488119f6fdfbea8275a4ecd8fd37))

## [0.10.0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.9.1...webapp-v0.10.0) (2026-08-08)


### Features

* **webapp:** allow reordering screens via drag and drop ([#57](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/57)) ([dab72d9](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/dab72d9e68cde40f8dbe68f575c7293e7fd005bf))
* **webapp:** axis-lock drag, snap guides, and multi-select group drag ([#56](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/56)) ([6cd4173](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/6cd4173402e0e620ca502c356040d83130f1fc95))

## [0.9.1](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.9.0...webapp-v0.9.1) (2026-08-08)


### Bug Fixes

* **webapp:** keep widget selected while editing its ID field ([#54](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/54)) ([6256f70](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/6256f708e14e836c3dfc445fcc6e57b2a3200187))

## [0.9.0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.8.0...webapp-v0.9.0) (2026-08-08)


### Features

* **webapp:** add load-project from JSON on home screen; fix Turbopack sandbox crash ([951beac](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/951beace402771f7e7eb7f469ae701bb5df44588))


### Bug Fixes

* **webapp:** fix alt+resize bugs — cross-axis snap, position jump, and parent bounds clamp ([9775c51](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/9775c5112d9756830b975dd870d931d9e30eab35))

## [0.8.0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.7.0...webapp-v0.8.0) (2026-08-04)


### Features

* **webapp:** add project-level export/import with format migrations ([#49](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/49)) ([0dce10e](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/0dce10e809486128c3ac0f94991655590a8882c9))

## [0.7.0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.6.0...webapp-v0.7.0) (2026-08-04)


### Features

* add custom widget type ([#37](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/37)) ([42121de](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/42121deeb6b4336fcec22c4f45bfa4247decc0da))
* add progress widget ([#33](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/33)) ([bfddc21](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/bfddc214c55b8926dc0933129ad9bf05c3dd5783))
* add requirement widget type ([#36](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/36)) ([29242c9](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/29242c95c5056364b043cbe925e99865e599aa0c))
* conditional widget rendering via visible bindings ([#45](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/45)) ([5f3631a](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/5f3631a2b19cbff4b0257a915ca2002ad0a4b0d2))

## [0.6.0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.5.0...webapp-v0.6.0) (2026-08-02)


### Features

* **editor:** allow creating actions inline from the Action dropdown ([efa1998](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/efa1998b87c8ba370952c7f48b9a1667c14ee680))
* **editor:** generate widget IDs with per-type counters starting at 1 ([121d9f6](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/121d9f6cddef6d44f05ac2f9ea09e87a034f963c))
* **webapp:** add checkbox widget with texture-based visual ([24de6d1](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/24de6d1007cd072820dab84c98d990c574df7e37))
* **webapp:** add copy Java class definition toolbar action ([eac7d3a](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/eac7d3a4af207d6059482fd4cebbbbb9110d7aaa))
* **webapp:** add middle-mouse pan and scroll-to-zoom on canvas; fix viewport height and history bug ([16d68e6](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/16d68e6275e4dfd3f1b2bc8fd47f6cccc7f8be12))
* **webapp:** add per-widget visibility toggle in layers panel ([dde6767](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/dde67671d34e028f3c7f325101a89714db505c9c))
* **webapp:** add vertical alignment prop to label widget ([1452358](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/14523585fe81e632f79f703c8883c0765db25a8e))
* **webapp:** auto-load default textures from GitHub instead of requiring upload ([7b5bd1d](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/7b5bd1d87ed49cfb2dc95aa6830108026f29d7f2))
* **webapp:** extract checkbox+tab textures from pack; drop bundled asset fallbacks ([866f23a](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/866f23a0a5a451bdb3b1fc6918674f5e5f44a204))
* **webapp:** nested tabs widget with visual and e2e tests ([e4e3e64](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/e4e3e64e2350b589ca88ba83d15c80e4c1067292))
* **webapp:** refactor canvas to CSS transform scale; replace border-image with NineSlice divs for tabs; switch to advancements tab textures ([a33e807](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/a33e807a78d544c38db9bf717834d9a3e352fa3a))
* **webapp:** rework property panel UX ([be56340](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/be56340630bfd433576cfe0f8cf69f360f376dd2))
* **webapp:** show toast when a widget action fires in try mode ([#31](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/issues/31)) ([d827e67](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/d827e67b4b1ee430745c2021292844e1fe2ff66a))


### Bug Fixes

* **canvas:** remove stale transform clear on resize end; fix layer tree cursor state ([5006bad](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/5006bada07b876e3d29784a3148368d979d647b8))
* **webapp:** add @types/pngjs to fix Vercel build type error ([64843c0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/64843c01d5f1105906cc6d88dd43b5a06216e17c))
* **webapp:** add linux visual baselines and fix tab header click selection ([a69f6ef](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/a69f6efa4b832e3c41c2982581d4183f6eb70a4c))
* **webapp:** checkbox defaults and property panel cleanup ([3d1ff6e](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/3d1ff6ee29101cc0b395e421d7604a6dc8782f38))
* **webapp:** clamp widget position/size to parent container bounds ([a98ae4c](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/a98ae4c7eb0a7dc99c672262fba622d623879e86))
* **webapp:** click on canvas wrapper background deselects active widget ([2d350a8](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/2d350a8a7238d28386a6fb9f252bc8f58be8927b))
* **webapp:** fix two failing tab e2e tests ([9cc955d](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/9cc955df9c379fdcc0e62bb0781e3fa4744df69c))
* **webapp:** hide expand chevron in layers panel when container has no children ([e1c54e8](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/e1c54e8c2c8f52d9c9d8c24600534abefbf6bf21))
* **webapp:** prevent double-click from entering edit mode when selection was just established ([e003b6b](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/e003b6b576b4454670b54416e14546e11fb2301e))
* **webapp:** round zoom percentage shown in toolbar ([f947598](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/f947598eb11ef9a1492af4f67df9a88c2f8fee5b))

## [0.5.0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.4.0...webapp-v0.5.0) (2026-07-31)


### Features

* **canvas:** right-click opens add-widget context menu at click position ([88b2838](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/88b28381e29879b078ba0d08998c3a1a253c58fa))
* **canvas:** shift locks aspect ratio, alt resizes from center during widget resize ([033a5f1](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/033a5f1bce17c9b4512c7deb52e03b6a0d048a09))

## [0.4.0](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/compare/webapp-v0.3.3...webapp-v0.4.0) (2026-07-31)


### Features

* **webapp:** add Sprite widget with pack texture picker ([f00a0ca](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/f00a0ca023dd3e893a14ca78527b041fe8a78217))
* **webapp:** extract all textures from pack, not just gui and item ([5e81ae5](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/5e81ae56ffbcbf6c75eae0e0f377d70f32c9a65a))
* **webapp:** preview fills container at 90%; sprite auto-sizes to texture dimensions on select ([abd163f](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/abd163f6008442f9b01a5b8c4f925c6c6d544570))
* **webapp:** replace texture select list with modal grid picker ([b19366f](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/b19366fe14533ec1b1d3fb0bff5d6d4e12101000))
* **webapp:** replace texture select list with modal grid picker ([f028d6f](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/f028d6fbb2f2e05975f66323f81aa72617326eed))
* **webapp:** resizable columns in texture picker modal ([0f4a748](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/0f4a7489dc6298dd53299e7dfb00392c28c19955))
* **webapp:** store and expose raw gui/item textures from extracted pack ([3f6af06](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/3f6af06082acca483b425919177611d09fbd3977))


### Bug Fixes

* **webapp:** pointer cursor and 'Change texture' title on texture preview ([428ad6a](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/428ad6aa5366088ed710a0bdf4ed4e9076910825))
* **webapp:** prevent native browser image drag from hijacking canvas mouse tracking ([2ef3c81](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/2ef3c813513004200f55944ff8675f03d0e69665))
* **webapp:** preview only updates on select, not on hover ([f941a67](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/f941a671c7d54e98cec7cd6774e8e412e1f7e6e8))
* **webapp:** remove sm:max-w-sm default from DialogContent so callers can set their own width ([025fc5e](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/025fc5e344761a8dd21f304c919f6b077f8a8a9c))
* **webapp:** snap-to-grid drag and toolbar stepper cleanup ([c2cddb2](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/c2cddb2ea55ef1b9ad6826247e474b15bbe3d5fb))
* **webapp:** texture preview fills panel with correct aspect ratio; click to open picker ([d691214](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/d691214c9612c084bcd6a478dc5928be51c22a53))
* **webapp:** widen texture picker modal to 90vw with larger tiles ([5d4b28c](https://github.com/SheepFromHeaven/minecraft-mod-ui-builder/commit/5d4b28cff8302dd8d30ba5830693c387c0216d0a))

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
