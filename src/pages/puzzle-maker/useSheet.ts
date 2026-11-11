// Reading what a puzzle is made from and making it (design §2 and §10): the passage's book from the site's Berean
// files, or the crossword game's clue file, then the sheet, made one tick later so the page can say so first. Every
// request carries a number, so a slow answer for an old choice never replaces a newer one.
import { useEffect, useRef, useState } from "react";
import { loadPlain } from "@/lib/data";
import type { Catalog } from "@/lib/types";
import { parseReference } from "@/pages/citation-generator/parse";
import type { CluesFile } from "@/pages/games/crossword/game";
import { makeFromPassage, makeFromTheme, type Made, type PassageSource } from "./make";
import { MAX_VERSES, passageWords, selectVerses } from "./passage";
import { puzzleKey, type Settings } from "./settings";

export const BIBLE = "bsb";
/** The longest word a passage offers: the largest crossword's side. */
const LONGEST = 17;

export type SheetState =
  /** While a new sheet is read or made, `last` is the one before it, still shown. */
  | { status: "reading"; last: Made | null }
  | { status: "making"; last: Made | null }
  /** The book or the clue file could not be read: the page offers Try again. */
  | { status: "failed"; what: "passage" | "clues"; tries: number }
  /** The reference could not be read, or names no verses or too many. */
  | { status: "refused"; message: string }
  | { status: "done"; made: Made; key: string };

let cluesFile: Promise<CluesFile> | null = null;
/** The crossword game's clue file (the same chunk the game reads), once per visit; a failed read is tried again. */
function loadClues(): Promise<CluesFile> {
  cluesFile ??= import("@/data/crossword/clues.json").then((module) => module.default as unknown as CluesFile);
  cluesFile.catch(() => { cluesFile = null; });
  return cluesFile;
}

/** "Psalm 23:1", not "Psalms 23:1", in a clue's reference. */
const singular = (name: string) => (name === "Psalms" ? "Psalm" : name);

type Source = { ok: true; source: PassageSource } | { ok: false; message: string };

/** The passage's verses and words, or why there are none. */
async function readPassage(text: string, catalog: Catalog): Promise<Source> {
  const bsb = catalog.translations.find((translation) => translation.slug === BIBLE);
  if (!bsb) return { ok: false, message: "The Berean Standard Bible is not available here, so no passage can be read." };
  const parsed = parseReference(text, bsb, catalog.books, catalog.equivalent);
  if (!parsed.ok) return { ok: false, message: parsed.error };
  const { code, name, passages } = parsed.reference;
  const held = bsb.books[code] ? code : catalog.equivalent[code] ?? code;
  const verses = selectVerses(await loadPlain(BIBLE, held), passages);
  if (verses.length === 0) return { ok: false, message: "There are no such verses in the Berean Standard Bible. Check the chapter and verse numbers." };
  if (verses.length > MAX_VERSES) return { ok: false, message: "Choose a shorter passage, up to 250 verses, so the puzzle stays about its words. A chapter or two works well." };
  return { ok: true, source: { code: held, name: singular(name), verses, words: passageWords(verses, LONGEST) } };
}

/** The sheet for the settings (whose seed is set). `retry` changes to read a failed file again. */
export function useSheet(settings: Settings & { seed: number }, catalog: Catalog, retry: number): SheetState {
  const [state, setState] = useState<SheetState>({ status: "reading", last: null });
  const request = useRef(0);
  const tries = useRef(0);
  const key = puzzleKey(settings);

  useEffect(() => {
    const mine = ++request.current;
    const current = () => mine === request.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const previous = (old: SheetState): Made | null => (old.status === "done" ? old.made : old.status === "reading" || old.status === "making" ? old.last : null);
    setState((old) => ({ status: "reading", last: previous(old) }));
    const make = (build: () => Made) => {
      setState((old) => ({ status: "making", last: previous(old) }));
      // One tick later, so "Making your puzzle…" shows before the work starts.
      timer = setTimeout(() => { if (current()) setState({ status: "done", made: build(), key }); }, 0);
    };
    const fail = (what: "passage" | "clues", error: unknown) => {
      console.error(`puzzle maker: the ${what === "passage" ? `${BIBLE} book for "${settings.ref}"` : "crossword clue file"} could not be read`, error);
      if (current()) setState({ status: "failed", what, tries: ++tries.current });
    };
    if (settings.from === "passage") {
      readPassage(settings.ref, catalog).then((read) => {
        if (!current()) return;
        if (!read.ok) setState({ status: "refused", message: read.message });
        else make(() => makeFromPassage(read.source, settings, settings.seed));
      }, (error: unknown) => fail("passage", error));
    } else {
      loadClues().then((data) => { if (current()) make(() => makeFromTheme(data, settings, settings.seed)); }, (error: unknown) => fail("clues", error));
    }
    return () => { if (timer) clearTimeout(timer); };
    // The key holds every setting that changes the puzzle; the title does not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, catalog, retry]);

  return state;
}
