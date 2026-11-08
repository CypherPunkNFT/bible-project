// /study/the-temple-and-israels-worship: Israel's worship at one place in four buildings, read by one question: which witness told
// me this, and how near was it to the temple? The four plans at one scale round one inner room, the house in its world, Herod's
// platform from below, the priests, the day and the year, AD 70, four claims and where the study stops. The verses, measurements
// and places are scripts/build-temple-study.py's; the words are the research record's. The view lives in the address
// (house, scale, find, feast, open); one sheet at a time.
import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CheckNotesProvider } from "@/pages/study/check-notes/CheckNotes";
import { useCheckNotes } from "@/pages/study/check-notes/context";
import { Claims, Closing } from "./Closing";
import { DayYear } from "./DayYear";
import { Fall } from "./Fall";
import { Houses, Stance, TimeStrip } from "./Houses";
import { Landing } from "./Landing";
import { D, findFeast, findFind, findHouse, findOpened, findScale } from "./model";
import { OpenContext } from "./open";
import { TwSection } from "./parts";
import { Platform } from "./Platform";
import { Priests } from "./Priests";
import { TwSheet } from "./Sheet";
import { World } from "./World";
import "./temple.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`The temple page: could not read the address's section "${hash}"`, error);
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
    if (opened && focusClose.current) document.querySelector<HTMLElement>(".tw-root .ms-sheet.open:not(.chk-panel) .ms-sheet-close")?.focus();
    focusClose.current = false;
    if (!opened && focusOpener.current && opener.current) {
      document.querySelector<HTMLElement>(`.tw-root [data-opener="${CSS.escape(opener.current)}"]`)?.focus();
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
  const pendingFind = useRef<string | null>(null);
  const open = useCallback((key: string) => {
    closeNote?.();
    opener.current = (document.activeElement as HTMLElement | null)?.dataset?.opener ?? key;
    focusClose.current = true;
    const find = pendingFind.current;
    pendingFind.current = null;
    setMany(find ? { open: key, find } : { open: key });
  }, [setMany, closeNote]);
  const close = useCallback(() => {
    focusOpener.current = true;
    setMany({ open: null });
  }, [setMany]);
  // A find is chosen and opened in one change of the address: the choice is noted here, and open() carries it.
  const chooseFind = useCallback((id: string) => { pendingFind.current = id; }, []);
  // Safari and Firefox on a Mac do not focus a pressed button, so note it before the press's handler reads the focus.
  const notePress = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-opener]");
    if (target) target.focus({ preventScroll: true });
  }, []);
  const resetKey = params.toString();

  return <OpenContext.Provider value={open}><div className="tw-page" onClickCapture={notePress}><div className="tw-wrap">
    <TwSection id="landing"><Landing /></TwSection>
    <TwSection id="houses" resetKey={resetKey}>
      <Houses chosen={findHouse(params.get("house")).id} scale={findScale(params.get("scale"))} onChange={setMany} />
      <Stance />
      <TimeStrip />
    </TwSection>
    <TwSection id="world"><World /></TwSection>
    <TwSection id="platform" resetKey={resetKey}><Platform chosen={findFind(params.get("find"))?.id ?? null} onChoose={chooseFind} /></TwSection>
    <TwSection id="priests"><Priests /></TwSection>
    <TwSection id="calendar" resetKey={resetKey}><DayYear feast={findFeast(params.get("feast")).id} onChange={setMany} /></TwSection>
    <TwSection id="fall"><Fall /></TwSection>
    <TwSection id="claims"><Claims /></TwSection>
    <TwSection id="stops"><Closing /></TwSection>
  </div><TwSection id="sheet" resetKey={resetKey}><TwSheet item={opened} onClose={close} /></TwSection></div></OpenContext.Provider>;
}

export default function TemplePage() {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    document.title = "The temple and Israel's worship · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  // A check note opening closes the page's own sheet: one sheet at a time.
  const closeOwnSheet = useCallback(() => {
    if (!params.get("open")) return;
    setParams((p) => { const q = new URLSearchParams(p); q.delete("open"); return q; }, { replace: true, preventScrollReset: true });
  }, [params, setParams]);
  return <div className="tw-root"><CheckNotesProvider notes={D.checkNotes} onOpen={closeOwnSheet}><Study /></CheckNotesProvider></div>;
}
