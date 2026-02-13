import { app } from "electron";
import { autoUpdater } from "electron-updater";

export interface AppUpdateCheckResult {
  available: boolean;
  currentVersion: string;
  nextVersion?: string;
  message: string;
}

export function configureAutoUpdater(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
}

export async function checkForAppUpdate(): Promise<AppUpdateCheckResult> {
  if (!app.isPackaged) {
    return {
      available: false,
      currentVersion: app.getVersion(),
      message: "App auto-update is only available in packaged builds."
    };
  }

  const result = await autoUpdater.checkForUpdates();
  if (!result) {
    return {
      available: false,
      currentVersion: app.getVersion(),
      message: "No update metadata returned."
    };
  }

  const currentVersion = app.getVersion();
  const nextVersion = result.updateInfo.version;
  const available = currentVersion !== nextVersion;

  return {
    available,
    currentVersion,
    nextVersion,
    message: available
      ? `Update available: ${currentVersion} → ${nextVersion}`
      : `You are up to date (${currentVersion}).`
  };
}

export async function downloadAppUpdate(): Promise<{ message: string }> {
  if (!app.isPackaged) {
    throw new Error("App auto-update is only available in packaged builds.");
  }

  await autoUpdater.downloadUpdate();
  return {
    message: "Update downloaded. Click 'Install Update' to restart and apply it."
  };
}

export function installDownloadedAppUpdate(): void {
  if (!app.isPackaged) {
    throw new Error("App auto-update is only available in packaged builds.");
  }

  autoUpdater.quitAndInstall();
}
