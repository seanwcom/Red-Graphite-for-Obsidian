import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { watch } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";
import * as sass from "sass";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
export const projectRoot = resolve(scriptsDirectory, "..");
export const sourceRoot = join(projectRoot, "src");
export const entryPath = join(sourceRoot, "scss", "index.scss");
export const styleSettingsPath = join(sourceRoot, "css", "style-settings.css");
export const outputPath = join(projectRoot, "theme.css");
export const manifestPath = join(projectRoot, "manifest.json");

const requiredNode = { major: 24, minor: 10 };

export function assertSupportedNode(version = process.versions.node) {
  const [major, minor] = version.split(".").map(Number);
  if (
    major < requiredNode.major ||
    (major === requiredNode.major && minor < requiredNode.minor)
  ) {
    throw new Error(
      `Red Graphite requires Node >=24.10; current version is ${version}.`,
    );
  }
}

export async function compileTheme({
  entry = entryPath,
  settings = styleSettingsPath,
} = {}) {
  const result = await sass.compileAsync(entry, {
    charset: false,
    quietDeps: true,
    sourceMap: false,
    style: "expanded",
  });

  let css = result.css.trimEnd();
  try {
    const settingsCss = (await readFile(settings, "utf8")).trim();
    if (settingsCss) {
      css += `\n\n${settingsCss}`;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  return `${css}\n`;
}

export async function buildTheme(options = {}) {
  const destination = options.output ?? outputPath;
  const css = await compileTheme(options);
  await writeFile(destination, css, "utf8");
  return { css, destination };
}

export function validateDeployPath(configuredPath, themeName, root = projectRoot) {
  if (!configuredPath?.trim()) {
    throw new Error(
      "OBSIDIAN_PATH is missing. Copy .env.example to .env and set the theme folder.",
    );
  }

  const destination = resolve(root, configuredPath.trim());
  const expectedSegments = [".obsidian", "themes", themeName].map((segment) =>
    segment.toLocaleLowerCase("en-US"),
  );
  const actualSegments = destination
    .split(sep)
    .filter(Boolean)
    .slice(-3)
    .map((segment) => segment.toLocaleLowerCase("en-US"));

  if (
    expectedSegments.length !== actualSegments.length ||
    expectedSegments.some((segment, index) => segment !== actualSegments[index])
  ) {
    throw new Error(
      `Refusing to deploy outside .obsidian/themes/${themeName}: ${destination}`,
    );
  }

  return destination;
}

export async function deployTheme({
  configuredPath = process.env.OBSIDIAN_PATH,
  root = projectRoot,
} = {}) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const destination = validateDeployPath(configuredPath, manifest.name, root);
  await mkdir(destination, { recursive: true });
  await Promise.all([
    copyFile(outputPath, join(destination, basename(outputPath))),
    copyFile(manifestPath, join(destination, basename(manifestPath))),
  ]);
  return destination;
}

export function createDebouncedTask(task, delay = 100) {
  let timer;
  let pending;
  let resolvePending;
  let rejectPending;

  return () => {
    clearTimeout(timer);
    pending ??= new Promise((resolveTask, rejectTask) => {
      resolvePending = resolveTask;
      rejectPending = rejectTask;
    });
    timer = setTimeout(async () => {
      try {
        await task();
        resolvePending();
      } catch (error) {
        rejectPending(error);
      } finally {
        pending = undefined;
        resolvePending = undefined;
        rejectPending = undefined;
      }
    }, delay);
    return pending;
  };
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}

export async function validateMetadata(root = projectRoot) {
  const [manifestText, packageText, versionsText] = await Promise.all([
    readFile(join(root, "manifest.json"), "utf8"),
    readFile(join(root, "package.json"), "utf8"),
    readFile(join(root, "versions.json"), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const packageJson = JSON.parse(packageText);
  const versions = JSON.parse(versionsText);
  const semver = /^\d+\.\d+\.\d+$/;

  if (!semver.test(manifest.version)) {
    throw new Error(`manifest.json version is not numeric SemVer: ${manifest.version}`);
  }
  if (manifest.version !== packageJson.version) {
    throw new Error(
      `Version mismatch: manifest=${manifest.version}, package=${packageJson.version}`,
    );
  }
  if (versions[manifest.version] !== manifest.minAppVersion) {
    throw new Error(
      `versions.json must map ${manifest.version} to ${manifest.minAppVersion}.`,
    );
  }

  return { manifest, packageJson, versions };
}

export async function runStaticChecks(root = projectRoot, css) {
  const forbiddenFiles = [
    "Gruntfile.js",
    "obsidian.css",
    join("src", "css", "red-graphite.min.css"),
    join("src", "css", "alternate-checkboxes.css"),
  ];
  const existing = [];
  for (const file of forbiddenFiles) {
    try {
      if ((await stat(join(root, file))).isFile()) {
        existing.push(file);
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
  if (existing.length) {
    throw new Error(`Obsolete generated files remain: ${existing.join(", ")}`);
  }

  const sourceFiles = (await listFiles(join(root, "src"))).filter((file) =>
    /\.(?:css|scss)$/.test(file),
  );
  const source = (
    await Promise.all(sourceFiles.map((file) => readFile(file, "utf8")))
  ).join("\n");

  if (/url\(\s*(['"]?)https?:\/\//i.test(css)) {
    throw new Error("Remote assets are not allowed in theme.css.");
  }
  if (/!important\b/i.test(css)) {
    throw new Error("Unallowlisted !important declarations are not allowed.");
  }
  if (/grunt/i.test(source)) {
    throw new Error("Legacy Grunt references remain in theme source.");
  }
}

export async function checkTheme() {
  await validateMetadata();
  const expected = await compileTheme();
  const actual = await readFile(outputPath, "utf8");

  if (actual !== expected) {
    throw new Error("theme.css is stale. Run `npm run build` and commit the result.");
  }

  await runStaticChecks(projectRoot, expected);
  return expected;
}

async function loadDeploymentEnvironment() {
  const envPath = join(projectRoot, ".env");
  try {
    loadEnvFile(envPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        "Missing .env. Copy .env.example to .env and set OBSIDIAN_PATH.",
        { cause: error },
      );
    }
    throw error;
  }
}

async function runDevelopmentServer() {
  loadDeploymentEnvironment();

  const rebuild = async () => {
    const started = Date.now();
    await buildTheme();
    const destination = await deployTheme();
    console.log(
      `Built and deployed to ${destination} in ${Date.now() - started}ms.`,
    );
  };
  const scheduleRebuild = createDebouncedTask(rebuild);
  const onChange = () => {
    scheduleRebuild().catch((error) => console.error(error.message));
  };

  await rebuild();
  const watchers = [
    watch(sourceRoot, { recursive: true }, onChange),
    watch(manifestPath, onChange),
  ];
  console.log("Watching src and manifest.json. Press Ctrl+C to stop.");

  const close = () => {
    watchers.forEach((watcher) => watcher.close());
    process.exit(0);
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}

async function main(command = process.argv[2] ?? "build") {
  assertSupportedNode();

  if (command === "build") {
    const { destination } = await buildTheme();
    console.log(`Built ${relative(projectRoot, destination)}.`);
    return;
  }
  if (command === "check") {
    await checkTheme();
    console.log("Theme build and metadata are current.");
    return;
  }
  if (command === "dev") {
    await runDevelopmentServer();
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

const isDirectRun =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
