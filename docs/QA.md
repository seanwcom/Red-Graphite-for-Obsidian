# Red Graphite 2 QA

This is the living release-acceptance record, not a substitute for the stable design contract in [`ARCHITECTURE.md`](./ARCHITECTURE.md). Update versions and results as testing occurs; do not mark a manual result complete from compiled CSS inspection alone.

Do not create the `2.0.0` tag until every required row is complete and the final desktop and iOS appearance has been approved.

## Development branch checkpoint — 2026-10-26

This branch is a development snapshot for manual use in another vault. It is not release acceptance. Previously checked manual results below are historical; no new Obsidian visual pass was performed for this checkpoint.

- Current local validation: `npm ci`, `npm run build`, `npm run check`, all 11 tests, and `npm audit --audit-level=high` pass after updating `source-map-js` to 1.2.2.
- The tracked `theme.css` matches the existing deployed copy in the dedicated test vault by SHA-256. This checkpoint did not write to a vault.
- The first branch CI run exposed a Windows-only absolute-path test fixture. The fixture now uses the host temporary directory and covers both absolute and relative deployment paths; remote CI validation must be checked on the updated commit.
- The plugin QA installer and catalog are included for reproducibility; the installer was not run during this checkpoint and plugin behavior remains pending.
- Review the Calendar and Copilot exceptions against the unreadable-or-unusable policy before release: their current source comments describe visual refinements, and Copilot's settings selectors need scope verification.
- Desktop appearance, plugin placement in all three states, the release screenshot, and physical iOS approval remain open. No tag or release is authorized by this checkpoint.
- Use the README's development-branch installation steps to copy only `theme.css` and `manifest.json` into another vault.

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
| Dataview | 0.5.68 (release tag 0.5.70) | Pending | Pending | Verify issue #39 inline fields |
| Various Complements | 11.4.0 | Pending | N/A | Verify issue #38 suggestion details |
| Calendar | 2.0.0 (`calendar-beta`) | Pending | Pending | Legacy compatibility fixture; its upstream release is an old beta. Sources hover stays neutral and its active state uses the accent. |
| Kanban | 2.0.51 | Pending | Pending | |
| Checklist | 2.2.14 | Pending | Pending | Issue #15 historical sidebar task view. |
| Copilot | 3.3.3 | Pending | Pending | Issue #33 historical UI-only test; never add provider credentials. Custom settings tabs use a muted divider and inactive state. |
| Daily Stats | 1.0.4 | Pending | Pending | Issue #35 historical status-bar and right-sidebar view. |
| Templater | 2.24.3 | Pending | N/A | QA template fixture and command-picker pass pending. |
| Tasks | 8.3.0 | Pending | N/A | QA query, task-state, and error pass pending. |

Keep the pinned QA plugins installed in the dedicated test vault between theme changes. Do not update, add, disable, or remove a plugin during an ordinary theme pass; make any plugin-baseline change deliberately, record it here, and rerun the relevant fixture set. Do not alter plugin data or settings outside this vault.

The reproducible first batch lives in the disposable test vault's `QA/Plugins/` folder. [`PLUGIN-QA.md`](./PLUGIN-QA.md) defines the guarded installer, version lockfile, and manual test procedure.

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
