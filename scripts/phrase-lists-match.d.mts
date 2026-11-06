// Types for scripts/phrase-lists-match.mjs (which code shows which phrase, translation system stage 5 job 17).
export const MOST_CORE_WORDS: number;
export const MOST_FILES: number;
export function readableCode(code: string): string;
export function phrasePieces(key: string): string[];
export function liveCode(html: string, assetsDir: string): { entry: string; first: string[]; code: Map<string, string> };
export function filesShowing(keys: string[], code: Map<string, string>): Map<string, string[]>;
export function coreByRule(key: string): boolean;
export function coreByCode(showing: string[], first: Set<string>): boolean;
