// Types for scripts/full-check-gate.mjs (the translation full check's release gate, translation system stage 6 job 23).
export type FullCheckStamp = { copy: string; bundle: string; commit?: string; languages: string[] };
type Runner = (command: string, args: string[], options: { cwd: string; timeout?: number }) => { status: number | null; stdout?: string; stderr?: string; error?: Error & { code?: string } };
export function findChecker(from?: string): string;
export type FullCheckResult = ({ passed: true } & FullCheckStamp) | { passed: false; warning: string };
export const RELEASES_WAIT_FOR_FULL_CHECK: boolean;
export function assertFullCheckPassed(site: string, options?: { data?: string; languages?: readonly string[]; package?: boolean; runner?: Runner; checker?: string; stops?: boolean }): FullCheckResult;
export function onlyDryRun(argv: readonly string[]): boolean;
