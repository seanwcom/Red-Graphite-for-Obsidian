# Repository operating guide

This file is the durable handoff for Codex and other coding agents working on Red Graphite. Read it before making changes.

## Product contract

- The flagship state is **Obsidian Dark**: a graphite dark application frame, title bar, ribbons, sidebars, menus, modals, and tab rail surrounding a light central workspace.
- `body.red-graphite-dark-document` changes the central workspace to dark.
- **Obsidian Light** is a supported conventional all-light fallback.
- Obsidian's native Accent color is the canonical global accent. Style Settings component colors inherit it by default and may expose explicit overrides.
- The visual target is Bear-inspired, calm, and maintainable, not a pixel-perfect copy of a particular Bear release.

Do not reintroduce the discarded legacy dark palette or make Light mode the flagship architecture.

## Sources of truth

- Edit Sass in `src/scss/`.
- Edit the Style Settings schema in `src/css/style-settings.css`.
- `src/scss/index.scss` declares build order.
- `theme.css` is generated and tracked because Obsidian releases consume it. Never edit it directly.
- `manifest.json`, `package.json`, `package-lock.json`, and `versions.json` must remain synchronized.
- Stable design reasoning lives in `docs/ARCHITECTURE.md`; current acceptance state lives in `docs/QA.md`.

## Implementation rules

1. Solve core and plugin views through documented Obsidian semantic variables first.
2. Scope the light palette to central root workspace tabs and leaf content. Keep tab headers and surrounding application chrome conceptually separate.
3. Expect a plugin that hardcodes `body.theme-dark` to need investigation; do not assume a subtree can behave as `body.theme-light`.
4. Put each justified plugin exception in `src/scss/plugins/_<plugin>.scss`, import it from `src/scss/index.scss`, and document the plugin, tested version, failure mechanism, and issue.
5. Do not add plugin CSS for cosmetic differences.
6. Keep Style Settings grouped and navigable. Shipped values must remain the schema defaults, including reset behavior.
7. Avoid remote assets and unapproved `!important`; automated checks reject both.

## Working and verification flow

This is a Windows/PowerShell repository requiring Node 24.10+ and npm 11+.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

The current live target in `.env.example` is the user's personal development vault. Preserve that vault, its plugins, settings, and data. The deploy script may copy only `theme.css` and `manifest.json` to a validated `.obsidian/themes/Red Graphite` destination.

After source changes:

```powershell
npm run build
npm run check
npm test
npm audit --audit-level=high
```

For visual changes, confirm the deployed CSS matches the tracked artifact and test the relevant entries in `docs/QA.md` in all three appearance states.

## Documentation and release boundaries

- Keep `README.md` user-facing and limited to one current flagship screenshot.
- The upgrade warning that 2.0 requires Obsidian Dark must remain prominent through the 2.0 migration period.
- Update `CHANGELOG.md`, documentation, Style Settings descriptions, and the style specimen when behavior changes.
- Do not tag, publish a release, close/comment on public issues, or change public gallery metadata without explicit user approval.
- Desktop and physical iOS appearance require user approval before the 2.0.0 tag. A numeric tag without `v` creates a draft release only.

See `CONTRIBUTING.md`, `docs/ARCHITECTURE.md`, `docs/QA.md`, and `docs/RELEASING.md` for the complete workflows.
