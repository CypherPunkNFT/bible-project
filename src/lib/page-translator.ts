// Swaps the text written into the page code (headings, buttons, labels) for its translation as it appears on screen.
// The strings come from data/i18n/<folder>/ui.json, {English: translation}, written by content/translation/apply.py
// from the site-translation chunks of kind "page". A text matches only when it is exactly one of those strings, so
// Scripture and content already translated in the data files pass through untouched. React keeps rendering English;
// each time it writes a text or label, the observer swaps it again. Anything inside translate="no" is left alone.
import { languageFolder, siteLanguage } from "./language";

const ATTRIBUTES = ["aria-label", "title", "placeholder", "alt"];
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE"]);

function leftAlone(element: Element | null): boolean {
  return !element || SKIP.has(element.tagName) || element.closest("[translate='no']") !== null;
}

function makeTranslator(strings: Record<string, string>) {
  const translateText = (node: Text) => {
    const raw = node.nodeValue ?? "";
    const key = raw.replace(/\s+/g, " ").trim();
    const value = key && Object.prototype.hasOwnProperty.call(strings, key) ? strings[key] : undefined;
    if (!value || value === key || leftAlone(node.parentElement)) return;
    node.nodeValue = raw.match(/^\s*/)![0] + value + raw.match(/\s*$/)![0];
  };
  const translateAttribute = (element: Element, name: string) => {
    const key = element.getAttribute(name)?.trim();
    const value = key && Object.prototype.hasOwnProperty.call(strings, key) ? strings[key] : undefined;
    if (value && value !== key && !leftAlone(element)) element.setAttribute(name, value);
  };
  const translateTree = (root: Node) => {
    if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text);
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let node: Node | null = root; node; node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
      else for (const name of ATTRIBUTES) if ((node as Element).hasAttribute(name)) translateAttribute(node as Element, name);
    }
  };
  return { translateText, translateAttribute, translateTree };
}

/** Starts swapping page text when a translated language is chosen. Resolves once the strings are loaded (or failed to
 * load, in which case the page simply stays English), so the first render can wait and not flash English. */
export async function startPageTranslator(): Promise<void> {
  const language = siteLanguage();
  const folder = languageFolder(language);
  document.documentElement.lang = language;
  if (!folder) return;
  let strings: Record<string, string>;
  try {
    const response = await fetch(`/data/i18n/${folder}/ui.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    strings = (await response.json()) as Record<string, string>;
  } catch (error) {
    console.warn(`page translation: could not load /data/i18n/${folder}/ui.json (${String(error)}); the page text stays English`);
    return;
  }
  const { translateText, translateAttribute, translateTree } = makeTranslator(strings);
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") translateText(record.target as Text);
      else if (record.type === "attributes") translateAttribute(record.target as Element, record.attributeName!);
      else record.addedNodes.forEach(translateTree);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
  translateTree(document.body);
}
