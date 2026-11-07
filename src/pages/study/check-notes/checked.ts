// Check notes: where the drafting writer left an editor's check mark, the research record now holds the settled words
// wrapped as {{check:c12}}…{{/check}}, and a top-level `checkNotes` list says what each mark asked and what was found.
// This file only reads that text. It never throws: a malformed or unknown marker reads as plain words.

export type CheckStatus = "confirmed" | "corrected" | "link" | "open";

export interface CheckNote {
  id: string;
  path: string;
  was: string;
  status: CheckStatus;
  before: string;
  after: string;
  note: string;
  marker: boolean;
  fieldEdits?: { path: string; from: unknown; to: unknown }[];
}

export type Segment = { kind: "plain"; text: string } | { kind: "check"; id: string; text: string };

const MARKER = /\{\{check:(c\d+)\}\}([\s\S]*?)\{\{\/check\}\}/g;

/** The text split into plain runs and checked runs, in order. One pass, no nesting. */
export function parseChecked(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(MARKER)) {
    const at = match.index ?? 0;
    if (at > last) segments.push({ kind: "plain", text: text.slice(last, at) });
    segments.push({ kind: "check", id: match[1], text: match[2] });
    last = at + match[0].length;
  }
  if (last < text.length) segments.push({ kind: "plain", text: text.slice(last) });
  return segments;
}

/** The text with every marker removed, for alt text, titles, labels, search, sorting and comparisons. */
export const plainText = (text: string): string => text.replace(MARKER, (_whole, _id: string, words: string) => words);

export const hasChecks = (text: string): boolean => text.includes("{{check:");

/** Notes by id; a repeated id keeps the first, anything malformed is left out. */
export function notesById(notes: unknown): Map<string, CheckNote> {
  const map = new Map<string, CheckNote>();
  if (!Array.isArray(notes)) return map;
  for (const item of notes) {
    if (item && typeof item === "object" && typeof (item as CheckNote).id === "string" && !map.has((item as CheckNote).id)) {
      map.set((item as CheckNote).id, item as CheckNote);
    }
  }
  return map;
}

export const STATUS_LABEL: Record<CheckStatus, string> = {
  confirmed: "Checked: right as written",
  corrected: "Checked: corrected",
  link: "Checked: link settled",
  open: "Still open",
};

/** The mark's own request, without its brackets: "[check: Jericho's height]" → "Jericho's height". */
export const markRequest = (was: string): string => was.replace(/^\[check\b:?\s*/, "").replace(/\]$/, "").trim() || "Check this.";

/** Highlights show unless the build sets VITE_CHECK_NOTES=off (the owner decides at release). */
export const SHOW_CHECK_NOTES = (import.meta.env?.VITE_CHECK_NOTES ?? "on") !== "off";
