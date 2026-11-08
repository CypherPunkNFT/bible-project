// /study/how-the-old-testament-books-were-written: what each Old Testament book says of how it was made, read in three
// layers kept apart: the book's own witness, its later readers, the modern reconstructions. One ruler of chapters per book
// argued in full carries the pattern; the verses are scripts/build-ot-books-study.py's, the words the research record's.
// The view lives in the address (book, mark, open, row, order); one sheet opens from the right at a time, a check note or
// a record, and Escape closes it.
import { useCallback, useEffect, useMemo, useRef, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CheckNotesProvider } from "@/pages/study/check-notes/CheckNotes";
import { useCheckNotes } from "@/pages/study/check-notes/context";
import { BookTable } from "./BookTable";
import { Claims } from "./Claims";
import { Closing } from "./Closing";
import { OpenSheet } from "./context";
import { Daniel } from "./Daniel";
import { Darius } from "./Darius";
import { Documentary } from "./Documentary";
import { Isaiah } from "./Isaiah";
import { Landing } from "./Landing";
import { findOpened, findOrder, findRow, findRuler, R, RULERS, type Mark } from "./model";
import { ObSection } from "./parts";
import { Pentateuch } from "./Pentateuch";
import { RecordSheet } from "./Sheet";
import "./ot-books.css";

type SetMany = (values: Record<string, string | null>) => void;

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`How the Old Testament books were written: could not read the address's section "${hash}"`, error);
  }
}

/** Focus follows the sheet: to its close button when it opens, back to what opened it when it closes. */
function useSheetFocus(isOpen: boolean) {
  const opener = useRef<string | null>(null), focusClose = useRef(false), focusOpener = useRef(false);
  useEffect(() => {
    if (isOpen && focusClose.current) document.querySelector<HTMLElement>(".ob-root .ms-sheet.open .ms-sheet-close")?.focus();
    focusClose.current = false;
    if (!isOpen && focusOpener.current && opener.current) document.querySelector<HTMLElement>(`.ob-root [data-opener="${CSS.escape(opener.current)}"]`)?.focus({ preventScroll: true });
    focusOpener.current = false;
  }, [isOpen]);
  return {
    noteOpen: () => { opener.current = (document.activeElement as HTMLElement | null)?.dataset?.opener ?? null; focusClose.current = true; },
    noteClose: () => { focusOpener.current = true; },
  };
}

function Body({ setMany }: { setMany: SetMany }) {
  const [params] = useSearchParams();
  const notes = useCheckNotes();
  const openValue = params.get("open"), opened = findOpened(openValue);
  const litBook = findRuler(params.get("book")).id, litMark = params.get("mark");
  const focus = useSheetFocus(Boolean(opened));
  const open = useCallback((id: string) => { focus.noteOpen(); notes?.closeNote(); setMany({ open: id }); }, [focus, notes, setMany]);
  const close = useCallback(() => { focus.noteClose(); setMany({ open: null }); }, [focus, setMany]);
  const choose = useCallback((rulerId: string) => (mark: Mark) => { focus.noteOpen(); notes?.closeNote(); setMany({ book: rulerId, mark: mark.id, open: mark.open }); }, [focus, notes, setMany]);
  const lit = (rulerId: string) => (litBook === rulerId ? litMark : null);
  // Safari and Firefox on a Mac do not focus a pressed button, so note it before the press's handler reads the focus.
  const notePress = useCallback((e: MouseEvent<HTMLDivElement>) => {
    (e.target as Element).closest<HTMLElement>("[data-opener]")?.focus({ preventScroll: true });
  }, []);
  const resetKey = params.toString();
  return <OpenSheet.Provider value={open}>
    <div className="ob-wrap" onClickCapture={notePress}>
      <ObSection id="landing"><Landing /></ObSection>
      <ObSection id="five" resetKey={resetKey}><Pentateuch ruler={RULERS.get("five")!} lit={lit("five")} onChoose={choose("five")} /></ObSection>
      <ObSection id="sources"><Documentary /></ObSection>
      <ObSection id="isaiah" resetKey={resetKey}><Isaiah ruler={RULERS.get("isaiah")!} lit={lit("isaiah")} onChoose={choose("isaiah")} /></ObSection>
      <ObSection id="daniel" resetKey={resetKey}><Daniel ruler={RULERS.get("daniel")!} lit={lit("daniel")} onChoose={choose("daniel")} /></ObSection>
      <ObSection id="darius"><Darius /></ObSection>
      <ObSection id="every-book" resetKey={resetKey}><BookTable order={findOrder(params.get("order"))} row={findRow(params.get("row"))} onChange={setMany} /></ObSection>
      <ObSection id="claims"><Claims /></ObSection>
      <ObSection id="stops"><Closing /></ObSection>
    </div>
    <ObSection id="sheet" resetKey={resetKey}><RecordSheet opened={opened} onClose={close} /></ObSection>
  </OpenSheet.Provider>;
}

export default function OtBooksPage() {
  const [, setParams] = useSearchParams();
  const { hash } = useLocation();
  useEffect(() => {
    document.title = `${R.title} · Bible Guide`;
    return () => { document.title = "Bible Guide"; };
  }, []);
  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // React Router does not queue a second call made in the same handler, so every change is one call that may set several values.
  const setMany = useCallback<SetMany>((values) => {
    setParams((p) => {
      const q = new URLSearchParams(p);
      for (const [name, value] of Object.entries(values)) { if (value) q.set(name, value); else q.delete(name); }
      return q;
    }, { replace: true, preventScrollReset: true });
  }, [setParams]);
  const closeOwnSheet = useCallback(() => setMany({ open: null }), [setMany]);
  const notes = useMemo(() => R.checkNotes, []);
  return <div className="ob-root">
    <CheckNotesProvider notes={notes} onOpen={closeOwnSheet}><Body setMany={setMany} /></CheckNotesProvider>
  </div>;
}
