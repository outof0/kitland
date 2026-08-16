#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { deflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(scriptDirectory, "..");
const distDirectory = resolve(appDirectory, "dist");
const artifactDirectory = resolve(appDirectory, "artifacts");
const packageJson = JSON.parse(readFileSync(resolve(appDirectory, "package.json"), "utf8"));
const version = packageJson.version;

if (!existsSync(resolve(distDirectory, "manifest.json"))) {
  throw new Error("Missing dist/manifest.json. Run the production build before packaging.");
}

const files = listFiles(distDirectory);

// 1. Chrome artifact: exact dist as built (MV3, permission-free, deterministic)
const chromeArchive = createZip(
  files.map((absolutePath) => ({
    name: relative(distDirectory, absolutePath).split("\\").join("/"),
    data: readFileSync(absolutePath),
  })),
);

// 2. Firefox artifact: patched manifest with browser_specific_settings.gecko
const firefoxFiles = files.map((absolutePath) => {
  const name = relative(distDirectory, absolutePath).split("\\").join("/");
  let data = readFileSync(absolutePath);
  if (name === "manifest.json") {
    const manifest = JSON.parse(data.toString("utf8"));
    const { scripts: _scripts, ...background } = manifest.background ?? {};
    const patched = {
      ...manifest,
      background,
      browser_specific_settings: {
        gecko: {
          id: "kitland@outof0.dev",
          strict_min_version: "115.0",
        },
      },
    };
    data = Buffer.from(`${JSON.stringify(patched, null, 2)}\n`);
  }
  return { name, data };
});
const firefoxArchive = createZip(firefoxFiles);
const genericArchive = chromeArchive;

mkdirSync(artifactDirectory, { recursive: true });
for (const entry of readdirSync(artifactDirectory)) {
  if (entry.endsWith(".zip")) rmSync(resolve(artifactDirectory, entry));
}

const chromePath = resolve(artifactDirectory, `kitland-chrome-v${version}.zip`);
const firefoxPath = resolve(artifactDirectory, `kitland-firefox-v${version}.zip`);
const genericPath = resolve(artifactDirectory, `kitland-browser-extension-v${version}.zip`);

writeFileSync(chromePath, chromeArchive);
writeFileSync(firefoxPath, firefoxArchive);
writeFileSync(genericPath, genericArchive);

console.log(
  `Created ${basename(chromePath)} (${formatBytes(chromeArchive.byteLength)}, ${files.length} files)`,
);
console.log(
  `Created ${basename(firefoxPath)} (${formatBytes(firefoxArchive.byteLength)}, ${files.length} files)`,
);
console.log(`Created ${basename(genericPath)} (alias for Chrome)`);

function listFiles(directory) {
  return readdirSync(directory)
    .sort()
    .flatMap((entry) => {
      const absolutePath = join(directory, entry);
      return statSync(absolutePath).isDirectory() ? listFiles(absolutePath) : [absolutePath];
    });
}

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const crc = crc32(entry.data);
    const compressed = deflateRawSync(entry.data, { level: 9 });
    const useCompression = compressed.byteLength < entry.data.byteLength;
    const payload = useCompression ? compressed : entry.data;
    const method = useCompression ? 8 : 0;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(33, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(payload.byteLength, 18);
    localHeader.writeUInt32LE(entry.data.byteLength, 22);
    localHeader.writeUInt16LE(name.byteLength, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, payload);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(33, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payload.byteLength, 20);
    centralHeader.writeUInt32LE(entry.data.byteLength, 24);
    centralHeader.writeUInt16LE(name.byteLength, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.byteLength + name.byteLength + payload.byteLength;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.byteLength, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function formatBytes(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KiB`;
}
