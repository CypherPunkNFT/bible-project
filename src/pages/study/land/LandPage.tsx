// /study/the-land-of-the-bible: the land read by one question: where on the ground is this, and how sure is the place? A slice
// across the land at Jerusalem, the climb up and down, the rain against the river, water, roads and battle places, fixed sites
// against proposed ones, four claims tested, and where it stops. The verses, quotations, figures and map are
// scripts/build-land-study.py's; the words and check notes are the research record's. Each section keeps its own failure, the
// view lives in the address, and one sheet at a time opens from the right: the page's record sheet or a check note.
import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CheckNotesProvider } from "@/pages/study/check-notes/CheckNotes";
import { useCheckNotes } from "@/pages/study/check-notes/context";
import { Claims } from "./Claims";
import { Climb } from "./Climb";
import { Closing } from "./Closing";
import { Landing } from "./Landing";
import { D, findLayer, findOpened, findPoint } from "./model";
import { OpenContext } from "./open-context";
import { LsSection } from "./parts";
import { Places } from "./Places";
import { Rain } from "./Rain";
import { Roads } from "./Roads";
import { RecordSheet } from "./Sheet";
import { Slice } from "./Slice";
import { Water } from "./Water";
import "./land.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`The land of the Bible page: could not read the address's section "${hash}"`, error);
  }
}

/** A check note's sheet gets focus when it opens and hands it back when it closes (the shared sheet does neither). */
function useNoteFocus() {
  const notes = useCheckNotes();
  const openId = notes?.openId ?? null;
  const before = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (openId) {
      before.current ??= document.activeElement as HTMLElement | null;
      document.querySelector<HTMLElement>(".chk-panel.open .ms-sheet-close")?.focus({ preventScroll: true });
    } else if (before.current) {
      const back = before.current;
      before.current = null;
      if (back.isConnected && back.offsetParent !== null) back.focus({ preventScroll: true });
    }
  }, [openId]);
}

function LandBody({ closeRef }: { closeRef: { current: () => void } }) {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const notes = useCheckNotes();
  const opener = useRef<string | null>(null);
  const focusClose = useRef(false);
  const focusOpener = useRef(false);
  const opened = findOpened(params.get("open"));
  const at = findPoint(params.get("at"));
  const layer = findLayer(params.get("layer"));
  useNoteFocus();

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (opened && focusClose.current) document.querySelector<HTMLElement>(".ls-sheet.open .ms-sheet-close")?.focus({ preventScroll: true });
    focusClose.current = false;
    if (!opened && focusOpener.current) {
      // The opener is found again by its key after the render: the one that was pressed may have been redrawn.
      const back = opener.current ? document.querySelector<HTMLElement>(`.ls-root [data-opener="${CSS.escape(opener.current)}"]`) : null;
      back?.focus({ preventScroll: true });
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
  const open = useCallback((key: string) => {
    notes?.closeNote();
    const active = document.activeElement as HTMLElement | null;
    if (!active?.closest(".ls-sheet")) opener.current = active?.dataset?.opener ?? null;
    focusClose.current = true;
    setMany({ open: key });
  }, [notes, setMany]);
  const close = useCallback(() => {
    focusOpener.current = true;
    setMany({ open: null });
  }, [setMany]);
  // A check note opening closes the record sheet without moving focus: the note's own sheet takes it.
  const hasOpen = params.has("open");
  useEffect(() => {
    closeRef.current = () => { if (hasOpen) setMany({ open: null }); };
  }, [closeRef, hasOpen, setMany]);
  // Safari and Firefox on a Mac do not focus a pressed button, so note it before the press's handler reads the focus.
  const notePress = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-opener]");
    if (target) target.focus({ preventScroll: true });
  }, []);
  const resetKey = params.toString();

  return <OpenContext.Provider value={open}>
    <div className="ls-root" onClickCapture={notePress}><div className="ls-wrap">
      <LsSection id="landing"><Landing /></LsSection>
      <LsSection id="slice" resetKey={resetKey}><Slice at={at} layer={layer} onChange={setMany} /></LsSection>
      <LsSection id="climb"><Climb /></LsSection>
      <LsSection id="rain"><Rain /></LsSection>
      <LsSection id="water"><Water /></LsSection>
      <LsSection id="roads" resetKey={resetKey}><Roads battleId={params.get("battle")} onChange={setMany} /></LsSection>
      <LsSection id="places"><Places /></LsSection>
      <LsSection id="claims"><Claims /></LsSection>
      <LsSection id="stops"><Closing /></LsSection>
    </div><LsSection id="sheet" resetKey={resetKey}><RecordSheet opened={opened} onClose={close} /></LsSection></div>
  </OpenContext.Provider>;
}

export default function LandPage() {
  useEffect(() => {
    document.title = `${D.title} · Bible Guide`;
    return () => { document.title = "Bible Guide"; };
  }, []);
  const closeRef = useRef<() => void>(() => undefined);
  const onNoteOpen = useCallback(() => closeRef.current(), []);
  return <LsSection id="page"><CheckNotesProvider notes={D.checkNotes} onOpen={onNoteOpen}><LandBody closeRef={closeRef} /></CheckNotesProvider></LsSection>;
}
