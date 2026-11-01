export function acquireDistLock(root: string): boolean;
export function releaseDistLock(root: string): void;
export function mirrorIntoDist(paths: { publicDir: string; stage: string; dist: string }): { copied: number; removed: number; total: number };
