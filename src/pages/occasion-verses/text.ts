// The picker's words that are not components: the list as text, the certificate's date, and copying (design 7, 8).
import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/site-format";

export interface ListEntry { key: string; reference: string; part: string; text: string | undefined }

export const BEREAN_CREDIT = "Scripture quotations are from the Berean Standard Bible (public domain).";

/** Part, reference and words for each passage, then the Berean credit, as the funeral page copies its list. */
export function listAsText(entries: readonly ListEntry[]): string {
  return [...entries.map((entry) => [entry.part, entry.reference, entry.text ?? ""].filter(Boolean).join("\n")), BEREAN_CREDIT].join("\n\n");
}

/** "2026-06-13" in the page's language, read as a calendar date with no time zone to shift it; "" when empty or invalid. */
export function certificateDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? "" : formatDate(date, { day: "numeric", month: "long", year: "numeric" });
}

/** Copying: the clipboard where the browser allows it, otherwise `manual` holds the text to show for copying by hand. */
export function useCopy() {
  const [done, setDone] = useState("");
  const [manual, setManual] = useState("");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = (text: string, success: string) => {
    const writing = navigator.clipboard?.writeText?.(text);
    if (!writing) { setManual(text); return; }
    writing.then(() => {
      setManual("");
      setDone(success);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setDone(""), 2400);
    }).catch((error: unknown) => {
      console.warn("occasion-verses: copying to the clipboard failed; showing the text to copy by hand", error);
      setManual(text);
    });
  };
  return { copy, done, manual };
}

