type LaunchProfile = {
  id: string;
  name: string;
  channel: "main" | "test";
  manifestUrl: string;
  gameDir: string;
  javaPath: string;
  jvmArgs: string[];
  launchCommand: string[];
  gameArgs: string[];
};

type SyncResult = {
  updated: boolean;
  downloaded: number;
  total: number;
  version: string;
};

const { ipcRenderer } = require("electron") as typeof import("electron");
const profilesContainer = document.getElementById("profiles") as HTMLDivElement;
const statusElement = document.getElementById("status") as HTMLParagraphElement;
const authStatus = document.getElementById("authStatus") as HTMLSpanElement;
const loginBtn = document.getElementById("loginBtn") as HTMLButtonElement;
const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;
const checkAppUpdateButton = document.getElementById("checkAppUpdate") as HTMLButtonElement;
const downloadAppUpdateButton = document.getElementById("downloadAppUpdate") as HTMLButtonElement;
const installAppUpdateButton = document.getElementById("installAppUpdate") as HTMLButtonElement;

function setStatus(text: string): void {
  statusElement.textContent = text;
}

async function refreshAuth() {
  const result = await ipcRenderer.invoke("auth:session");
  if (result && result.sessions && result.sessions.length > 0) {
    const selected = result.selected;
    authStatus.textContent = `Signed in as ${selected.selectedProfile.name}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    // Show account switcher if >1
    let switcher = document.getElementById("accountSwitcher");
    if (!switcher) {
      switcher = document.createElement("select");
      switcher.id = "accountSwitcher";
      authStatus.parentElement?.appendChild(switcher);
    }
    switcher.innerHTML = "";
    for (const s of result.sessions) {
      const opt = document.createElement("option");
      opt.value = s.selectedProfile.id;
      opt.textContent = s.selectedProfile.name + (s.selected ? " (active)" : "");
      if (s.selected) opt.selected = true;
      switcher.appendChild(opt);
    }
    switcher.onchange = async (e) => {
      const uuid = (e.target as HTMLSelectElement).value;
      await ipcRenderer.invoke("auth:choose", uuid);
      await refreshAuth();
    };
    logoutBtn.onclick = async () => {
      const uuid = (switcher as HTMLSelectElement).value;
      await ipcRenderer.invoke("auth:logout", uuid);
      setStatus("Logged out.");
      await refreshAuth();
    };
  } else {
    authStatus.textContent = "Not signed in";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    const switcher = document.getElementById("accountSwitcher");
    if (switcher) switcher.remove();
  }
}

loginBtn.addEventListener("click", async () => {
  setStatus("Opening Microsoft login...");
  const result = await ipcRenderer.invoke("auth:login");
  if (result && result.error) {
    setStatus("Login failed: " + result.error);
  } else {
    setStatus("Login successful.");
    await refreshAuth();
  }
});

void refreshAuth();

checkAppUpdateButton.addEventListener("click", async () => {
  setStatus("Checking for launcher updates...");
  try {
    const result = (await ipcRenderer.invoke("app-update:check")) as {
      available: boolean;
      currentVersion: string;
      nextVersion?: string;
      message: string;
    };
    setStatus(result.message);
  } catch (error) {
    setStatus(`App update check failed: ${(error as Error).message}`);
  }
});

downloadAppUpdateButton.addEventListener("click", async () => {
  setStatus("Downloading launcher update...");
  try {
    const result = (await ipcRenderer.invoke("app-update:download")) as { message: string };
    setStatus(result.message);
  } catch (error) {
    setStatus(`App update download failed: ${(error as Error).message}`);
  }
});

installAppUpdateButton.addEventListener("click", async () => {
  setStatus("Installing launcher update...");
  try {
    const result = (await ipcRenderer.invoke("app-update:install")) as { message: string };
    setStatus(result.message);
  } catch (error) {
    setStatus(`App update install failed: ${(error as Error).message}`);
  }
});

async function refreshProfiles(): Promise<void> {
  const profiles = (await ipcRenderer.invoke("profiles:list")) as LaunchProfile[];
  profilesContainer.innerHTML = "";

  for (const profile of profiles) {
    const card = document.createElement("article");
    card.className = "profile-card";

    const title = document.createElement("h3");
    title.textContent = `${profile.name} (${profile.channel.toUpperCase()})`;

    const manifest = document.createElement("p");
    manifest.className = "manifest";
    manifest.textContent = profile.manifestUrl;

    const actions = document.createElement("div");
    actions.className = "actions";

    const updateButton = document.createElement("button");
    updateButton.textContent = "Update";
    updateButton.addEventListener("click", async () => {
      setStatus(`Syncing ${profile.name}...`);
      try {
        const result = (await ipcRenderer.invoke("updates:sync", profile.id)) as SyncResult;
        setStatus(
          `${profile.name}: ${result.downloaded}/${result.total} files synced (manifest ${result.version})`
        );
      } catch (error) {
        setStatus(`Update failed for ${profile.name}: ${(error as Error).message}`);
      }
    });

    const playButton = document.createElement("button");
    playButton.textContent = "Play";
    playButton.addEventListener("click", async () => {
      setStatus(`Launching ${profile.name}...`);
      try {
        const launchResult = (await ipcRenderer.invoke("launcher:play", profile.id)) as { pid: number };
        setStatus(`${profile.name} launched (PID ${launchResult.pid}).`);
      } catch (error) {
        setStatus(`Launch failed for ${profile.name}: ${(error as Error).message}`);
      }
    });

    actions.append(updateButton, playButton);
    card.append(title, manifest, actions);
    profilesContainer.append(card);
  }
}

void refreshProfiles();
