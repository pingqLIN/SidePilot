import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const EXTENSION_DIR = join(ROOT, "extension");
const DIST_DIR = join(ROOT, "dist");
const MANIFEST_PATH = join(EXTENSION_DIR, "manifest.json");
const POWERSHELL_PATH =
  "/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe";

const SKIP_SEGMENTS = new Set(["_metadata"]);
const SKIP_FILE_PATTERNS = [/\.bak(\.|$)/i, /\.tmp$/i, /^desktop\.ini$/i, /^\.DS_Store$/i];

function shouldSkip(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.some((segment) => SKIP_SEGMENTS.has(segment))) return true;
  const base = segments[segments.length - 1] || "";
  return SKIP_FILE_PATTERNS.some((pattern) => pattern.test(base));
}

async function copyExtensionSource(sourceDir, targetDir, relativePrefix = "") {
  await cp(sourceDir, targetDir, {
    recursive: true,
    filter: (sourcePath) => {
      const relativePath = relativePrefix
        ? join(relativePrefix, sourcePath.slice(sourceDir.length + 1))
        : sourcePath === sourceDir
          ? ""
          : sourcePath.slice(sourceDir.length + 1);

      return !shouldSkip(relativePath);
    },
  });
}

function toWindowsPath(inputPath) {
  try {
    return execFileSync("wslpath", ["-w", inputPath], {
      encoding: "utf8",
    }).trim();
  } catch {
    return inputPath;
  }
}

function zipWithNativeZip(sourceDir, zipPath) {
  execFileSync("zip", ["-qr", zipPath, "."], {
    cwd: sourceDir,
    stdio: "inherit",
  });
}

function zipWithPowerShell(sourceDir, zipPath) {
  const sourceWin = toWindowsPath(sourceDir);
  const zipWin = toWindowsPath(zipPath);
  const command = [
    `Set-Location -LiteralPath '${sourceWin.replace(/'/g, "''")}'`,
    `Compress-Archive -Path * -DestinationPath '${zipWin.replace(/'/g, "''")}' -Force`,
  ].join("; ");
  execFileSync(POWERSHELL_PATH, ["-NoProfile", "-Command", command], {
    stdio: "inherit",
  });
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  const version = String(manifest.version || "0.0.0").trim();
  const packageBase = `SidePilot-extension-v${version}`;
  const unpackedDir = join(DIST_DIR, `${packageBase}-unpacked`);
  const zipPath = join(DIST_DIR, `${packageBase}.zip`);

  await mkdir(DIST_DIR, { recursive: true });
  await rm(unpackedDir, { recursive: true, force: true });
  await rm(zipPath, { force: true });

  await copyExtensionSource(EXTENSION_DIR, unpackedDir);

  const installNote = [
    "SidePilot packaged extension",
    "",
    "How to install:",
    "1. Extract this archive.",
    "2. Open chrome://extensions/",
    "3. Enable Developer mode.",
    "4. Click Load unpacked.",
    `5. Select the extracted folder (${packageBase}-unpacked).`,
    "",
    "This package includes the extension only.",
    "SDK Bridge remains optional and is not bundled into this archive.",
    "",
    `Version: ${version}`,
  ].join("\n");

  await writeFile(join(unpackedDir, "INSTALL.txt"), installNote, "utf8");

  try {
    zipWithNativeZip(unpackedDir, zipPath);
  } catch {
    if (!existsSync(POWERSHELL_PATH)) {
      throw new Error("No available zip tool found (zip / PowerShell Compress-Archive).");
    }
    zipWithPowerShell(unpackedDir, zipPath);
  }

  console.log(`Created unpacked package: ${unpackedDir}`);
  console.log(`Created zip package: ${zipPath}`);
}

main().catch((error) => {
  console.error("[package-extension] Failed:", error?.message || error);
  process.exitCode = 1;
});
