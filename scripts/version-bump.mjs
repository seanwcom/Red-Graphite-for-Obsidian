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
  lock: join(projectRoot, "package-lock.json"),
  manifest: join(projectRoot, "manifest.json"),
  package: join(projectRoot, "package.json"),
  versions: join(projectRoot, "versions.json"),
};

const [lockText, manifestText, packageText, versionsText] = await Promise.all([
  readFile(paths.lock, "utf8"),
  readFile(paths.manifest, "utf8"),
  readFile(paths.package, "utf8"),
  readFile(paths.versions, "utf8"),
]);
const packageLock = JSON.parse(lockText);
const manifest = JSON.parse(manifestText);
const packageJson = JSON.parse(packageText);
const versions = JSON.parse(versionsText);

manifest.version = version;
packageJson.version = version;
packageLock.version = version;
packageLock.packages[""].version = version;
versions[version] = manifest.minAppVersion;

await Promise.all([
  writeFile(paths.lock, `${JSON.stringify(packageLock, null, 2)}\n`),
  writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`),
  writeFile(paths.package, `${JSON.stringify(packageJson, null, 2)}\n`),
  writeFile(paths.versions, `${JSON.stringify(versions, null, 2)}\n`),
]);

console.log(
  `Updated package, manifest, lockfile, and versions metadata to ${version}.`,
);
