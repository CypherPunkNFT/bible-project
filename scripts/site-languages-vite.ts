// Writes each site language's code, reading direction and released mark into index.html's language script, from the
// one language file (src/lib/site-languages.json), so <html lang> and dir are right before the first paint
// (translation system, stage 5 job 15; SiteTranslation/system/HANDOFF.md). index.html itself names no language: its
// marker is an empty list until this fills it, and an empty list leaves the page as it was (English, left to right).
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

export const MARKER = "/*site-languages*/{}";
const CODE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

export interface HeadLanguage { dir: "ltr" | "rtl"; released: boolean }

/** code -> {dir, released} for every translated language (not the source one), refusing anything but plain values. */
export function headLanguages(languages: unknown, file: string): Record<string, HeadLanguage> {
  if (!Array.isArray(languages)) throw new Error(`site languages: ${file} has no "languages" list; expected the one language file`);
  const found: Record<string, HeadLanguage> = {};
  for (const language of languages) {
    const { code, dir, released, folder } = (language ?? {}) as Record<string, unknown>;
    if (typeof code !== "string" || !CODE.test(code) || (dir !== "ltr" && dir !== "rtl") || typeof released !== "boolean") {
      throw new Error(`site languages: ${file} entry ${JSON.stringify(language)} is not {code, dir: "ltr" or "rtl", released: true or false}`);
    }
    if (folder !== null) found[code] = { dir, released };
  }
  return found;
}

/** index.html with its marker filled; the build stops unless there is exactly one. "<" is escaped, so nothing written
 * here can close the script. */
export function withHeadLanguages(html: string, languages: Record<string, HeadLanguage>): string {
  const count = html.split(MARKER).length - 1;
  if (count !== 1) throw new Error(`site languages: expected one ${MARKER} in index.html, found ${count}`);
  return html.replace(MARKER, () => JSON.stringify(languages).replace(/</g, "\\u003c"));
}

export function siteLanguagesPlugin(root: string): Plugin {
  const file = path.join(root, "src/lib/site-languages.json");
  return {
    name: "site-languages-head",
    transformIndexHtml(html, context) {
      if (context.path !== "/index.html") return html; // other pages (the share-card maker) carry no language script
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { languages?: unknown };
      return withHeadLanguages(html, headLanguages(parsed.languages, file));
    },
  };
}
