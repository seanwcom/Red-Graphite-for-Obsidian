# Release procedure

Releases are intentional user-facing changes. Do not create a tag, publish a release, update gallery metadata, or modify public issues without explicit approval.

## Red Graphite 2 migration message

Red Graphite 2 changes its primary Obsidian appearance from Light to Dark. Existing installations will not switch automatically. Put the following note at the beginning of the 2.0.0 release description and any forum, Discord, or other project announcement:

> **Action required when upgrading from Red Graphite 1.x:** Open **Settings → Appearance** and change **Base color scheme** from **Light** to **Dark**. Red Graphite 2 uses real Obsidian Dark mode for its graphite frame and sidebars, with a light central workspace. This lets Obsidian and sidebar plugins apply their native dark styling instead of requiring Red Graphite to maintain custom CSS for every add-on. If you remain in Light mode, you will see the supported all-light fallback instead.

The README alert and changelog must contain the same instruction. Do not add a persistent warning through theme CSS: it cannot store a dismissed state and would also affect users who intentionally select the Light fallback.

## Acceptance

Before versioning:

- complete and record the desktop, plugin, issue-regression, and physical iOS checks in [`QA.md`](./QA.md);
- receive explicit user approval for desktop and iOS appearance;
- replace `thumbnail.png` with one current 512×288 flagship screenshot that contains no personal vault information;
- confirm the README shows only that screenshot;
- remove or disable only plugins temporarily added for QA; and
- leave the working tree clean and CI green.

## Prepare

Update the changelog, remove `Unreleased` from the version heading, and run:

```powershell
npm ci
npm run version -- 2.0.0
npm run build
npm run check
npm test
npm audit --audit-level=high
```

Review the generated `theme.css` and commit all version and documentation changes. The root `theme.css`, deployed vault copy, and source build must be identical.

## Create the draft

After explicit tag approval, push an exact numeric SemVer tag:

```powershell
git tag 2.0.0
git push origin 2.0.0
```

Do not prefix the tag with `v`. The release workflow performs a clean install, validates tag and metadata agreement, tests, audits, rebuilds, and creates a **draft** GitHub release containing freshly validated `theme.css` and `manifest.json`.

## Review and publish

1. Open the draft and put the migration message at the top.
2. Replace or edit generated notes so the changelog's user-facing changes are clear.
3. Verify the tag, package, manifest, and versions entry all agree.
4. Download both assets and confirm their names and contents.
5. Check the README and single gallery screenshot on GitHub.
6. Publish only after separate explicit approval.

Publication and Obsidian gallery submission/update are separate actions.
