import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { LaunchProfile } from "./profiles";
import { getCurrentSession } from "./auth";

export interface LaunchResult {
  pid: number;
}

export async function launchProfile(profile: LaunchProfile): Promise<LaunchResult> {
  await mkdir(profile.gameDir, { recursive: true });

  // Inject authenticated session info if available
  let gameArgs = [...profile.gameArgs];
  const session = await getCurrentSession();
  if (session && session.selectedProfile && session.accessToken) {
    // Remove any existing username/uuid/accessToken args
    gameArgs = gameArgs.filter(
      (a, i, arr) =>
        ![
          "--username",
          "--uuid",
          "--accessToken",
          "--userType",
          "--userProperties"
        ].includes(a) &&
        (i === 0 ||
          ![
            "--username",
            "--uuid",
            "--accessToken",
            "--userType",
            "--userProperties"
          ].includes(arr[i - 1]))
    );
    gameArgs.push(
      "--username",
      session.selectedProfile.name,
      "--uuid",
      session.selectedProfile.id,
      "--accessToken",
      session.accessToken,
      "--userType",
      "msa",
      "--userProperties",
      "{}"
    );
  }

  const args = [...profile.jvmArgs, ...profile.launchCommand, ...gameArgs];
  const child = spawn(profile.javaPath, args, {
    cwd: profile.gameDir,
    detached: false,
    stdio: "ignore"
  });

  child.unref();

  if (!child.pid) {
    throw new Error("Failed to start launcher process");
  }

  return { pid: child.pid };
}
