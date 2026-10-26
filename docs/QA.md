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

## Mac tab and corner regression — 2026-10-26

- User report: macOS Obsidian 1.14.5, development branch, no CSS snippets. Inactive-tab hover becomes dark with dark text; the right-sidebar toggle leaves a dark corner beside the light tab rail.
- Reproduced both symptoms in an isolated Chromium fixture using the actual `app.css` extracted read-only from the locally installed Obsidian 1.14.5 application bundle. The repository's older ignored `app.css` reference reproduced the corner only, so it is insufficient for current tab-hover acceptance.
- Cause: the newer `--tab-inner-background-hover` alias resolved at the dark body and was inherited by the light center. The fixed macOS sidebar toggle also inherited the dark host palette and its own tab-container token. Both now resolve against the appropriate local palette.
- Isolated browser checks pass in 24 combinations: all three appearance states, macOS and Windows body classes, focused and unfocused windows, and right sidebar open and closed. Assertions cover inactive-tab hover, macOS corner background, and toggle-icon hover. This fixture simulates platform classes; it is not native macOS or live Obsidian acceptance.
- The existing Node tests cannot render Obsidian hover states; the browser reproduction provides the regression check for this change. Native Mac confirmation remains pending.
- Validation: build, tracked-artifact check, all 11 Node tests, high-level npm audit (0 vulnerabilities), and `git diff --check` pass. Deployed only `theme.css` and `manifest.json` through the guarded deployer to the configured local test vault; both deployed files match their repository copies by SHA-256.
- Repeat on the Mac: open two notes, hover an inactive tab and the right corner control, then open and close the right sidebar. Check both focused and unfocused windows in each appearance state. The flagship light rail must have light hover surfaces and readable dark text; an open graphite sidebar must keep its graphite toggle.

## Markdown specimen and traffic-light regressions — 2026-10-26

- User screenshots from macOS Obsidian 1.14.5 show the previous right-corner fix at rest. They also expose missing callout tints/hues, faint unresolved links and completed tasks, weak small-heading distinction, flattened specimen nesting, and an unrendered table inside a list. A further screenshot with the left sidebar closed shows native traffic lights straddling the graphite ribbon and light tab rail.
- The optional `npm run qa:appearance` browser check reproduced the color, contrast, and backdrop failures before the fixes. It now passes 24 combinations of all three appearances, focused/unfocused windows, and both sidebars open/closed against each of two real stylesheet references: the installed Obsidian 1.14.5 CSS and the older saved reference with RGB-channel callout tokens (48 cases total). Preview images for all three appearances were visually inspected. These are isolated Chromium fixtures with macOS classes, not native Mac acceptance.
- Callout titles, icons, and configurable tints use the native computed title color, so both older RGB-channel and newer complete-color token formats work. The default title-color strength is now 35% to keep all tested default callout titles readable. Completed-task text and unresolved links resolve locally; unresolved links use a dashed underline at full opacity.
- The traffic-light area now has a continuous native-width backdrop. H5 is italic by default with a Style Settings override. The specimen uses four-space nesting, a longer wrapping task, and a standalone verification table. Replace the Mac test note's specimen content to pick up the list/table corrections; theme CSS cannot correct indentation in an existing note.
- Native Mac confirmation remains pending for the traffic-light area, callouts (including nested/folded cases), list nesting/numbering, and the standalone verification table in Live Preview and Reading view. The browser check validates CSS against representative DOM, not Obsidian's Markdown parser.
- Validation: build, tracked-artifact check, all 12 Node tests, high-level npm audit (0 vulnerabilities), and `git diff --check` pass. The browser check also confirms the backdrop rule leaves Windows, fullscreen, popout, and mobile ribbon widths at their native values. Deployed only `theme.css` and `manifest.json` through the guarded deployer to the configured local test vault; deployed bytes match both repository artifacts.

## Collapsed Mac sidebar corner revision — 2026-10-26

- The next native Mac screenshot showed that extending the graphite backdrop removed the split behind the buttons but created an awkward cap protruding into the light rail. That treatment is superseded: in flagship mode, closing the left sidebar now makes the ribbon's top corner match the adjacent light tab rail. The ribbon below stays graphite, and opening the sidebar restores its graphite corner. The native corner width is preserved.
- Updated the browser regression check to reject a protruding corner, assert the adjacent background match when collapsed, and verify the ribbon and open-sidebar corner keep their host palette. The fixture now toggles the ribbon's actual `is-collapsed` class as well as the workspace dock classes. These checks failed against the prior treatment before the source fix.
- Native macOS confirmation remains pending. The isolated fixture tests CSS paint and state inheritance; it does not render Apple's native traffic-light controls.
- Validation: 24 browser scenarios pass against each of the older and 1.14.5 stylesheet references (48 total), including both window-focus states and both sidebar states. The build, tracked-artifact check, all 12 Node tests, high-level npm audit (0 vulnerabilities), and `git diff --check` pass. Deployed only `theme.css` and `manifest.json` to the configured local test vault through the guarded deployer; deployed bytes match the repository artifacts.

## Modern ribbon selector correction — 2026-10-26

- The next native Mac screenshot still showed the split traffic-light background. Read-only inspection of the installed Obsidian 1.14.5 `app.js` ribbon constructor confirmed that the ribbon receives only `mod-primary`; unlike sidebar toggles, it does not also receive `mod-left`. The previous selector therefore never matched that ribbon. The earlier fixture incorrectly supplied both classes and hid the defect.
- The fixture now selects only the class used by its stylesheet version: current `mod-primary` or legacy `mod-left`. With the correct modern class, the previous source failed in all four collapsed flagship focus/right-sidebar combinations. A new screenshot-pixel assertion also failed across the actual ribbon/rail paint boundary in those four cases.
- The corner selector now matches either class independently. Both computed background checks and rendered-pixel checks pass across the 24 appearance/sidebar/focus scenarios for each reference stylesheet (48 cases). This corrects the selector and fixture; native Mac confirmation is still pending, and the fixture does not render Apple's native buttons.
- Validation: build, tracked-artifact check, all 12 Node tests, high-level npm audit (0 vulnerabilities), and `git diff --check` pass. Guarded deployment copied only `theme.css` and `manifest.json` into the configured local test vault; deployed bytes match both repository artifacts.

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
- [ ] macOS inactive-tab hover and right-sidebar corner at rest and on hover, with the right sidebar open/closed and window focused/unfocused (Obsidian 1.14.5)
- [ ] macOS traffic-light backdrop with the left sidebar open/closed, including fullscreen, popout, and hidden-ribbon checks
- [ ] Callout hues/tints, unresolved-link and completed-task contrast, H4–H6 distinction, and refreshed specimen list/table rendering (Obsidian 1.14.5)
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
