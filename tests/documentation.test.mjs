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
