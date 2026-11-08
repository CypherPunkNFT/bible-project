// /study/new-testament-history: Roman and Herodian rule from Pompey (63 BC) to Masada, read by one question: when the New
// Testament names a ruler, what does that name fix, and how sure is the ruler's own date? A lattice of reigns crossed by the
// New Testament's anchors, then the Herods, the records from Pompey to Agrippa, the outside witnesses, the years of Jesus, the
// trial, Paul's fixed points, the revolt, four claims and where the study stops. The verses, anchors and counts are
// scripts/build-nt-history-study.py's; the words are the research record's. The view lives in the address; one sheet at a time.
import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CheckNotesProvider } from "@/pages/study/check-notes/CheckNotes";
import { useCheckNotes } from "@/pages/study/check-notes/context";
import { Claims, Closing } from "./Closing";
import { Landing } from "./Landing";
import { Lattice } from "./Lattice";
import { D, findBirthView, findCrossView, findOpened, findRuler } from "./model";
import { OpenContext } from "./open";
import { NhSection } from "./parts";
import { Herods, Revolt, Rome } from "./Records";
import { NhSheet } from "./Sheet";
import { Paul, Trial, Witnesses } from "./Witnesses";
import { Years } from "./Years";
import "./nt-history.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`The New Testament history page: could not read the address's section "${hash}"`, error);
  }
}

function Study() {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const notes = useCheckNotes();
  const opener = useRef<string | null>(null);
  const focusClose = useRef(false);
  const focusOpener = useRef(false);
  const openValue = params.get("open");
  const opened = findOpened(openValue);

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (opened && focusClose.current) document.querySelector<HTMLElement>(".nh-root .ms-sheet.open:not(.chk-panel) .ms-sheet-close")?.focus();
    focusClose.current = false;
    if (!opened && focusOpener.current && opener.current) {
      document.querySelector<HTMLElement>(`.nh-root [data-opener="${CSS.escape(opener.current)}"]`)?.focus();
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

  return <OpenContext.Provider value={open}><div className="nh-page" onClickCapture={notePress}><div className="nh-wrap">
    <NhSection id="landing"><Landing /></NhSection>
    <NhSection id="lattice" resetKey={resetKey}><Lattice anchorId={params.get("anchor")} ruler={findRuler(params.get("ruler"))} onChange={setMany} /></NhSection>
    <NhSection id="herods"><Herods /></NhSection>
    <NhSection id="rome" resetKey={resetKey}><Rome openKey={openKey} /></NhSection>
    <NhSection id="witnesses"><Witnesses /></NhSection>
    <NhSection id="years" resetKey={resetKey}><Years birth={findBirthView(params.get("birth"))} cross={findCrossView(params.get("cross"))} onChange={setMany} /></NhSection>
    <NhSection id="trial"><Trial /></NhSection>
    <NhSection id="paul"><Paul /></NhSection>
    <NhSection id="revolt" resetKey={resetKey}><Revolt openKey={openKey} /></NhSection>
    <NhSection id="claims"><Claims /></NhSection>
    <NhSection id="stops"><Closing /></NhSection>
  </div><NhSection id="sheet" resetKey={resetKey}><NhSheet item={opened} onClose={close} /></NhSection></div></OpenContext.Provider>;
}

export default function NtHistoryPage() {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    document.title = "New Testament history · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  // A check note opening closes the page's own sheet: one sheet at a time.
  const closeOwnSheet = useCallback(() => {
    if (!params.get("open")) return;
    setParams((p) => { const q = new URLSearchParams(p); q.delete("open"); return q; }, { replace: true, preventScrollReset: true });
  }, [params, setParams]);
  return <div className="nh-root"><CheckNotesProvider notes={D.checkNotes} onOpen={closeOwnSheet}><Study /></CheckNotesProvider></div>;
}
