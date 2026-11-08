// /study/the-medieval-church: AD 451 to about 1350, read by one question: who wrote this down, and how far did it reach? A line of years with decrees on
// one side and what is found near them on the other, then a map of baptisms, a balance of popes and kings, the two strands of East and West, a
// table of who wrote down each crusade and trial, one article and the road to teaching it, and a walk through a parish. Settled passages of the
// record open their editor's notes (the shared check-notes piece); one sheet is open at a time. The verses and coast are scripts/build-medieval-study.py's; the claims and sources are the research record's. Each
// section keeps its own failure, the view lives in the address, and a chosen pair's record opens from the right.
import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CheckNotesProvider } from "@/pages/study/check-notes/CheckNotes";
import { useCheckNotes } from "@/pages/study/check-notes/context";
import { Claims } from "./Claims";
import { Closing } from "./Closing";
import { Crusade } from "./Crusade";
import { Landing } from "./Landing";
import { Mirror } from "./Mirror";
import { Mission } from "./Mission";
import { D, findField, findOpened, findPair, parseYear } from "./model";
import { Parish } from "./Parish";
import { MvSection } from "./parts";
import { Powers } from "./Powers";
import { School } from "./School";
import { PairSheet } from "./Sheet";
import { Split } from "./Split";
import "./medieval.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`The medieval church page: could not read the address's section "${hash}"`, error);
  }
}

/** Keyboard focus follows an editor's note: to its close button when it opens, back to where the reader was when it closes. */
function useNoteFocus() {
  const notes = useCheckNotes(), openId = notes?.openId ?? null, before = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (openId) {
      if (!before.current) before.current = document.activeElement as HTMLElement | null;
      document.querySelector<HTMLElement>(".chk-panel.open .ms-sheet-close")?.focus();
      return;
    }
    const back = before.current;
    before.current = null;
    if (back && back.isConnected && back.offsetParent !== null) back.focus({ preventScroll: true });
  }, [openId]);
  return notes;
}

function Study() {
  const notes = useNoteFocus();
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const opener = useRef<string | null>(null);
  const focusClose = useRef(false);
  const focusOpener = useRef(false);
  const openValue = params.get("open");
  const opened = findOpened(openValue);
  const field = findField(params.get("field"));
  // An open record wins over the address's chosen pair and field, so that the marks lit on the page always belong to the record beside them.
  const chosen = findPair(opened?.id ?? params.get("pair"), opened ? null : field);

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (opened && focusClose.current) document.querySelector<HTMLElement>(".mv-root .ms-sheet.open:not(.chk-panel) .ms-sheet-close")?.focus();
    focusClose.current = false;
    if (!opened && focusOpener.current) {
      // The opener is found again by its key after the render: the one that was pressed may have been redrawn.
      const back = opener.current ? document.querySelector<HTMLElement>(`.mv-root [data-opener="${CSS.escape(opener.current)}"]`) : null;
      (back ?? document.querySelector<HTMLElement>(".mv-root #mirror h2"))?.focus();
    }
    focusOpener.current = false;
  }, [opened]);

  // React Router does not queue a second call made in the same handler, so every change is one call that may set several address values.
  const setMany = useCallback((values: Record<string, string | null>) => {
    setParams((p) => {
      const q = new URLSearchParams(p);
      for (const [name, value] of Object.entries(values)) { if (value) q.set(name, value); else q.delete(name); }
      return q;
    }, { replace: true, preventScrollReset: true });
  }, [setParams]);
  const closeNote = notes?.closeNote;
  const open = useCallback((id: string) => {
    closeNote?.();
    opener.current = (document.activeElement as HTMLElement | null)?.dataset?.opener ?? null;
    focusClose.current = true;
    setMany({ pair: id, open: `pair:${id}` });
  }, [setMany, closeNote]);
  const close = useCallback(() => {
    focusOpener.current = true;
    setMany({ open: null });
  }, [setMany]);
  // Safari and Firefox on a Mac do not focus a pressed button, so note it before the press's handler reads the focus.
  const notePress = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-opener]");
    if (target) target.focus({ preventScroll: true });
  }, []);
  const resetKey = params.toString();

  return <div className="mv-page" onClickCapture={notePress}><div className="mv-wrap">
    <MvSection id="landing"><Landing /></MvSection>
    <MvSection id="mirror" resetKey={resetKey}><Mirror chosen={chosen} field={field} openValue={openValue} onChange={setMany} onOpen={open} /></MvSection>
    <MvSection id="mission" resetKey={resetKey}><Mission stationId={params.get("station")} addressYear={parseYear(params.get("year"))} onChange={setMany} /></MvSection>
    <MvSection id="powers" resetKey={resetKey}><Powers roundId={params.get("round")} onChange={setMany} /></MvSection>
    <MvSection id="split" resetKey={resetKey}><Split stepId={params.get("step")} onChange={setMany} /></MvSection>
    <MvSection id="crusade" resetKey={resetKey}><Crusade eventId={params.get("event")} onChange={setMany} /></MvSection>
    <MvSection id="school" resetKey={resetKey}><School partId={params.get("part")} onChange={setMany} /></MvSection>
    <MvSection id="parish" resetKey={resetKey}><Parish spotId={params.get("at")} onChange={setMany} /></MvSection>
    <MvSection id="claims"><Claims /></MvSection>
    <MvSection id="stops"><Closing /></MvSection>
  </div><MvSection id="sheet" resetKey={resetKey}><PairSheet pair={opened} onClose={close} /></MvSection></div>;
}

export default function MedievalPage() {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    document.title = "The medieval church · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  // A check note opening closes the page's own record sheet: one sheet at a time. Focus goes to the note, not back to the pair's opener.
  const closeOwnSheet = useCallback(() => {
    if (!params.get("open")) return;
    setParams((p) => { const q = new URLSearchParams(p); q.delete("open"); return q; }, { replace: true, preventScrollReset: true });
  }, [params, setParams]);
  return <div className="mv-root"><CheckNotesProvider notes={D.checkNotes} onOpen={closeOwnSheet}><Study /></CheckNotesProvider></div>;
}
