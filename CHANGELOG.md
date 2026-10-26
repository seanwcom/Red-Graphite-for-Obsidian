# Changelog

Notable changes to Red Graphite are recorded here. This project uses numeric [Semantic Versioning](https://semver.org/) tags without a `v` prefix.

## 2.0.0 — Unreleased

### Breaking change

Red Graphite's primary appearance has moved from Obsidian Light to Obsidian Dark. This gives Obsidian and sidebar plugins a genuine dark-mode environment and avoids maintaining custom CSS for every sidebar add-on. Existing users must open **Settings → Appearance** and set **Base color scheme** to **Dark** after updating. Obsidian Light remains supported as a conventional all-light fallback.

### Changed

- Rebuilt the theme around Obsidian's semantic variables and current interface.
- Made the signature appearance a graphite dark frame with a light central workspace.
- Added a Style Settings toggle for a fully dark central workspace.
- Replaced the legacy Grunt build with a deterministic Node 24 and Dart Sass build.
- Expanded Style Settings into grouped controls for the theme design system.
- Updated tabs, typography, headings, lists, tables, content blocks, mobile surfaces, and current Obsidian views.
- Adopted semantic-first plugin compatibility with isolated exceptions.
- Added modern CI, dependency updates, version synchronization, and draft release automation.
- Collapsed Style Settings groups by default and refined checkboxes, selected community-browser cards, sidebar search highlights, graph colors, and Mermaid rendering in the light workspace.
- Added Calendar and Copilot adjustments plus a pinned plugin QA installer for the dedicated test vault; full plugin acceptance remains pending.
- Documented manual installation from the development branch for use in another vault.
- Updated the build dependency `source-map-js` to 1.2.2 to resolve a high-severity audit finding.
- Fixed dark inactive-tab hover in Obsidian 1.14.5 and the macOS right-sidebar toggle's dark corner and hover when the flagship light center reaches the window edge.
- Matched the macOS traffic-light corner to the light tab rail when the left sidebar is collapsed, keeping the vertical ribbon graphite and restoring the graphite corner when the sidebar opens.
- Corrected that corner's compatibility with Obsidian 1.14.5's ribbon classes and added a rendered-pixel regression check.
- Restored native callout hues and configurable tints across older and current Obsidian color formats, with a more readable default title-color strength.
- Kept completed tasks and unresolved links on the local palette; unresolved links now use a dashed underline instead of faded text.
- Distinguished H5 with a configurable italic style, normalized specimen list indentation, and moved its verification table outside the list for Live Preview.
- Added an optional browser appearance regression check using a supplied Obsidian stylesheet.
- Added a modest, configurable gap below H2 underlines before immediately following Live Preview content, while retaining existing blank lines and reading-view spacing.

### Compatibility

- Minimum Obsidian version: 1.12.7.
- Release acceptance still requires the desktop and physical iOS checklist in [`docs/QA.md`](./docs/QA.md).

## 1.0.5

Last release in the original light-mode-first theme architecture.
