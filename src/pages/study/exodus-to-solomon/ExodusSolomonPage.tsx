// /study/israel-from-the-exodus-to-solomon: Israel's history from the stay in Egypt to Solomon, read by one question: is a date
// a number the text gives, a range the ground gives, or someone's way of joining the two? Scripture's spans hung as cords
// from Solomon's fourth year over the ground's ranges, with two outside records as nails; then six stations, Ai, the gates,
// the invention view, four claims and where the study stops. The verses, cords and bars are
// scripts/build-exodus-to-solomon-study.py's; the words are the research record's. The view lives in the address
// (span480, span430, station, open); one sheet at a time.
import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CheckNotesProvider } from "@/pages/study/check-notes/CheckNotes";
import { useCheckNotes } from "@/pages/study/check-notes/context";
import { Closing } from "./Closing";
import { Claims, Invented } from "./Discern";
import { Landing } from "./Landing";
import { D, findExodus, findOpened, findStation, findStay } from "./model";
import { OpenContext } from "./open";
import { XsSection } from "./parts";
import { XsSheet } from "./Sheet";
import { Ai, Gates } from "./Sites";
import { Stations } from "./Stations";
import { Track } from "./Track";
import "./exodus-to-solomon.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`The exodus-to-Solomon page: could not read the address's section "${hash}"`, error);
  }
}

function Study() {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const notes = useCheckNotes();
  const opener = useRef<string | null>(null);
  const focusClose = useRef(false);
  const focusOpener = useRef(false);
  const opened = findOpened(params.get("open"));

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (opened && focusClose.current) document.querySelector<HTMLElement>(".xs-root .ms-sheet.open:not(.chk-panel) .ms-sheet-close")?.focus();
    focusClose.current = false;
    if (!opened && focusOpener.current && opener.current) {
      document.querySelector<HTMLElement>(`.xs-root [data-opener="${CSS.escape(opener.current)}"]`)?.focus();
    }
    focusOpener.current = false;
  }, [opened]);

  // React Router does not queue a second call made in the same handler, so every change is one call that may set several values.
  const setMany = useCallback((values: Record<string, string | null>) => {
    setParams((p) => {
      const q = new URLSearchParams(p);
      for (const [name, value] of Object.entries(values)) { if (value) q.set(name, value); else q.delete(name); }
      return q;
    }, { replace: true, preventScrollReset: true });
  }, [setParams]);
  const closeNote = notes?.closeNote;
  const open = useCallback((key: string) => {
    closeNote?.();
    opener.current = (document.activeElement as HTMLElement | null)?.dataset?.opener ?? key;
    focusClose.current = true;
    setMany({ open: key });
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
  const openKey = opened?.key ?? null;

  return <OpenContext.Provider value={open}><div className="xs-page" onClickCapture={notePress}><div className="xs-wrap">
    <XsSection id="landing"><Landing /></XsSection>
    <XsSection id="cords" resetKey={resetKey}><Track exodus={findExodus(params.get("span480"))} stay={findStay(params.get("span430"))} onChange={setMany} /></XsSection>
    <XsSection id="stations" resetKey={resetKey}><Stations station={findStation(params.get("station"))} openKey={openKey} onChange={setMany} /></XsSection>
    <XsSection id="ai"><Ai /></XsSection>
    <XsSection id="gates"><Gates /></XsSection>
    <XsSection id="invented"><Invented /></XsSection>
    <XsSection id="claims"><Claims /></XsSection>
    <XsSection id="stops"><Closing /></XsSection>
  </div><XsSection id="sheet" resetKey={resetKey}><XsSheet item={opened} onClose={close} /></XsSection></div></OpenContext.Provider>;
}

export default function ExodusSolomonPage() {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    document.title = "Israel from the exodus to Solomon · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  // A check note opening closes the page's own sheet: one sheet at a time.
  const closeOwnSheet = useCallback(() => {
    if (!params.get("open")) return;
    setParams((p) => { const q = new URLSearchParams(p); q.delete("open"); return q; }, { replace: true, preventScrollReset: true });
  }, [params, setParams]);
  return <div className="xs-root"><CheckNotesProvider notes={D.checkNotes} onOpen={closeOwnSheet}><Study /></CheckNotesProvider></div>;
}
