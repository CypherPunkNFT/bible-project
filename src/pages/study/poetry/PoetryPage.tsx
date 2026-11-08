// /study/hebrew-poetry-and-biblical-narrative: the patterns a reader can see on the page, drawn over real verses with the
// Hebrew beside the Berean: lines that pair, passages that fold, poems that run the alphabet, words that return, stories that
// show more than they say, and the same habits in the New Testament's Greek; then five claims and where the study stops.
// The verses, pairs, folds, columns and counts are scripts/build-poetry-study.py's; the words are the research record's.
// The view lives in the address (kind, test, poem, word, tool, open); one sheet at a time.
import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CheckNotesProvider } from "@/pages/study/check-notes/CheckNotes";
import { useCheckNotes } from "@/pages/study/check-notes/context";
import { Claims, Closing } from "./Closing";
import { Folds } from "./Folds";
import { Greek } from "./Greek";
import { Landing } from "./Landing";
import { Letters } from "./Letters";
import { Lines } from "./Lines";
import { D, findKind, findOpened, findPoem, findTest, findTool, findWord } from "./model";
import { OpenContext } from "./open";
import { HpnSection } from "./parts";
import { HpnSheet } from "./Sheet";
import { Story } from "./Story";
import { Threads } from "./Threads";
import "./poetry.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`The Hebrew poetry page: could not read the address's section "${hash}"`, error);
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
    if (opened && focusClose.current) document.querySelector<HTMLElement>(".hpn-root .ms-sheet.open:not(.chk-panel) .ms-sheet-close")?.focus();
    focusClose.current = false;
    if (!opened && focusOpener.current && opener.current) {
      document.querySelector<HTMLElement>(`.hpn-root [data-opener="${CSS.escape(opener.current)}"]`)?.focus();
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

  return <OpenContext.Provider value={open}><div className="hpn-page" onClickCapture={notePress}><div className="hpn-wrap">
    <HpnSection id="landing"><Landing /></HpnSection>
    <HpnSection id="lines" resetKey={resetKey}><Lines kind={findKind(params.get("kind"))} onChange={setMany} /></HpnSection>
    <HpnSection id="folds" resetKey={resetKey}><Folds test={findTest(params.get("test"))} onChange={setMany} /></HpnSection>
    <HpnSection id="letters" resetKey={resetKey}><Letters poem={findPoem(params.get("poem"))} onChange={setMany} /></HpnSection>
    <HpnSection id="words" resetKey={resetKey}><Threads word={findWord(params.get("word"))} onChange={setMany} /></HpnSection>
    <HpnSection id="story" resetKey={resetKey}><Story tool={findTool(params.get("tool"))} onChange={setMany} /></HpnSection>
    <HpnSection id="greek"><Greek /></HpnSection>
    <HpnSection id="claims"><Claims /></HpnSection>
    <HpnSection id="stops"><Closing /></HpnSection>
  </div><HpnSection id="sheet" resetKey={resetKey}><HpnSheet item={opened} onClose={close} /></HpnSection></div></OpenContext.Provider>;
}

export default function PoetryPage() {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    document.title = "Hebrew poetry and biblical narrative · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  // A check note opening closes the page's own sheet: one sheet at a time.
  const closeOwnSheet = useCallback(() => {
    if (!params.get("open")) return;
    setParams((p) => { const q = new URLSearchParams(p); q.delete("open"); return q; }, { replace: true, preventScrollReset: true });
  }, [params, setParams]);
  return <div className="hpn-root"><CheckNotesProvider notes={D.checkNotes} onOpen={closeOwnSheet}><Study /></CheckNotesProvider></div>;
}
