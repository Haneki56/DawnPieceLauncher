declare module "electron" {
  export interface App {
    getPath(name: string): string;
    getAppPath(): string;
    whenReady(): Promise<void>;
    on(event: string, listener: (...args: unknown[]) => void): void;
    quit(): void;
  }

  export const app: App;

  export class BrowserWindow {
    constructor(options?: unknown);
    loadFile(filePath: string): Promise<void>;
  }

  export const ipcMain: {
    handle<Args extends unknown[]>(
      channel: string,
      listener: (event: unknown, ...args: Args) => unknown
    ): void;
  };

  export const ipcRenderer: {
    invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  };
}
