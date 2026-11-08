// Printing one sheet from a page with the browser's own print dialog (design 6.5). Knows nothing about life events, so the
// sympathy cards and home blessings can import it: give it a sheet and a paper size.
//   <PrintPortal>  (PrintPortal.tsx) draws the sheet into a container on <body>, outside the app, hidden on screen until printing;
//   usePrintSheet  adds the @page rule and the `print-sheet-active` marker when Print is pressed, keeps them until the page
//                  closes (some phone browsers fire `afterprint` before they lay the page out), then removes both;
//   useFontsReady  asks for each font face the sheet uses, so the printout never falls back to another typeface.
// The print rules themselves live in print-sheet.css, all under html.print-sheet-active.
import { useCallback, useEffect, useRef, useState } from "react";
import "./print-sheet.css";

export type Paper = "letter" | "a4";

export const PAPER_SIZE: Record<Paper, { width: string; height: string }> = {
  letter: { width: "8.5in", height: "11in" },
  a4: { width: "210mm", height: "297mm" },
};

export const PRINT_MARKER = "print-sheet-active";
const PAGE_STYLE_ID = "print-sheet-page";

/** US, Canada, Mexico, the Philippines and a few others print on Letter; everyone else on A4 (design 6.1). */
const LETTER_REGIONS = new Set(["US", "CA", "MX", "PH", "CL", "CO", "VE", "GT", "CR", "PA", "DO", "PR", "SV", "NI", "BZ"]);
export function defaultPaper(languages: readonly string[] = typeof navigator === "undefined" ? [] : navigator.languages ?? [navigator.language]): Paper {
  const region = /[-_]([A-Za-z]{2})\b/.exec(languages[0] ?? "")?.[1]?.toUpperCase();
  return region && LETTER_REGIONS.has(region) ? "letter" : "a4";
}

/** In-app browsers (Facebook, Instagram, …) usually have no working print dialog. */
export function canPrint(win: Window = window): boolean {
  if (typeof win.print !== "function") return false;
  return !/FBAN|FBAV|FB_IAB|Instagram|Line\/|Snapchat|Twitter|LinkedInApp|Pinterest/i.test(win.navigator.userAgent);
}

/** The @page rule: the paper size, with no page margin for a single sheet or a real one for a sheet that runs on. */
export const pageRule = (paper: Paper, margin: string): string => `@page { size: ${PAPER_SIZE[paper].width} ${PAPER_SIZE[paper].height}; margin: ${margin}; }`;

/**
 * Print with the given paper and page margin. `print()` arms the page: it writes the @page rule, adds the marker and opens
 * the dialog. Once armed, a change of paper or margin rewrites the rule in place. Leaving the page removes both.
 */
export function usePrintSheet(paper: Paper, margin: string): { print: () => void; armed: boolean } {
  const [armed, setArmed] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const write = useCallback(() => {
    let style = styleRef.current;
    if (!style) {
      style = document.createElement("style");
      style.id = PAGE_STYLE_ID;
      document.head.appendChild(style);
      styleRef.current = style;
    }
    style.textContent = pageRule(paper, margin);
  }, [paper, margin]);
  useEffect(() => { if (armed) write(); }, [armed, write]);
  useEffect(() => () => {
    styleRef.current?.remove();
    styleRef.current = null;
    document.documentElement.classList.remove(PRINT_MARKER);
  }, []);
  const print = useCallback(() => {
    write();
    document.documentElement.classList.add(PRINT_MARKER);
    setArmed(true);
    window.print();
  }, [write]);
  return { print, armed };
}

/** Each face as the CSS `font` shorthand document.fonts.load takes, e.g. `400 1em "Literata Variable"`. */
export function useFontsReady(faces: readonly string[]): boolean {
  const key = faces.join("|");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let current = true;
    setReady(false);
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts) { setReady(true); return; }
    Promise.all(key.split("|").filter(Boolean).map((face) => fonts.load(face)))
      .then(() => fonts.ready)
      .catch((error: unknown) => console.warn(`print-sheet: a font face did not load (${key}); printing with what loaded`, error))
      .finally(() => { if (current) setReady(true); });
    return () => { current = false; };
  }, [key]);
  return ready;
}
