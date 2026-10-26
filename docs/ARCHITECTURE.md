# Red Graphite architecture

This document records the stable design decisions behind Red Graphite 2. The current test status belongs in [`QA.md`](./QA.md), not here.

## Appearance contract

Red Graphite supports three states:

| State | Host frame | Central workspace | `color-scheme` |
| --- | --- | --- | --- |
| Obsidian Dark | Graphite dark | Light | Dark host, light center |
| Dark + `red-graphite-dark-document` | Graphite dark | Dark | Dark |
| Obsidian Light | Light | Light | Light |

The first row is the flagship appearance. It uses real Obsidian Dark mode so sidebars and sidebar plugins receive the dark-mode environment they expect. The central root workspace then overrides the complete semantic palette with light values. Tabs belong visually to the document rail, while menus, prompts, popovers, modals, ribbons, and sidebars remain global framing surfaces.

CSS cannot assign a `.theme-light` body class to a subtree. A plugin that hardcodes `body.theme-dark` selectors can therefore defeat the central light palette even when all semantic variables are correct.

## Palette model

The configurable base tokens are:

- frame base;
- light document base; and
- dark document base.

The Sass palette mixins derive Obsidian semantic variables for backgrounds, text, borders, interaction states, forms, metadata, code, and other surfaces. Obsidian's native Accent color remains the global accent. Theme component tokens such as the H1 color or active-tab indicator inherit that accent unless the user overrides them through Style Settings.

Do not revive the old inverted base-color scale or the legacy Red Graphite dark-mode colors.

## Source organization

The build entry point is `src/scss/index.scss`:

1. `theme/_tokens.scss` defines configurable defaults.
2. `theme/_modes.scss` applies palettes and workspace scope.
3. `theme/_components.scss` styles core UI and Markdown.
4. `theme/_mobile.scss` handles drawers, safe areas, and mobile geometry.
5. `plugins/_<plugin>.scss` contains justified compatibility exceptions.
6. `plugins/_style-settings.scss` styles the Style Settings plugin interface.

`src/css/style-settings.css` is the Style Settings metadata schema. The Node build compiles Sass, appends that schema, and writes deterministic expanded CSS to the tracked root `theme.css`.

## Selector strategy

Use documented Obsidian semantic variables wherever possible. When selectors are unavoidable:

- scope local document rules beneath `.workspace-split.mod-root`;
- keep sidebar leaves on the host palette;
- cover third-party central views, not only Markdown views;
- avoid brittle DOM-depth and plugin-class assumptions; and
- explain non-obvious selectors in source comments.

The window controls and status bar sit outside `.workspace`; the macOS right-sidebar toggle is fixed over the tab rail and can also inherit the host palette. In the flagship state, their palette follows whether the right sidebar is open so no isolated dark rectangle remains beside a light center. This currently requires a narrowly scoped `:has()` state selector and must be tested after Obsidian UI changes. Rebind the toggle's `--tab-container-background` locally because Obsidian assigns that token directly to the control.

Obsidian 1.14.5 uses `--tab-inner-background-hover` for inactive tab hover. Rebind this semantic token at each palette boundary: an alias inherited from `body` has already resolved against the host palette and will not follow the light center's `--background-modifier-hover` automatically.

The same rule applies to completed-task text and unresolved-link colors. Bind them to local muted text and the local accent respectively. Unresolved links retain full text opacity and use a dashed underline to communicate their state.

The native macOS traffic lights reserve more horizontal space than the ribbon itself. In flagship mode with the left sidebar collapsed, match the ribbon's top corner to the adjacent light tab rail; the vertical ribbon below stays graphite. When the left sidebar opens, the corner returns to its host palette. Keep the native ribbon-corner width so no graphite cap protrudes into the tab rail. Keep Obsidian's existing fullscreen, popout, mobile, and hidden-ribbon geometry.

Callout compatibility uses Obsidian's computed native title color rather than parsing `--callout-color`: older versions provide RGB channels, while 1.14.5 provides a complete CSS color. A non-interactive tint layer on the title fills the positioned callout container behind its content. Title text and icons mix their inherited native color with local document text. This preserves custom callout hues and the opacity/strength controls without assuming a token format or changing the minimum Obsidian version. H5 uses the native heading-style variable to distinguish it from upright H4 and the smaller muted H6.

## Plugin compatibility policy

Add an integration only when all of these are true:

1. semantic variables cannot solve the remaining behavior;
2. the result is unreadable or unusable, not merely different; and
3. the rule records the plugin, tested version, failure mechanism, and relevant issue.

Keep one file per plugin and one import in `src/scss/index.scss`. Test the same view in the central workspace and sidebar when Obsidian allows both.

## Distribution invariants

- `theme.css` and `manifest.json` are the complete release package.
- Builds are deterministic and do not require `.env`.
- Deployment requires `.env` and a validated destination ending in `.obsidian/themes/Red Graphite`.
- Package, lockfile, manifest, and versions metadata must agree.
- Remote CSS assets and unapproved `!important` declarations are rejected.
