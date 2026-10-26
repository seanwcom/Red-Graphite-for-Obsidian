# Plugin QA harness

Use the dedicated `red-graphite-test-vault` only. Community plugins execute third-party code, so keep a narrow pinned set and record the installed release. Keep that pinned set installed between theme changes so every visual pass uses the same plugin baseline; upgrade or remove a plugin only as an intentional QA-environment change.

## Install the pinned QA set

The repository catalog in [`qa/community-plugins.json`](../qa/community-plugins.json) pins the approved plugin IDs, upstream repositories, and release tags. It covers every community plugin requested in open or closed repository issues, along with the broader regression set already under test. The installer downloads the three files Obsidian needs (`main.js`, `manifest.json`, and `styles.css`), verifies the manifest ID, records SHA-256 hashes in the vault lock file, and enables the installed IDs.

```powershell
npm run qa:plugins -- 'C:\Users\seanwcom\dev\obsidian-notebooks\red-graphite-test-vault'
```

Before opening the vault, turn off Restricted Mode in Obsidian's Community plugins settings, then refresh Obsidian's plugin list. The script intentionally refuses any vault whose folder name is not `red-graphite-test-vault`; on later runs, it preserves an exact pinned release and replaces only the three required assets when they differ from that release. If Obsidian does not load a plugin after that refresh, use its Installed plugins entry to reinstall it once and record the exception in the QA log. Copilot is installed only to test its local interface: do not add API keys, sign in, connect accounts, or run model-backed actions.

## Manual visual pass

For each fixture under `QA/Plugins/`, open the plugin's documented view or run the listed command. Test it in conventional Light, flagship Dark with a light document, and full-dark document mode. Test a central view and, where the plugin allows it, a left and right sidebar placement.

Record the Obsidian version, plugin version from `.obsidian/qa-plugin-lock.json`, pass/fail result, screenshot path, and failure mechanism in [`QA.md`](./QA.md). Do not add compatibility CSS for a cosmetic difference; prefer Obsidian semantic variables, and isolate any necessary exception in `src/scss/plugins/`.
