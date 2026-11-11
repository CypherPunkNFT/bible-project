import type { SpawnSyncOptionsWithStringEncoding, SpawnSyncReturns } from "node:child_process";

export function findPreReleaseChecker(from?: string): string;
export function assertPreReleaseCheckPassed(options?: {
  checker?: string;
  runner?: (command: string, args: string[], options: Pick<SpawnSyncOptionsWithStringEncoding, "cwd">) => SpawnSyncReturns<string>;
}): void;
