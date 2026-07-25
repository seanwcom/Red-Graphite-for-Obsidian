import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  compileTheme,
  createDebouncedTask,
  styleSettingsPath,
  validateDeployPath,
  validateMetadata,
  validateReleaseTag,
} from "../scripts/build.mjs";

test("theme source compiles without warnings or remote assets", async () => {
  const css = await compileTheme();
  assert.match(css, /\.theme-dark/);
  assert.doesNotMatch(css, /url\(\s*(['"]?)https?:\/\//i);
});

test("compiled theme contains all three appearance states", async () => {
  const css = await compileTheme();
  assert.match(css, /body\.theme-light\s*\{/);
  assert.match(
    css,
    /body\.theme-dark:not\(\.red-graphite-dark-document\) \.workspace-split\.mod-root \.workspace-leaf-content/,
  );
  assert.match(
    css,
    /body\.theme-dark\.red-graphite-dark-document \.workspace-split\.mod-root \.workspace-leaf-content/,
  );
  assert.match(css, /:has\(\.workspace\.is-right-sidedock-open\)/);
  assert.match(css, /--caret-color: var\(--text-normal\)/);
  assert.match(
    css,
    /box-shadow: inset 0 calc\(-1 \* var\(--red-graphite-tab-indicator-width\)\) 0 var\(--red-graphite-tab-indicator-color\)/,
  );
  assert.match(css, /color-scheme: light/);
  assert.match(css, /color-scheme: dark/);
  assert.match(css, /--accent-h: 2/);
  assert.doesNotMatch(css, /--red-graphite-accent-color-/);
  assert.match(
    css,
    /\.style-settings-heading\[data-id=(?:"red-graphite"|red-graphite)\] \+ \.style-settings-container/,
  );
});

test("Style Settings exposes a unique, comprehensive token schema", async () => {
  const [css, settings] = await Promise.all([
    compileTheme(),
    readFile(styleSettingsPath, "utf8"),
  ]);
  const blocks = settings.split(/\r?\n {2}-\r?\n/).slice(1);
  const definitions = blocks.map((block) => ({
    id: block.match(/^\s+id:\s+(.+)$/m)?.[1].trim(),
    type: block.match(/^\s+type:\s+(.+)$/m)?.[1].trim(),
  }));
  const ids = definitions.map(({ id }) => id);

  assert.ok(definitions.length >= 100, "expected a comprehensive settings panel");
  assert.equal(new Set(ids).size, ids.length, "setting ids must be unique");
  assert.ok(
    definitions.some(
      ({ id, type }) =>
        id === "red-graphite-dark-document" && type === "class-toggle",
    ),
    "dark document toggle",
  );
  assert.ok(
    !ids.includes("red-graphite-accent-color"),
    "Obsidian Appearance must remain the only global accent control",
  );

  for (const { id, type } of definitions) {
    if (!type?.startsWith("variable-")) {
      continue;
    }
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      css,
      new RegExp(`--${escapedId}(?:-|\\b)`),
      `CSS must consume ${id}`,
    );
  }
});

test("default text and accent colors meet their contrast gates", () => {
  const contrast = (foreground, background) => {
    const luminance = (hex) => {
      const channels = hex
        .replace("#", "")
        .match(/.{2}/g)
        .map((channel) => Number.parseInt(channel, 16) / 255)
        .map((channel) =>
          channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4,
        );
      return (
        0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
      );
    };
    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);
    return (
      (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
      (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
    );
  };

  assert.ok(contrast("#404040", "#ffffff") >= 4.5, "light primary text");
  assert.ok(contrast("#616161", "#ffffff") >= 4.5, "light muted text");
  assert.ok(contrast("#737373", "#ffffff") >= 4.5, "light faint text");
  assert.ok(contrast("#f1f2f3", "#292c2e") >= 4.5, "dark primary text");
  assert.ok(contrast("#aeb3b7", "#292c2e") >= 4.5, "dark muted text");
  assert.ok(contrast("#939a9f", "#292c2e") >= 4.5, "dark faint text");
  assert.ok(contrast("#cb4c48", "#ffffff") >= 4.5, "light accent text");
  assert.ok(contrast("#d97b78", "#292c2e") >= 4.5, "dark accent text");
});

test("deployment path accepts only the matching Obsidian theme folder", () => {
  const root = join("C:", "work", "theme");
  const valid = join("C:", "vault", ".obsidian", "themes", "Red Graphite");
  assert.equal(validateDeployPath(valid, "Red Graphite", root), valid);
  assert.throws(
    () => validateDeployPath(join("C:", "vault"), "Red Graphite", root),
    /Refusing to deploy/,
  );
  assert.throws(
    () =>
      validateDeployPath(
        join("C:", "vault", ".obsidian", "themes", "Other"),
        "Red Graphite",
        root,
      ),
    /Refusing to deploy/,
  );
});

test("debounced task coalesces rapid changes", async () => {
  let calls = 0;
  const task = createDebouncedTask(async () => {
    calls += 1;
  }, 10);

  const first = task();
  const second = task();
  const third = task();
  assert.equal(first, second);
  assert.equal(second, third);
  await third;
  assert.equal(calls, 1);
});

test("metadata validation rejects mismatched versions", async () => {
  const root = await mkdtemp(join(tmpdir(), "red-graphite-test-"));
  try {
    await Promise.all([
      writeFile(
        join(root, "manifest.json"),
        JSON.stringify({
          name: "Red Graphite",
          version: "2.0.0",
          minAppVersion: "1.12.7",
        }),
      ),
      writeFile(join(root, "package.json"), JSON.stringify({ version: "2.0.1" })),
      writeFile(
        join(root, "package-lock.json"),
        JSON.stringify({
          version: "2.0.1",
          packages: { "": { version: "2.0.1" } },
        }),
      ),
      writeFile(
        join(root, "versions.json"),
        JSON.stringify({ "2.0.0": "1.12.7" }),
      ),
    ]);
    await assert.rejects(() => validateMetadata(root), /Version mismatch/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("release validation accepts only the exact numeric project version", async () => {
  await assert.doesNotReject(() => validateReleaseTag("2.0.0"));
  await assert.rejects(() => validateReleaseTag("v2.0.0"), /numeric SemVer/);
  await assert.rejects(
    () => validateReleaseTag("2.0.1"),
    /does not match project version/,
  );
});
