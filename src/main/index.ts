import { app, BrowserWindow, ipcMain } from "electron";
import { setupAuthIpc } from "./auth";
import {
  checkForAppUpdate,
  configureAutoUpdater,
  downloadAppUpdate,
  installDownloadedAppUpdate
} from "./app-updater";
import { launchProfile } from "./launcher";
import { listProfiles } from "./profiles";
import { syncProfile } from "./updates";

async function createMainWindow(): Promise<void> {
  const mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    title: "DawnPiece Launcher",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  await mainWindow.loadFile(`${app.getAppPath()}/src/renderer/index.html`);
}

ipcMain.handle("profiles:list", async () => {
  return listProfiles(app);
});

ipcMain.handle("updates:sync", async (_event: unknown, profileId: string) => {
  const profiles = await listProfiles(app);
  const profile = profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }
  return syncProfile(profile);
});

ipcMain.handle("launcher:play", async (_event: unknown, profileId: string) => {
  const profiles = await listProfiles(app);
  const profile = profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(`Profile not found: ${profileId}`);
  }
  return launchProfile(profile);
});

ipcMain.handle("app-update:check", async () => {
  return checkForAppUpdate();
});

ipcMain.handle("app-update:download", async () => {
  return downloadAppUpdate();
});

ipcMain.handle("app-update:install", async () => {
  installDownloadedAppUpdate();
  return { message: "Installing update and restarting..." };
});

app.whenReady().then(async () => {
  configureAutoUpdater();
  setupAuthIpc();
  await createMainWindow();
});

app.on("window-all-closed", () => {
  const platform = (globalThis as { process?: { platform?: string } }).process?.platform;
  if (platform !== "darwin") {
    app.quit();
  }
});
