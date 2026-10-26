import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import test from "node:test";
import { projectRoot } from "../scripts/build.mjs";

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter(
        (entry) =>
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules",
      )
      .map(async (entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
          return markdownFiles(path);
        }
        return extname(entry.name).toLowerCase() === ".md" ? [path] : [];
      }),
  );
  return files.flat();
}

test("README keeps the 2.0 migration warning and one local screenshot", async () => {
  const readme = await readFile(join(projectRoot, "README.md"), "utf8");
  assert.match(readme, /^> \[!IMPORTANT\]/m);
  assert.match(readme, /Base color scheme\*\* to \*\*Dark\*\*/);
  assert.match(readme, /sidebar plugins a genuine dark-mode environment/);

  const images = [...readme.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)];
  assert.equal(images.length, 1, "README must contain exactly one screenshot");
  assert.ok(
    !/^(?:https?:)?\/\//i.test(images[0][1]),
    "README screenshot must be a local asset",
  );
  await access(resolve(projectRoot, images[0][1]));
});

test("local Markdown links resolve", async () => {
  const files = await markdownFiles(projectRoot);
  const broken = [];

  for (const file of files) {
    const markdown = await readFile(file, "utf8");
    for (const match of markdown.matchAll(/!?\[[^\]]*]\(([^)]+)\)/g)) {
      const destination = match[1].trim().replace(/^<|>$/g, "");
      if (/^(?:https?:|mailto:|#)/i.test(destination)) {
        continue;
      }

      const localPath = decodeURIComponent(destination.split("#", 1)[0]);
      try {
        await access(resolve(dirname(file), localPath));
      } catch {
        broken.push(`${file}: ${destination}`);
      }
    }
  }

  assert.deepEqual(broken, []);
});

test("specimen uses editor-compatible nested lists and standalone tables", async () => {
  const specimen = await readFile(join(projectRoot, "docs", "STYLE-SPECIMEN.md"), "utf8");
  let inFence = false;
  const invalid = [];
  const content = specimen.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const list = line.match(/^( +)(?:[-+*]|\d+\.)\s/);
    if (list && list[1].length % 4 !== 0) invalid.push(`line ${index + 1}: use four spaces per nested list level`);
    if (/^ +\|/.test(line)) invalid.push(`line ${index + 1}: keep tables outside lists for Live Preview`);
  }
  assert.deepEqual(invalid, []);
});

test("Markdown prose relies on reader wrapping", async () => {
  const files = await markdownFiles(projectRoot);
  const wrapped = [];

  for (const file of files) {
    const lines = (await readFile(file, "utf8")).split(/\r?\n/);
    let inFrontmatter = lines[0] === "---";
    let inFence = false;
    let inMath = false;

    for (let index = 0; index < lines.length - 1; index += 1) {
      const current = lines[index];
      const next = lines[index + 1];

      if (inFrontmatter) {
        if (index > 0 && current === "---") {
          inFrontmatter = false;
        }
        continue;
      }
      if (/^\s*(```|~~~)/.test(current)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) {
        continue;
      }
      if (/^\s*\$\$\s*$/.test(current)) {
        inMath = !inMath;
        continue;
      }
      if (inMath || !current.trim() || !next.trim()) {
        continue;
      }

      const structural = (line) =>
        /^\s*(?:#{1,6}\s|[-+*]\s+|\d+[.)]\s+|\[\^[^\]]+]:|\|.*\|\s*$|(?:---|\*\*\*|___)\s*$|<\/?(?:details|summary)>|%%)/.test(
          line,
        );
      const currentQuote = current.match(/^(\s*(?:>\s*)+)(.*)$/);
      const nextQuote = next.match(/^(\s*(?:>\s*)+)(.*)$/);

      if (
        currentQuote &&
        nextQuote &&
        currentQuote[1] === nextQuote[1] &&
        !/^\[![^\]]+]/.test(currentQuote[2].trim())
      ) {
        wrapped.push(`${file}:${index + 1}`);
        continue;
      }

      if (
        !currentQuote &&
        !nextQuote &&
        !structural(current) &&
        !structural(next)
      ) {
        wrapped.push(`${file}:${index + 1}`);
      }
    }
  }

  assert.deepEqual(wrapped, []);
});
