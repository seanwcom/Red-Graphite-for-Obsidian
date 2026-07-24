import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { projectRoot } from "./build.mjs";

const version = process.argv[2];
const semver = /^\d+\.\d+\.\d+$/;

if (!semver.test(version ?? "")) {
  console.error("Usage: npm run version -- 2.0.1");
  process.exit(1);
}

const paths = {
  manifest: join(projectRoot, "manifest.json"),
  package: join(projectRoot, "package.json"),
  versions: join(projectRoot, "versions.json"),
};

const [manifestText, packageText, versionsText] = await Promise.all([
  readFile(paths.manifest, "utf8"),
  readFile(paths.package, "utf8"),
  readFile(paths.versions, "utf8"),
]);
const manifest = JSON.parse(manifestText);
const packageJson = JSON.parse(packageText);
const versions = JSON.parse(versionsText);

manifest.version = version;
packageJson.version = version;
versions[version] = manifest.minAppVersion;

await Promise.all([
  writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`),
  writeFile(paths.package, `${JSON.stringify(packageJson, null, 2)}\n`),
  writeFile(paths.versions, `${JSON.stringify(versions, null, 2)}\n`),
]);

console.log(`Updated package.json, manifest.json, and versions.json to ${version}.`);
