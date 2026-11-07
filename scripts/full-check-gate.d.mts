// Types for scripts/full-check-gate.mjs (the translation full check's release gate, translation system stage 6 job 23).
export type FullCheckStamp = { copy: string; bundle: string; commit?: string; languages: string[] };
type Runner = (command: string, args: string[], options: { cwd: string }) => { status: number | null; stdout?: string; stderr?: string; error?: Error & { code?: string } };
export function findChecker(from?: string): string;
export function assertFullCheckPassed(site: string, options?: { data?: string; languages?: readonly string[]; package?: boolean; runner?: Runner; checker?: string }): FullCheckStamp;
export function onlyDryRun(argv: readonly string[]): boolean;
