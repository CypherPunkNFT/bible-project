// Test helpers for the widget script (docs/features/verse-widget/design.md 10): runs the real public/widget/v1/verse.js
// in the test window, with a fake fetch, a chosen visibility and, where wanted, a fake currentScript.
import { readFileSync } from "node:fs";
import { vi } from "vitest";

export const WIDGET_SOURCE = readFileSync("public/widget/v1/verse.js", "utf8");

export interface WidgetInternals {
  version: number;
  origin: string;
  render(element: HTMLElement, day?: unknown): Promise<unknown>;
  scan(): void;
  isDay(value: unknown): boolean;
  isPool(value: unknown): boolean;
  options: Record<string, string[]>;
  stop(): void;
}

export const widget = (): WidgetInternals => (window as unknown as { __bibleGuideVerse: WidgetInternals }).__bibleGuideVerse;

/** Runs the script once, as a page would; `src` stands in for document.currentScript.src. */
export function runWidget(src?: string): void {
  if (src) Object.defineProperty(document, "currentScript", { configurable: true, get: () => ({ src }) });
  try {
    new Function(WIDGET_SOURCE)();
  } finally {
    if (src) delete (document as unknown as { currentScript?: unknown }).currentScript;
  }
}

/** Stops every copy's listeners and timers and empties the page, so tests never leak into each other. */
export function resetWidget(): void {
  const holder = window as unknown as { __bibleGuideVerse?: WidgetInternals };
  holder.__bibleGuideVerse?.stop();
  delete holder.__bibleGuideVerse;
  document.body.replaceChildren();
  delete (document as unknown as { visibilityState?: unknown }).visibilityState;
}

let visibility: DocumentVisibilityState = "visible";
/** Sets document.visibilityState, and fires visibilitychange when asked. */
export function setVisibility(state: DocumentVisibilityState, fire = false): void {
  visibility = state;
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  if (fire) document.dispatchEvent(new Event("visibilitychange"));
}

export interface FakeFile { status?: number; type?: string; body: string }

/** A fetch that answers from a table of paths (after the origin), and anything else as the site's page, 200 HTML. */
export function fakeFetch(files: Record<string, FakeFile | unknown>, origin = "https://bibleguide.io") {
  const fetch = vi.fn(async (url: string) => {
    const path = url.startsWith(origin) ? url.slice(origin.length) : url;
    const found = files[path];
    const file: FakeFile = found === undefined ? { type: "text/html", body: "<!doctype html><title>Bible Guide</title>" }
      : typeof found === "object" && found !== null && "body" in found ? found as FakeFile : { body: JSON.stringify(found) };
    return {
      status: file.status ?? 200,
      headers: { get: (name: string) => (name.toLowerCase() === "content-type" ? file.type ?? "application/json" : null) },
      json: async () => JSON.parse(file.body),
    };
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** Lets the script's promise chains finish. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

/** Adds a snippet div with the given data- attributes and the fallback links. */
export function addDiv(attributes: Record<string, string> = {}): HTMLDivElement {
  const div = document.createElement("div");
  div.className = "bibleguide-verse";
  for (const [name, value] of Object.entries(attributes)) div.setAttribute(name, value);
  const link = (href: string, text: string) => Object.assign(document.createElement("a"), { href, textContent: text });
  div.append(link("https://bibleguide.io/verse-of-the-day", "Today's Bible verse"), " from ", link("https://bibleguide.io/", "Bible Guide"));
  document.body.appendChild(div);
  return div;
}

export const day = (date: string, extra: Record<string, unknown> = {}) => ({
  v: 1, date, text: "Words standing in for one day's verse in the tests.", reference: "Genesis 1:1", translation: "BSB",
  read: "/read/bsb/GEN/1?hl=1", season: null, ...extra,
});
