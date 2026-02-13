declare namespace NodeJS {
  interface ReadableStream {}
}

declare function require(name: string): unknown;

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function dirname(path: string): string;
  const path: { join: typeof join; dirname: typeof dirname };
  export default path;
}

declare module "node:child_process" {
  interface ChildProcess {
    pid?: number;
    unref(): void;
  }

  interface SpawnOptions {
    cwd?: string;
    detached?: boolean;
    stdio?: "ignore" | "inherit" | "pipe";
  }

  export function spawn(command: string, args?: string[], options?: SpawnOptions): ChildProcess;
}

declare module "node:crypto" {
  interface Hash {
    update(data: unknown): void;
    digest(encoding: "hex"): string;
  }

  export function createHash(algorithm: string): Hash;
}

declare module "node:fs" {
  interface AsyncReadable extends AsyncIterable<unknown> {}

  export function createReadStream(path: string): AsyncReadable;
  export function createWriteStream(path: string): unknown;
}

declare module "node:fs/promises" {
  interface StatResult {
    size: number;
  }

  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readFile(path: string, encoding: string): Promise<string>;
  export function writeFile(path: string, data: string, encoding: string): Promise<void>;
  export function stat(path: string): Promise<StatResult>;
}

declare module "node:stream/promises" {
  export function pipeline(...streams: unknown[]): Promise<void>;
}
