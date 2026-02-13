import { app, ipcMain, shell } from "electron";
import { UserService, UserState, UserProfile } from "@xmcl/user";
import path from "node:path";
import { writeFile, readFile } from "node:fs/promises";

const SESSION_PATH = path.join(app.getPath("userData"), "mc-sessions.json");

const userService = new UserService();


async function saveSessions(states: UserState[]) {
  await writeFile(SESSION_PATH, JSON.stringify(states), "utf-8");
}

async function loadSessions(): Promise<UserState[]> {
  try {
    const raw = await readFile(SESSION_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getSelectedSession(sessions: UserState[]): UserState | undefined {
  return sessions.find(s => s.selected) || sessions[0];
}

  ipcMain.handle("auth:login", async () => {
    try {
      const { login } = userService;
      const { code, url } = await login.getLogin();
      shell.openExternal(url);
      const result = await login.waitForCode(code);
      let sessions = await loadSessions();
      // Mark all as not selected
      sessions = sessions.map(s => ({ ...s, selected: false }));
      // Add new session as selected
      sessions.push({ ...result.state, selected: true });
      await saveSessions(sessions);
      return { profile: result.profile, state: result.state, sessions };
    } catch (e) {
      return { error: (e as Error).message };
    }
  });

  ipcMain.handle("auth:session", async () => {
    try {
      const sessions = await loadSessions();
      // Try to refresh tokens for all sessions
      for (const s of sessions) {
        try {
          await userService.refresh(s);
        } catch {}
      }
      await saveSessions(sessions);
      return { sessions, selected: getSelectedSession(sessions) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  });

  ipcMain.handle("auth:logout", async (_event, uuid: string) => {
    let sessions = await loadSessions();
    sessions = sessions.filter(s => s.selectedProfile?.id !== uuid);
    if (sessions.length > 0) sessions[0].selected = true;
    await saveSessions(sessions);
    return { ok: true };
  });


}

export function setupAuthIpc() {
  // The function body is above
}

export async function getCurrentSession(): Promise<UserState | undefined> {
  const sessions = await loadSessions();
  return getSelectedSession(sessions);
}
