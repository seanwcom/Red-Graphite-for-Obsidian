# Contributing to Red Graphite

## Requirements

- Node.js 24.10 or newer (`.node-version` records Node 24)
- npm 11 or newer
- Obsidian 1.12.7 or newer for visual testing

Install the locked dependencies:

```powershell
npm ci
```

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/scss/theme/` | Theme tokens, palettes, modes, components, and mobile rules |
| `src/scss/plugins/` | One narrowly scoped file per supported plugin exception |
| `src/css/style-settings.css` | Style Settings schema appended to the Sass build |
| `scripts/` | Build, validation, deployment, and version helpers |
| `tests/` | Build, safety, metadata, release, and contrast tests |
| `theme.css` | Generated, tracked distribution artifact |
| `manifest.json` | Obsidian theme metadata |

Read [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) before changing palette scope or workspace selectors. Do not edit `theme.css` by hand.

## Live development

Copy the local environment template:

```powershell
Copy-Item .env.example .env
```

Set `OBSIDIAN_PATH` to a folder ending in `.obsidian/themes/Red Graphite`. Relative paths resolve from the repository root. The current development default is:

```dotenv
OBSIDIAN_PATH='../obsidian-personal/.obsidian/themes/Red Graphite'
```

Then run:

```powershell
npm run dev
```

The watcher builds immediately, deploys `theme.css` and `manifest.json`, and watches `src` and `manifest.json`. The deployer refuses any destination whose last three path segments are not `.obsidian/themes/Red Graphite`.

Select Red Graphite in Obsidian before evaluating changes. CSS usually reloads live; manifest changes may require switching themes, refreshing Obsidian, or restarting it.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile deterministic expanded CSS into `theme.css` |
| `npm run dev` | Build, deploy to the configured vault, and watch |
| `npm run check` | Validate metadata, static policy, and the tracked CSS |
| `npm test` | Run the Node test suite |
| `npm run version -- 2.0.1` | Synchronize package, lock, manifest, and versions metadata |

`npm run build`, `npm run check`, tests, and CI do not require `.env` and do not write to an Obsidian vault.

## Change policy

1. Prefer Obsidian semantic variables over internal selectors.
2. Keep the flagship Dark-mode frame, locally light central workspace, full-dark option, and conventional Light fallback working together.
3. Add a plugin stylesheet only when the remaining problem is unreadable or unusable. Include the plugin name, tested version, and relevant issue in a source comment.
4. Add new Style Settings controls to the appropriate group and preserve the current value as the default.
5. Add new Markdown treatments to [`docs/STYLE-SPECIMEN.md`](./docs/STYLE-SPECIMEN.md).
6. Do not alter an existing vault's plugin data or settings during QA.

## Before submitting a change

```powershell
npm run build
npm run check
npm test
npm audit --audit-level=high
```

For visual changes, test all three appearance states and record the relevant manual results in [`docs/QA.md`](./docs/QA.md). The source build, tracked `theme.css`, and deployed vault copy must match at acceptance.

Do not tag or publish a release, or modify public issues, as part of an ordinary contribution. Follow [`docs/RELEASING.md`](./docs/RELEASING.md) only after explicit approval.
