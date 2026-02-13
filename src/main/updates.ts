import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { LaunchProfile } from "./profiles";

interface ManifestFile {
  path: string;
  url: string;
  size?: number;
  sha256?: string;
}

interface Manifest {
  version: string;
  files: ManifestFile[];
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  const stream = createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

async function downloadToFile(url: string, destination: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await pipeline(response.body as unknown as NodeJS.ReadableStream, createWriteStream(destination));
}

async function needsDownload(filePath: string, remote: ManifestFile): Promise<boolean> {
  try {
    const fileStat = await stat(filePath);
    if (typeof remote.size === "number" && fileStat.size !== remote.size) {
      return true;
    }
    if (remote.sha256) {
      const localHash = await sha256File(filePath);
      return localHash !== remote.sha256;
    }
    return false;
  } catch {
    return true;
  }
}

export interface SyncResult {
  updated: boolean;
  downloaded: number;
  total: number;
  version: string;
}

export async function syncProfile(profile: LaunchProfile): Promise<SyncResult> {
  const manifestResponse = await fetch(profile.manifestUrl);
  if (!manifestResponse.ok) {
    throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`);
  }

  const manifest = (await manifestResponse.json()) as Manifest;
  await mkdir(profile.gameDir, { recursive: true });

  let downloaded = 0;

  for (const remoteFile of manifest.files) {
    const localPath = path.join(profile.gameDir, remoteFile.path);
    if (await needsDownload(localPath, remoteFile)) {
      await downloadToFile(remoteFile.url, localPath);
      downloaded += 1;
    }
  }

  const localManifestPath = path.join(profile.gameDir, ".local-manifest.json");
  await writeFile(localManifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  return {
    updated: downloaded > 0,
    downloaded,
    total: manifest.files.length,
    version: manifest.version
  };
}
