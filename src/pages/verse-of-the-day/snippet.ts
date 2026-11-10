// The code a church pastes (docs/features/verse-widget/design.md 3.2, 5.1): options in, text out. Only options changed
// from their defaults are written, so the default snippet is as short as it can be. This is code, not page wording: it
// stays English and its box on the page carries translate="no".

export const WIDGET_HOME = "https://bibleguide.io";

/** The options of design 5.1, each with its default first. verse-of-the-day-page.test.ts checks verse.js knows them all. */
export const OPTION_VALUES = {
  style: ["plain", "card"],
  theme: ["auto", "light", "dark"],
  font: ["site", "serif", "sans"],
  size: ["standard", "compact"],
  heading: ["verse-of-the-day", "todays-verse", "none"],
  align: ["start", "center"],
} as const;

type Values = typeof OPTION_VALUES;
export type OptionName = keyof Values;

export interface WidgetOptions {
  style: Values["style"][number];
  theme: Values["theme"][number];
  font: Values["font"][number];
  size: Values["size"][number];
  heading: Values["heading"][number];
  align: Values["align"][number];
  /** "#rgb" or "#rrggbb", or null for links in the text colour. */
  accent: string | null;
  /** A Plain frame cannot see the page, so it is told its text colour: "light" means dark text (design 5.1). */
  frameText: "light" | "dark";
}

export const DEFAULT_OPTIONS: WidgetOptions = {
  style: "plain", theme: "auto", font: "site", size: "standard", heading: "verse-of-the-day", align: "start", accent: null, frameText: "light",
};

const ACCENT = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

/** A colour a person typed, if it is one the widget accepts; anything else never reaches a snippet. */
export const cleanAccent = (value: string | null | undefined): string | null => (value && ACCENT.test(value.trim()) ? value.trim().toLowerCase() : null);

/** The recommended frame heights (design 5.4). Measured in Chromium on 2026-11-10 with the longest scheduled day
 * (Deuteronomy 8:3, 231 characters) in a 280px frame: the least height at which it fits after the frame's own steps
 * (font down to 14px, then no date line) was 210 plain and 266 card at standard, 188 and 246 at compact, the same in
 * either font. Each is that plus a small margin; most days show at full size within them. */
export const FRAME_HEIGHTS = { standard: { plain: 240, card: 280 }, compact: { plain: 200, card: 260 } } as const;
export const frameHeight = (options: WidgetOptions): number => FRAME_HEIGHTS[options.size][options.style];

/** The options a snippet writes, in a fixed order, leaving out defaults and options that do not apply. */
function changed(options: WidgetOptions, frame: boolean): [string, string][] {
  const written: [string, string][] = [];
  const add = (name: string, value: string, fallback: string) => { if (value !== fallback) written.push([name, value]); };
  add("style", options.style, DEFAULT_OPTIONS.style);
  if (options.style === "card") add("theme", options.theme, DEFAULT_OPTIONS.theme);
  else if (frame) written.push(["theme", options.frameText]);
  const accent = cleanAccent(options.accent);
  if (accent) written.push(["accent", accent]);
  // The frame has no "your website's font" and draws serif by default.
  if (frame) add("font", options.font === "site" ? "serif" : options.font, "serif");
  else add("font", options.font, DEFAULT_OPTIONS.font);
  add("size", options.size, DEFAULT_OPTIONS.size);
  add("heading", options.heading, DEFAULT_OPTIONS.heading);
  add("align", options.align, DEFAULT_OPTIONS.align);
  return written;
}

/** The two plain links every snippet carries: what shows when the script cannot run. */
export const FALLBACK_LINKS = `<a href="${WIDGET_HOME}/verse-of-the-day">Today's Bible verse</a>\n  from <a href="${WIDGET_HOME}/">Bible Guide</a>`;

/** The first tab, "Most websites (recommended)". */
export function scriptSnippet(options: WidgetOptions): string {
  const attributes = changed(options, false).map(([name, value]) => ` data-${name}="${value}"`).join("");
  return `<div class="bibleguide-verse"${attributes}>\n  ${FALLBACK_LINKS}\n</div>\n`
    + `<script src="${WIDGET_HOME}/widget/v1/verse.js" async referrerpolicy="no-referrer"></script>`;
}

/** The frame's address for a set of options, with the defaults left out. */
export function frameAddress(options: WidgetOptions, home = WIDGET_HOME): string {
  const query = changed(options, true).map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("&");
  return `${home}/widget/v1/frame${query ? `?${query}` : ""}`;
}

/** The second tab, "If your website does not allow scripts". */
export function iframeSnippet(options: WidgetOptions): string {
  return `<iframe src="${frameAddress(options).replace(/&/g, "&amp;")}"\n  title="Bible verse of the day from Bible Guide" width="100%" height="${frameHeight(options)}"\n`
    + `  style="border:0;max-width:640px" loading="lazy" referrerpolicy="no-referrer"\n`
    + `  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe>`;
}

/** The third tab, "Just a link": the two links as HTML, and the address alone for builders that only take a link. */
export const LINK_SNIPPET_HTML = FALLBACK_LINKS.replace("\n  ", " ");
export const LINK_SNIPPET_TEXT = `Today's Bible verse: ${WIDGET_HOME}/verse-of-the-day`;

/** The data- attributes the page sets on a preview div, so the preview draws exactly what the snippet would. */
export function previewAttributes(options: WidgetOptions): Record<string, string> {
  return Object.fromEntries(changed(options, false).map(([name, value]) => [`data-${name}`, value]));
}
