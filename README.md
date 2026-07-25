# Red Graphite for Obsidian

Red Graphite is a minimal, Bear-inspired theme for
[Obsidian](https://obsidian.md/). Version 2 uses Obsidian's real dark mode for
the application frame and sidebars while keeping the central workspace light.
Plugins in a sidebar therefore receive the dark-mode environment they expect
without a growing collection of theme-specific overrides.

![Red Graphite theme preview](./thumbnail.png)

## Installation

1. Open **Settings → Appearance** in Obsidian.
2. Select **Manage** under Themes.
3. Search for **Red Graphite**, install it, and choose **Use this theme**.
4. Set **Base color scheme** to **Dark** for the flagship mixed appearance.

## Appearance modes

| Obsidian setting | Red Graphite result |
| --- | --- |
| Dark | Graphite frame and sidebars with a light central workspace |
| Dark + **Use a dark central workspace** | Fully dark application |
| Light | Conventional fully light fallback |

The dark-workspace toggle and theme controls require the
[Style Settings plugin](https://github.com/obsidian-community/obsidian-style-settings).
Red Graphite uses its signature red accent by default in every mode. Obsidian's
native **Settings → Appearance → Accent color** control is the single global
accent setting and works whether or not Style Settings is installed.

## Style Settings

Red Graphite exposes its design system through a grouped **Red Graphite**
section in Style Settings. The theme's standard appearance is the default for
every control, so installing Style Settings does not change the theme by
itself.

| Group | Controls |
| --- | --- |
| Appearance | Display mode, light and dark palettes, selection, and state colors |
| Typography | Font families, interface scale, body text, note titles, and all six heading levels |
| Layout and spacing | Document width and margins, mobile spacing, lists, and horizontal rules |
| Workspace chrome | Tabs, sidebar navigation, status bar, vault name, and scrollbars |
| Markdown and content | Blockquotes, callouts, code blocks, tables, tags, and embeds |
| Code syntax colors | Complete light-document and dark-document syntax palettes |
| Plugin compatibility | Narrowly scoped integration controls, organized by plugin |

Component colors follow Obsidian's native accent by default or can be overridden
individually. This keeps global accent changes coherent while still allowing,
for example, an H1 color or active-tab indicator to diverge. Style Settings
provides reset controls at each level to return a value, subgroup, or the entire
Red Graphite section to the shipped defaults.

## Live development on Windows

Red Graphite requires Node.js 24.10 or newer. The repository records Node 24 in
`.node-version`.

```powershell
npm ci
Copy-Item .env.example .env
```

Set `OBSIDIAN_PATH` in `.env` to the theme folder inside the development vault.
For this workstation the live target is:

```dotenv
OBSIDIAN_PATH='../obsidian-personal/.obsidian/themes/Red Graphite'
```

Start the watcher:

```powershell
npm run dev
```

The command builds immediately, copies `theme.css` and `manifest.json` into the
vault, and watches `src` and `manifest.json`. Obsidian reloads CSS changes
automatically. A manifest change may require switching themes or restarting
Obsidian.

The deployer refuses destinations that do not end in
`.obsidian/themes/Red Graphite`.

### Development commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile expanded, deterministic CSS into `theme.css` |
| `npm run dev` | Build, deploy to the configured vault, and watch |
| `npm run check` | Validate metadata and confirm `theme.css` is current |
| `npm test` | Run build, deployment, release, and contrast tests |
| `npm run version -- 2.0.1` | Update all version metadata together |

`npm run build` and CI never require `.env` and never write to an Obsidian
vault.

## Theme architecture and compatibility

The distributed package remains the standard Obsidian `theme.css` and
`manifest.json` pair. Sass is used only as a maintainable source format.

In Obsidian Dark mode, global UI inherits Red Graphite's graphite dark semantic
palette. Each leaf in the central root workspace receives a complete light
semantic palette and `color-scheme: light`; tab headers and global menus remain
part of the dark frame. The Style Settings toggle replaces that local palette
with the dark document palette.

Plugins are expected to use Obsidian semantic variables. Red Graphite keeps
each exceptional integration in its own `src/scss/plugins/_<plugin>.scss` file
and adds one only when a tested plugin hardcodes the body theme or otherwise
becomes unreadable or unusable. Cosmetic differences alone are not overridden.
See [the QA matrix](./docs/QA.md) for the current compatibility targets.

## Release process

1. Complete the desktop and physical iOS checklist in `docs/QA.md`.
2. Update the gallery thumbnail and screenshots from the approved build.
3. Run `npm run version -- <version>`, build, test, and commit the result.
4. Push an exact numeric tag such as `2.0.0`—tags prefixed with `v` are invalid.
5. GitHub Actions validates and rebuilds the theme, then creates a **draft**
   release containing `manifest.json` and `theme.css`.
6. Review and publish the draft manually.

## License and attribution

The code is released under [The Unlicense](./LICENSE). The visual direction and
original Red Graphite color concept are inspired by Bear; credit belongs to
Bear's designers for that design language.
