import { App } from "electron";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export interface LaunchProfile {
  id: string;
  name: string;
  channel: "main" | "test";
  manifestUrl: string;
  gameDir: string;
  javaPath: string;
  jvmArgs: string[];
  launchCommand: string[];
  gameArgs: string[];
}

function getProfilesPath(app: App): string {
  return path.join(app.getPath("userData"), "profiles.json");
}

export async function ensureProfilesFile(app: App): Promise<void> {
  const profilesPath = getProfilesPath(app);
  await mkdir(path.dirname(profilesPath), { recursive: true });

  try {
    await stat(profilesPath);
  } catch {
    const defaultsPath = path.join(app.getAppPath(), "resources", "default-profiles.json");
    const defaultsRaw = await readFile(defaultsPath, "utf-8");
    await writeFile(profilesPath, defaultsRaw, "utf-8");
  }
}

export async function listProfiles(app: App): Promise<LaunchProfile[]> {
  await ensureProfilesFile(app);
  const raw = await readFile(getProfilesPath(app), "utf-8");
  const parsed = JSON.parse(raw) as LaunchProfile[];
  return parsed;
}
