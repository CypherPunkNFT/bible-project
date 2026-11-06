// The build's two parts of the small phrase lists (translation system, stage 5 job 17; scripts/phrase-lists.mjs):
// every built code file but the entry tells the page it has run, so the page can read the words that file shows
// (src/lib/phrase-lists.ts); and after a build of the shared dist/, each language's lists are split for the new code.
import fs from "node:fs";
import path from "node:path";
import MagicString from "magic-string";
import type { Plugin } from "vite";
import { writePhraseLists } from "./phrase-lists.mjs";

// ES5 on purpose: it is added after the code was lowered to the build's target. In a page, self is the window.
export const CODE_RAN = "(self.__bgChunks=self.__bgChunks||[]).push(import.meta.url);";

export function phraseListsPlugin(): Plugin {
  return {
    name: "phrase-lists-code-ran",
    apply: "build",
    renderChunk(code, chunk, options) {
      if (options.format !== "es" || chunk.isEntry || !chunk.fileName.endsWith(".js")) return null;
      const text = new MagicString(code);
      text.prepend(CODE_RAN);
      return { code: text.toString(), map: text.generateMap({ hires: true }) };
    },
  };
}

/** After a build mirrored into the shared dist/ (under the dist lock): each language's lists for the new code, read from
 * the build's own folder. Only for this Website folder's own data/i18n, never a linked one (a release worktree links
 * data/ in, and its build must not rewrite the shared preview's lists). A failure leaves the site reading whole lists. */
export function splitPhraseListsAfterBuild(root: string, stage: string): void {
  const i18n = path.join(root, "data", "i18n");
  try {
    if (!fs.existsSync(i18n) || fs.realpathSync(path.join(root, "data")) !== path.resolve(root, "data")) {
      console.warn(`phrase lists: not split (${i18n} is missing or linked from elsewhere); the site reads the whole lists`);
      return;
    }
    const report = writePhraseLists({ html: fs.readFileSync(path.join(stage, "index.html"), "utf8"), assetsDir: path.join(stage, "assets"), i18nDir: i18n });
    console.log(`phrase lists: split for ${report.build}: ${Object.keys(report.folders).join(", ")}; ${report.coreKeys} core phrases, ${report.groups} parts each`);
  } catch (error) {
    console.warn(`phrase lists: not split (${error instanceof Error ? error.message : String(error)}); the site reads the whole lists until the next build`);
  }
}
