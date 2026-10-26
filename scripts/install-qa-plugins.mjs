import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const catalogPath = join(projectRoot, "qa", "community-plugins.json");
const requiredAssets = ["main.js", "manifest.json", "styles.css"];

function usage() {
  return "Usage: node scripts/install-qa-plugins.mjs <empty-test-vault-path>";
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function githubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Red-Graphite-QA",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}): ${url}`);
  }
  return response.json();
}

async function downloadAsset(asset) {
  const response = await fetch(asset.browser_download_url, {
    headers: { "User-Agent": "Red-Graphite-QA" },
  });
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${asset.name}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

async function main(vaultArgument) {
  if (!vaultArgument) {
    throw new Error(usage());
  }

  const vault = resolve(vaultArgument);
  const obsidianDirectory = join(vault, ".obsidian");
  if (!(await pathExists(obsidianDirectory))) {
    throw new Error(`Not an initialized Obsidian vault: ${vault}`);
  }
  if (basename(vault) !== "red-graphite-test-vault") {
    throw new Error(`Refusing to modify a non-QA vault: ${vault}`);
  }

  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const pluginsDirectory = join(obsidianDirectory, "plugins");
  await mkdir(pluginsDirectory, { recursive: true });
  const installed = [];

  for (const plugin of catalog.plugins) {
    const destination = join(pluginsDirectory, plugin.id);
    const release = await githubJson(
      `https://api.github.com/repos/${plugin.repository}/releases/tags/${plugin.tag}`,
    );
    const assets = new Map(release.assets.map((asset) => [asset.name, asset]));
    const missing = requiredAssets.filter((asset) => !assets.has(asset));
    if (missing.length) {
      throw new Error(`${plugin.id}@${plugin.tag} lacks: ${missing.join(", ")}`);
    }

    const alreadyInstalled = await pathExists(destination);
    const downloaded = new Map();
    for (const assetName of requiredAssets) {
      downloaded.set(assetName, await downloadAsset(assets.get(assetName)));
    }
    const downloadedManifest = JSON.parse(
      downloaded.get("manifest.json").toString("utf8"),
    );
    if (downloadedManifest.id !== plugin.id) {
      throw new Error(
        `${plugin.id}@${plugin.tag} manifest ID mismatch: ${downloadedManifest.id}`,
      );
    }

    const hashes = {};
    let matchesPinnedRelease = alreadyInstalled;
    if (alreadyInstalled) {
      for (const assetName of requiredAssets) {
        const assetPath = join(destination, assetName);
        if (!(await pathExists(assetPath))) {
          throw new Error(`Incomplete existing plugin directory: ${destination}`);
        }
        hashes[assetName] = sha256(await readFile(assetPath));
        if (hashes[assetName] !== sha256(downloaded.get(assetName))) {
          matchesPinnedRelease = false;
        }
      }
    }
    if (!matchesPinnedRelease) {
      if (!alreadyInstalled) {
        await mkdir(destination);
      }
      for (const assetName of requiredAssets) {
        const contents = downloaded.get(assetName);
        await writeFile(join(destination, assetName), contents);
        hashes[assetName] = sha256(contents);
      }
    }

    const manifest = JSON.parse(
      await readFile(join(destination, "manifest.json"), "utf8"),
    );
    if (manifest.id !== plugin.id) {
      throw new Error(
        `${plugin.id}@${plugin.tag} manifest ID mismatch: ${manifest.id}`,
      );
    }
    installed.push({
      ...plugin,
      version: manifest.version,
      releaseUrl: release.html_url,
      hashes,
    });
    console.log(`${matchesPinnedRelease ? "Verified" : alreadyInstalled ? "Updated" : "Installed"} ${plugin.name} ${manifest.version}.`);
  }

  const enabledPath = join(obsidianDirectory, "community-plugins.json");
  const enabled = (await pathExists(enabledPath))
    ? JSON.parse(await readFile(enabledPath, "utf8"))
    : [];
  const enabledIds = [...new Set([...enabled, ...installed.map(({ id }) => id)])];
  await writeFile(`${enabledPath}`, `${JSON.stringify(enabledIds, null, 2)}\n`);

  const lock = {
    generatedAt: new Date().toISOString(),
    vault,
    plugins: installed,
  };
  await writeFile(
    join(obsidianDirectory, "qa-plugin-lock.json"),
    `${JSON.stringify(lock, null, 2)}\n`,
  );
  console.log(`Enabled ${installed.length} QA plugins in ${vault}.`);
}

main(process.argv[2]).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
