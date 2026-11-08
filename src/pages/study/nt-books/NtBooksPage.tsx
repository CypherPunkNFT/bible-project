// /study/how-the-new-testament-books-were-written: who wrote each book, who says so, how early, and what they could have
// known. A synopsis of three tellings with the shared words tied across the columns; four equal maps of the Synoptic
// question; a thread of early witnesses; the quest in its holders' terms; the letters and their pens; five claims tested;
// and every book in one line with its date as ranges. The verses, ties and ranges are scripts/build-nt-books-study.py's;
// the words are the research record's. Each section keeps its own failure, the view lives in the address, and one sheet
// (a reference's verses, a witness's record or a check note) opens from the right at a time.
import { useCallback, useEffect, useMemo, useRef, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CheckNotesProvider } from "@/pages/study/check-notes/CheckNotes";
import { useCheckNotes } from "@/pages/study/check-notes/context";
import { Books } from "./Books";
import { Claims } from "./Claims";
import { Landing } from "./Landing";
import { Letters } from "./Letters";
import { Maps } from "./Maps";
import { D, findOpened } from "./model";
import { OpenContext } from "./open-context";
import { NbSection } from "./parts";
import { Quest } from "./Quest";
import { RecordSheet } from "./Sheet";
import { Tellings } from "./Synopsis";
import { Witnesses } from "./Witnesses";
import "./nt-books.css";

type SetMany = (values: Record<string, string | null>) => void;

/** An opener's key inside an attribute selector; CSS.escape where the browser has it. */
const escapeValue = (value: string): string =>
  (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, "\\$&"));

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`How the New Testament books were written: could not read the address's section "${hash}"`, error);
  }
}

function Body({ params, setMany }: { params: URLSearchParams; setMany: SetMany }) {
  const notes = useCheckNotes();
  const opener = useRef<string | null>(null);
  const focusClose = useRef(false);
  const focusOpener = useRef(false);
  const openValue = params.get("open");
  const opened = findOpened(openValue);

  useEffect(() => {
    if (opened && focusClose.current) document.querySelector<HTMLElement>(".nb-root .ms-sheet.open:not(.chk-panel) .ms-sheet-close")?.focus();
    focusClose.current = false;
    if (!opened && focusOpener.current && opener.current) {
      // The opener is found again by its key after the render: the one that was pressed may have been redrawn.
      document.querySelector<HTMLElement>(`.nb-root [data-opener="${escapeValue(opener.current)}"]`)?.focus({ preventScroll: true });
    }
    focusOpener.current = false;
  }, [opened]);

  const openSheet = useCallback((value: string) => {
    opener.current = value;
    focusClose.current = true;
    notes?.closeNote();
    setMany({ open: value });
  }, [notes, setMany]);
  const context = useMemo(() => ({ openVerse: (key: string) => openSheet(`verse:${key}`), openWitness: (id: string) => openSheet(`witness:${id}`) }), [openSheet]);
  const close = useCallback(() => { focusOpener.current = true; setMany({ open: null }); }, [setMany]);
  const resetKey = params.toString();

  return <OpenContext.Provider value={context}>
    <div className="nb-wrap">
      <NbSection id="landing"><Landing /></NbSection>
      <NbSection id="tellings" resetKey={resetKey}><Tellings caseId={params.get("case")} layerId={params.get("layer")} onChange={setMany} /></NbSection>
      <NbSection id="maps" resetKey={resetKey}><Maps mapId={params.get("map")} onChange={setMany} /></NbSection>
      <NbSection id="witnesses" resetKey={resetKey}><Witnesses gospelId={params.get("gospel")} openValue={openValue} onChange={setMany} /></NbSection>
      <NbSection id="quest" resetKey={resetKey}><Quest stageId={params.get("stage")} onChange={setMany} /></NbSection>
      <NbSection id="letters" resetKey={resetKey}><Letters letterId={params.get("letter")} onChange={setMany} /></NbSection>
      <NbSection id="claims" resetKey={resetKey}><Claims claimId={params.get("claim")} onChange={setMany} /></NbSection>
      <NbSection id="books" resetKey={resetKey}><Books rowId={params.get("book")} onChange={setMany} /></NbSection>
    </div>
    <NbSection id="sheet" resetKey={resetKey}><RecordSheet opened={opened} onClose={close} /></NbSection>
  </OpenContext.Provider>;
}

export default function NtBooksPage() {
  useEffect(() => {
    document.title = `${D.title} · Bible Guide`;
    return () => { document.title = "Bible Guide"; };
  }, []);
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React Router does not queue a second call made in the same handler, so every change is one call that may set several values.
  const setMany = useCallback((values: Record<string, string | null>) => {
    setParams((p) => {
      const q = new URLSearchParams(p);
      for (const [name, value] of Object.entries(values)) { if (value) q.set(name, value); else q.delete(name); }
      return q;
    }, { replace: true, preventScrollReset: true });
  }, [setParams]);
  // Opening a check note closes this page's own sheet: one sheet at a time.
  const closeOwnSheet = useCallback(() => setMany({ open: null }), [setMany]);
  // Safari and Firefox on a Mac do not focus a pressed button, so note it before the press's handler reads the focus.
  const notePress = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-opener]");
    if (target) target.focus({ preventScroll: true });
  }, []);

  return <div className="nb-root" onClickCapture={notePress}>
    <CheckNotesProvider notes={D.checkNotes} onOpen={closeOwnSheet}>
      <Body params={params} setMany={setMany} />
    </CheckNotesProvider>
  </div>;
}
