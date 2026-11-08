// /study/the-early-church: the church from Nero's punishment of Christians in 64 to the council of Chalcedon in 451, read through
// the kinds of writing that witness it. A document case of eight drawers under the record's four periods, then the four councils
// at another scale with who received them, how a creed came, four claims and where the study stops. The verses, date spans and
// checks are scripts/build-early-church-study.py's; the words are the research record's. The view lives in the address
// (drawer, council, open); one sheet at a time.
import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CheckNotesProvider } from "@/pages/study/check-notes/CheckNotes";
import { useCheckNotes } from "@/pages/study/check-notes/context";
import { Case } from "./Case";
import { Claims, Closing } from "./Closing";
import { Councils } from "./Councils";
import { Creed } from "./Creed";
import { Landing } from "./Landing";
import { D, findCouncil, findDrawer, findOpened } from "./model";
import { OpenContext } from "./open";
import { EkSection } from "./parts";
import { EkSheet } from "./Sheet";
import "./early-church.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`The early church page: could not read the address's section "${hash}"`, error);
  }
}

/** Where focus goes when a sheet closes: its opener if it is still on the page, else the chosen drawer's button. */
function returnFocus(opener: string | null) {
  const root = document.querySelector(".ek-root");
  const target = (opener ? root?.querySelector<HTMLElement>(`[data-opener="${CSS.escape(opener)}"]`) : null)
    ?? root?.querySelector<HTMLElement>(".ek-drawer-btn[aria-pressed='true']");
  target?.focus({ preventScroll: true });
}

function Study() {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const notes = useCheckNotes();
  const opener = useRef<string | null>(null);
  const focusClose = useRef(false);
  const focusOpener = useRef(false);
  const opened = findOpened(params.get("open"));
  const drawer = findDrawer(params.get("drawer"));
  const council = findCouncil(params.get("council"));

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (opened && focusClose.current) document.querySelector<HTMLElement>(".ek-root .ms-sheet.open:not(.chk-panel) .ms-sheet-close")?.focus();
    focusClose.current = false;
    if (!opened && focusOpener.current) returnFocus(opener.current);
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
  const chooseDrawer = useCallback((id: string) => setMany({ drawer: id }), [setMany]);
  const chooseCouncil = useCallback((id: string) => setMany({ council: id }), [setMany]);
  // Safari and Firefox on a Mac do not focus a pressed button, so note it before the press's handler reads the focus.
  const notePress = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-opener]");
    if (target) target.focus({ preventScroll: true });
  }, []);
  const resetKey = params.toString();

  return <OpenContext.Provider value={open}><div className="ek-page" onClickCapture={notePress}><div className="ek-wrap">
    <EkSection id="landing"><Landing /></EkSection>
    <EkSection id="case" resetKey={resetKey}><Case chosen={drawer} onChoose={chooseDrawer} /></EkSection>
    <EkSection id="councils" resetKey={resetKey}><Councils chosen={council} onChoose={chooseCouncil} /></EkSection>
    <EkSection id="creed"><Creed /></EkSection>
    <EkSection id="claims"><Claims /></EkSection>
    <EkSection id="stops"><Closing /></EkSection>
  </div><EkSection id="sheet" resetKey={resetKey}><EkSheet item={opened} onClose={close} /></EkSection></div></OpenContext.Provider>;
}

export default function EarlyChurchPage() {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    document.title = "The early church · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  // A check note opening closes the page's own sheet: one sheet at a time.
  const closeOwnSheet = useCallback(() => {
    if (!params.get("open")) return;
    setParams((p) => { const q = new URLSearchParams(p); q.delete("open"); return q; }, { replace: true, preventScrollReset: true });
  }, [params, setParams]);
  return <div className="ek-root"><CheckNotesProvider notes={D.checkNotes} onOpen={closeOwnSheet}><Study /></CheckNotesProvider></div>;
}
