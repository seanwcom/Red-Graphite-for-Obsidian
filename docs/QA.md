# Red Graphite 2 QA

This is the living release-acceptance record, not a substitute for the stable design contract in [`ARCHITECTURE.md`](./ARCHITECTURE.md). Update versions and results as testing occurs; do not mark a manual result complete from compiled CSS inspection alone.

Do not create the `2.0.0` tag until every required row is complete and the final desktop and iOS appearance has been approved.

## Test environment record

| Item | Version or result |
| --- | --- |
| Windows Obsidian | 1.12.7 |
| Node / npm | 24.13.1 / 11.8.0 |
| Red Graphite | 2.0.0 development build |
| Automated build and contrast tests | Passing |
| High or critical npm audit findings | 0 |
| Live watcher | Initial deploy and source-change redeploy verified |
| Physical iOS device | Pending |

Record the Obsidian installer/API version, operating-system version, and each plugin version when completing a manual pass.

## Desktop appearance

Test each row in conventional Light, flagship Dark, and Dark with **Use a dark central workspace** enabled.

- [ ] Reading view
- [x] Live Preview/editor basic rendering
- [ ] Source mode
- [ ] Properties, including aliases and multi-select pills
- [ ] Bases table, cards, property menu, and filters
- [ ] Canvas
- [ ] PDF
- [ ] Local and global graph
- [ ] Search and backlinks
- [x] Settings and modal surfaces
- [ ] Command palette, suggestions, context menus, and popovers
- [ ] Split panes and stacked tabs
- [x] Flagship center is light while frame, tabs, ribbon, and sidebar are dark
- [ ] Full-dark toggle changes only the central workspace
- [x] Conventional Light produces an all-light application

For a view that can be opened in more than one location, move the same view between the center and a sidebar. The center must use the local document palette and the sidebar must use the host palette.

## Plugin matrix

Only add compatibility CSS when a failure prevents reading or operating the plugin and cannot be solved through Obsidian semantic variables.

| Plugin | Version | Center | Sidebar | Notes |
| --- | --- | --- | --- | --- |
| Git | 2.38.1 | Pending | Pending | Uses semantic variables |
| List Callouts | 1.2.9 | Pending | N/A | Body mode changes opacity only |
| Style Settings | 1.0.9 | N/A | N/A | Control schema, group hierarchy, and section-reset palette previews verified |
| BRAT | 2.0.4 | Pending | Pending | Uses semantic variables |
| Claudian | 2.0.24 | Pending | Pending | Light-center logo exception included |
| Dataview | 0.5.70 | Pending | Pending | Verify issue #39 inline fields |
| Various Complements | 11.4.0 | Pending | N/A | Verify issue #38 suggestion details |
| Calendar | Record | Pending | Pending | |
| Kanban | Record | Pending | Pending | |
| Checklist | Record | Pending | Pending | |
| Make.md | Record | Pending | Pending | |
| Copilot | Record | Pending | Pending | |
| Daily Stats | Record | Pending | Pending | |

Temporarily installed QA plugins must be disabled and removed afterward. Do not alter existing plugin data or settings.

## Reported regressions

- [ ] #32: iOS left drawer uses the graphite host background.
- [ ] #38: Various Complements subtitle and icon have usable contrast.
- [x] #39: Dataview inline-field variables resolve to readable text/background pairs in compiled CSS; live plugin verification remains pending.
- [x] #41: `--menu-background` is defined for both host and local palettes; live Bases verification remains pending.
- [x] #42: property pills and metadata input variables have accessible host values; live sidebar verification remains pending.

Do not close or comment on public issues as part of QA without separate authorization.

## Contrast gates

- Normal text and muted text: at least 4.5:1 against their backgrounds.
- Large text and essential UI/selection states: at least 3:1.
- Check default colors plus any gallery screenshots used for the release.
- Automated tests cover the default primary, muted, faint, and accent tokens; manually verify composed and plugin-owned surfaces.

## Physical iOS pass

1. Create a throwaway local vault on the iOS device.
2. Copy `theme.css` and `manifest.json` into `.obsidian/themes/Red Graphite` using Files.
3. Select Red Graphite and test all three appearance states.
4. Check editor, reading view, both drawers, tab switcher, settings, Properties/Bases, the software keyboard, portrait/landscape orientation, and safe areas.
5. Test mobile-compatible matrix plugins where practical.
6. Record the Obsidian, installer/API, and iOS versions here.
7. Confirm #32 no longer produces a white or light sidebar.

## Release evidence

- [x] Source build, tracked `theme.css`, and deployed vault copy are identical.
- [x] `npm ci`, `npm run check`, `npm test`, and high-level audit pass.
- [x] No temporary test plugins were installed; existing vault plugins and data were left intact.
- [ ] The single updated 512×288 flagship screenshot contains no personal vault content and is saved as `thumbnail.png`.
- [ ] README, changelog, and draft release notes put the Dark-mode migration instruction first.
- [ ] Desktop appearance approved.
- [ ] Physical iOS appearance approved.
- [ ] Working tree clean and CI green.

Follow [`RELEASING.md`](./RELEASING.md) after every acceptance item is complete.
