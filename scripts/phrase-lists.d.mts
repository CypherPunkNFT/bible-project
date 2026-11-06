// Types for scripts/phrase-lists.mjs (the small phrase lists, translation system stage 5 job 17).
export const LIST_FOLDER: string;
export const OWN_GROUP_BYTES: number;
export const GROUP_BYTES: number;
export const MOST_GROUPS: number;
export const STAMP_MARKER: RegExp;
export interface PhraseListsReport {
  build: string;
  codeFiles: number;
  coreKeys: number;
  groups: number;
  folders: Record<string, { core: number; inGroups: number; removed: number }>;
}
export function phraseFolders(i18nDir: string): string[];
export function planGroups(keysByFile: Map<string, string[]>): Map<string, string>;
export function writePhraseLists(options: { html: string; assetsDir: string; i18nDir: string; folders?: string[] }): PhraseListsReport;
export function phraseStamp(i18nDir: string, folders?: string[]): string;
export function writeStamp(htmlFile: string, stamp: string): void;
export function preparePhraseLists(site: string): PhraseListsReport & { stamp: string; stampedPages: number };
