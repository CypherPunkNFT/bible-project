// The main pages' ready-made copies in each language, at their language addresses (/es/study -> es/study.html, the home
// page /es -> es.html), for search engines that do not run the page's code (translation system, stage 5 job 18;
// src/lib/language-addresses.ts). Made from captures of each page read in its language
// (bun scripts/seo/capture.ts --language <folder>, written to content/seo/languages/<folder>/), and the release's or the
// build's own index.html. Two callers:
//   - the release (build.ts), only once the owner has released the addresses: every copy must exist, or it stops;
//   - every build of the shared preview (vite.config.ts), which writes what it has into the build before dist/ is updated,
//     and only warns. By hand, after new captures (under the shared lock for dist/):  bun scripts/seo/language-copies.ts dist
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { addressLanguages, ADDRESSED_PAGES, COPY_LIMIT, isAddressedPage, languageAddress, pageLinks } from "../../src/lib/language-addresses.ts";
import type { SiteLanguage } from "../../src/lib/site-languages.ts";
import { body, fillShell, type Capture } from "./shell.ts";

export const LANGUAGE_CAPTURES = path.join("content", "seo", "languages");

/** Where a page's capture in a language is kept, under the Website folder `root`. */
export const languageCaptureFile = (root: string, folder: string, pagePath: string) =>
  path.join(root, LANGUAGE_CAPTURES, folder, (pagePath === "/" ? "index" : pagePath.slice(1).split("/").join("__")) + ".json");

/** The file a language address is served from: "/es" -> es.html, "/es/study" -> es/study.html. */
export const languageCopyFile = (site: string, address: string) => path.join(site, ...address.slice(1).split("/")) + ".html";

export interface PlannedCopy { language: SiteLanguage; page: string; address: string }

/** Every copy the addresses call for; more than the owner's cap stops whoever asks. */
export function plannedCopies(languages: readonly SiteLanguage[] = addressLanguages(), pages: readonly string[] = ADDRESSED_PAGES): PlannedCopy[] {
  const planned = languages.flatMap((language) => pages.map((page) => ({ language, page, address: languageAddress(page, language.folder!) })));
  if (planned.length > COPY_LIMIT) {
    throw new Error(`language copies: ${pages.length} pages x ${languages.length} languages = ${planned.length} files, over the owner's cap of ${COPY_LIMIT} (src/lib/language-addresses.ts); drop pages from ADDRESSED_PAGES or ask the owner`);
  }
  return planned;
}

/** A page's copy in a language: <html lang dir>, the page's own title and description as read in the language, its
 * language address as the official one, its versions in every language, and its links to other main pages pointed at
 * their address in the same language. */
export function languageCopy(shell: string, capture: Capture, language: SiteLanguage): string {
  if (!capture.description) throw new Error(`language copies: the ${language.code} capture of ${capture.path} has no description; capture it again`);
  const links = pageLinks(capture.path, language.code, true);
  const linkTo = (target: string) => (isAddressedPage(target) ? languageAddress(target, language.folder!) : target);
  return fillShell(shell, { title: capture.title, description: capture.description, ...links, language: { code: language.code, dir: language.dir } }, body(capture, linkTo));
}

export interface CopiesWritten { written: string[]; missing: string[] }

/** Writes every copy that has a capture into `site` (paths in `written` are relative to it, with "/"). `strict` (the
 * release): a missing capture, or a file already there, stops it, so a release never names a language version that does
 * not exist or ships one it did not make. Otherwise a copy already there is replaced. */
export function writeLanguageCopies(site: string, root: string, strict: boolean): CopiesWritten {
  const shell = readFileSync(path.join(site, "index.html"), "utf8");
  const result: CopiesWritten = { written: [], missing: [] };
  for (const { language, page, address } of plannedCopies()) {
    const captureFile = languageCaptureFile(root, language.folder!, page);
    const file = languageCopyFile(site, address);
    if (!existsSync(captureFile) || (strict && existsSync(file))) {
      result.missing.push(`${address} (${existsSync(captureFile) ? "a file is already there" : "not captured"})`);
      continue;
    }
    const capture = JSON.parse(readFileSync(captureFile, "utf8")) as Capture;
    if (capture.path !== page || capture.language !== language.code) throw new Error(`language copies: ${captureFile} holds ${capture.path} in ${capture.language}; expected ${page} in ${language.code}`);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, languageCopy(shell, capture, language), "utf8");
    result.written.push(path.relative(site, file).split(path.sep).join("/"));
  }
  if (strict && result.missing.length) throw new Error(`language copies: ${result.missing.length} of ${plannedCopies().length} cannot be written (bun scripts/seo/capture.ts --language <folder>):\n  ${result.missing.join("\n  ")}`);
  return result;
}

/** After a build of the shared preview, before dist/ is updated: the copies, written into the build's own folder so they
 * reach dist/ with the code they were made for. Never stops the build. */
export function previewLanguageCopies(root: string, stage: string): void {
  try {
    const { written, missing } = writeLanguageCopies(stage, root, false);
    console.log(`language copies: ${written.length} written for the preview${missing.length ? `; ${missing.length} not captured yet` : ""}`);
  } catch (error) {
    console.warn(`language copies: not written (${error instanceof Error ? error.message : String(error)}); the language addresses still work through the app`);
  }
}

if (import.meta.main) {
  const site = process.argv[2];
  if (!site || !existsSync(path.join(site, "index.html"))) throw new Error(`language copies: give a site folder (with index.html); got ${site ?? "nothing"}`);
  const { written, missing } = writeLanguageCopies(path.resolve(site), path.resolve(import.meta.dirname, "../.."), false);
  console.log(`language copies: ${written.length} written into ${site}; ${missing.length} left out${missing.length ? `:\n  ${missing.join("\n  ")}` : ""}`);
}
