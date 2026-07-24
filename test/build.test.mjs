import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  compileTheme,
  createDebouncedTask,
  validateDeployPath,
  validateMetadata,
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
  assert.match(css, /color-scheme: light/);
  assert.match(css, /color-scheme: dark/);
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

  assert.ok(contrast("#2b2b2b", "#ffffff") >= 4.5, "light primary text");
  assert.ok(contrast("#616161", "#ffffff") >= 4.5, "light muted text");
  assert.ok(contrast("#737373", "#ffffff") >= 4.5, "light faint text");
  assert.ok(contrast("#e9ecf1", "#1e232f") >= 4.5, "dark primary text");
  assert.ok(contrast("#9ba6bf", "#1e232f") >= 4.5, "dark muted text");
  assert.ok(contrast("#7c8aab", "#1e232f") >= 4.5, "dark faint text");
  assert.ok(contrast("#cb4c48", "#ffffff") >= 4.5, "light accent text");
  assert.ok(contrast("#d97b78", "#1e232f") >= 4.5, "dark accent text");
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
        join(root, "versions.json"),
        JSON.stringify({ "2.0.0": "1.12.7" }),
      ),
    ]);
    await assert.rejects(() => validateMetadata(root), /Version mismatch/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
