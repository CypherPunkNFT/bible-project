// The finished testimony from a draft (design §5 and §9): one model, sheetSections, drawn three ways: as plain text to
// copy or download, as HTML for the clipboard and the downloaded web page, and on screen and in print by Sheet.tsx. The
// fixed words (the default title, the footer) pass through `say`, the page's translator, so a translated site's files
// match its screen; the tests pass none and get English. Nothing a person wrote is ever interpreted: HTML output
// escapes every text run and puts no user text in an attribute or the title.
import { localDate } from "@/pages/scripture-memory/storage";
import { STORY_QUESTIONS, isAnswered } from "./questions";
import type { Answers } from "./storage";

/** A fixed English sentence in the site's language; identity for English. */
export type Say = (english: string) => string;
export const english: Say = (text) => text;

export const DEFAULT_TITLE = "My testimony";
export const FOOTER = "Written with Bible Guide, bibleguide.io, on {date}.";

export interface SheetSection {
  id: string;
  heading: string;
  /** Paragraphs, each a list of lines (single newlines kept as line breaks). */
  paragraphs: readonly (readonly string[])[];
}

export interface Sheet {
  title: string;
  /** Name and when, joined by a middle dot; "" when neither is given. */
  byline: string;
  sections: readonly SheetSection[];
  footer: string;
}

/** A text's paragraphs: split on blank lines, each line trimmed, empty lines dropped. */
export function paragraphsOf(text: string): string[][] {
  return text.split(/\n\s*\n/).map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean)).filter((lines) => lines.length > 0);
}

/** Whether there is a testimony to show: at least one of the story questions answered. */
export const hasStory = (answers: Answers): boolean => STORY_QUESTIONS.some((question) => isAnswered(answers[question.id]));

export function sheetSections(answers: Answers, say: Say = english, when: string = ""): Sheet {
  const title = answers.title?.trim() || say(DEFAULT_TITLE);
  const byline = [answers.name?.trim(), answers.when?.trim()].filter(Boolean).join(" · ");
  const sections = STORY_QUESTIONS.filter((question) => isAnswered(answers[question.id])).map((question) => ({
    id: question.id,
    heading: say(question.heading ?? ""),
    paragraphs: paragraphsOf(answers[question.id] ?? ""),
  }));
  return { title, byline, sections, footer: when ? say(FOOTER).replace("{date}", when) : "" };
}

/** The sheet as plain text, LF line endings, headings in capitals. */
export function sheetText(sheet: Sheet): string {
  const lines: string[] = [sheet.title];
  if (sheet.byline) lines.push(sheet.byline);
  for (const section of sheet.sections) {
    lines.push("", section.heading.toUpperCase(), "");
    section.paragraphs.forEach((paragraph, i) => {
      if (i > 0) lines.push("");
      lines.push(...paragraph);
    });
  }
  if (sheet.footer) lines.push("", sheet.footer);
  return lines.join("\n") + "\n";
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

const paragraphHtml = (lines: readonly string[]): string => `<p dir="auto">${lines.map(escapeHtml).join("<br>")}</p>`;

/** The sheet as an HTML article: the clipboard's rich copy, and the body of the downloaded page. */
export function sheetHtml(sheet: Sheet): string {
  const parts = [`<article class="testimony">`, `<h1 dir="auto">${escapeHtml(sheet.title)}</h1>`];
  if (sheet.byline) parts.push(`<p class="by" dir="auto">${escapeHtml(sheet.byline)}</p>`);
  for (const section of sheet.sections) {
    parts.push(`<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map(paragraphHtml).join("")}</section>`);
  }
  if (sheet.footer) parts.push(`<footer><p>${escapeHtml(sheet.footer)}</p></footer>`);
  parts.push("</article>");
  return parts.join("\n");
}

const PAGE_STYLE = [
  "body{margin:0;padding:2rem 1.25rem;background:#fff;color:#1b1917;font:17px/1.65 Georgia,'Times New Roman',serif}",
  ".testimony{max-width:42em;margin:0 auto;overflow-wrap:anywhere}",
  "h1{font-size:2rem;line-height:1.15;font-weight:500;margin:0 0 .4rem}",
  ".by{margin:0 0 2.2rem;color:#5c5650;font-size:.95rem}",
  "section{margin-top:1.9rem;break-inside:avoid-page}",
  "h2{font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;font-family:system-ui,sans-serif;color:#5c5650;margin:0 0 .5rem}",
  "p{margin:0 0 .85rem}",
  "footer{margin-top:3rem;padding-top:.8rem;border-top:1px solid #d9d4cc;color:#5c5650;font-size:.82rem}",
  "@page{margin:18mm}",
].join("");

/** A self-contained web page for the downloaded file: no script, no outside file, a policy that allows neither, and the
 * site's own words for the tab title (never the person's). */
export function sheetPage(sheet: Sheet, lang: string, tabTitle: string): string {
  const language = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(lang) ? lang : "en";
  return [
    "<!doctype html>",
    `<html lang="${language}">`,
    "<head>",
    `<meta charset="utf-8">`,
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${escapeHtml(tabTitle)}</title>`,
    `<style>${PAGE_STYLE}</style>`,
    "</head>",
    "<body>",
    sheetHtml(sheet),
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

export const textFileName = (date: Date): string => `my-testimony-${localDate(date)}.txt`;
export const pageFileName = (date: Date): string => `my-testimony-${localDate(date)}.html`;
