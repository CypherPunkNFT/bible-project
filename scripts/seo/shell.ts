// A ready-made copy of a page for search engines that do not run its code: the release's own index.html with the page's
// head (title, description, official address, its versions in other languages) and the page's text and links inside
// #root, hidden and replaced by the app as soon as it starts. Shared by the English copies (build.ts) and the language
// copies (language-copies.ts).
import { pageLinks, LANGUAGE_ADDRESSES_RELEASED, type Alternate } from "../../src/lib/language-addresses.ts";
import { isUnnamed, pageHead } from "../../src/lib/page-head.ts";

/** What capture.ts read from a page. */
export interface Block { tag: "h1" | "h2" | "h3" | "h4" | "p" | "li"; text: string }
export interface Capture {
  path: string; capturedAt: string; base: string;
  title: string; heading: string; paragraph: string;
  blocks: Block[]; links: { path: string; text: string }[];
  /** The page's description as the page itself set it (usePageHead), in its language. */
  description?: string;
  /** For a capture in a language: its code, and the site's build (entry code file) it was read from. */
  language?: string; build?: string;
}

const HIDDEN = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);border:0";

export const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function replaceOnce(html: string, pattern: RegExp, replacement: string, what: string): string {
  const matches = html.match(new RegExp(pattern.source, "g"))?.length ?? 0;
  if (matches !== 1) throw new Error(`seo build: expected one ${what} in index.html, found ${matches}; was the page shell changed?`);
  return html.replace(pattern, () => replacement);
}

/** The page's text and links; `linkTo` gives each link's address in the copy (a language copy points at its own). */
export function body(capture: Capture, linkTo: (path: string) => string = (path) => path): string {
  const out: string[] = [];
  let list = false;
  for (const block of capture.blocks as Block[]) {
    if (block.tag === "li" && !list) { out.push("<ul>"); list = true; }
    if (block.tag !== "li" && list) { out.push("</ul>"); list = false; }
    out.push(`<${block.tag}>${escape(block.text)}</${block.tag}>`);
  }
  if (list) out.push("</ul>");
  const links = capture.links.map((link) => `<li><a href="${escape(linkTo(link.path))}">${escape(link.text)}</a></li>`).join("");
  return `<div data-ready-made style="${HIDDEN}"><main>${out.join("")}</main><nav aria-label="Pages"><ul>${links}</ul></nav></div>`;
}

export interface CopyHead {
  title: string; description: string; canonical: string; alternates: Alternate[];
  /** For a language copy: <html lang> and dir. English keeps the shell's. */
  language?: { code: string; dir: "ltr" | "rtl" };
}

/** The shell with the page's head and body written in; every value is escaped. */
export function fillShell(shell: string, head: CopyHead, content: string): string {
  let html = shell;
  if (head.language) html = replaceOnce(html, /<html lang="en">/, `<html lang="${escape(head.language.code)}" dir="${head.language.dir === "rtl" ? "rtl" : "ltr"}">`, '<html lang="en">');
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escape(head.title)}</title>`, "title");
  html = replaceOnce(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escape(head.description)}" />`, "description");
  for (const [attribute, value] of [["property=\"og:title\"", head.title], ["name=\"twitter:title\"", head.title], ["property=\"og:description\"", head.description], ["name=\"twitter:description\"", head.description], ["property=\"og:url\"", head.canonical]]) {
    html = replaceOnce(html, new RegExp(`<meta ${attribute} content="[^"]*" />`), `<meta ${attribute} content="${escape(value)}" />`, attribute);
  }
  const links = [`<link rel="canonical" href="${escape(head.canonical)}" />`, ...head.alternates.map((alternate) => `<link rel="alternate" hreflang="${escape(alternate.hreflang)}" href="${escape(alternate.href)}" />`)];
  html = replaceOnce(html, /<\/head>/, `  ${links.join("\n    ")}\n  </head>`, "</head>");
  return replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${content}</div>`, "#root");
}

/** A main page's English copy. `addresses`: whether the language addresses are released (src/lib/language-addresses.ts);
 * then a main page with language versions lists them (hreflang). */
export function readyMade(shell: string, capture: Capture, addresses: boolean = LANGUAGE_ADDRESSES_RELEASED): string {
  const head = pageHead(capture.path, { ...capture, subheading: capture.blocks.find((block) => block.tag === "h2")?.text });
  const title = isUnnamed(capture.title) ? head.title : capture.title;
  const { canonical, alternates } = pageLinks(capture.path, "en", addresses);
  return fillShell(shell, { title, description: head.description, canonical, alternates }, body(capture));
}
