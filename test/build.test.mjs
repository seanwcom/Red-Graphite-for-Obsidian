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
