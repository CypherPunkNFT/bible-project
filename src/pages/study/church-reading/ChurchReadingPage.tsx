// /study/how-the-church-has-read-the-bible: one passage, Galatians 4:21-31, laid out as a glossed page with twelve readers in its margins,
// then asked four questions, opened out into the four senses, drawn on a line of time, and followed to what verse 30 was used for. The verses
// are scripts/build-church-reading-study.py's; the claims and sources are the research record's. Each section keeps its own failure, the view
// lives in the address, and a chosen reader's record opens from the right.
import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Claims } from "./Claims";
import { Closing } from "./Closing";
import { GlossedPage } from "./GlossedPage";
import { Landing } from "./Landing";
import { LineOfTime } from "./LineOfTime";
import { findOpened, findQuestion, findReader, findSense } from "./model";
import { HcSection } from "./parts";
import { Questions } from "./Questions";
import { Senses } from "./Senses";
import { ReaderSheet } from "./Sheet";
import { Whom } from "./Whom";
import "./church-reading.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`The church reading page: could not read the address's section "${hash}"`, error);
  }
}

export default function ChurchReadingPage() {
  useEffect(() => {
    document.title = "How the church has read the Bible · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const opener = useRef<string | null>(null);
  const focusClose = useRef(false);
  const focusOpener = useRef(false);
  const readerValue = params.get("reader"), askValue = params.get("ask"), senseValue = params.get("sense"), openValue = params.get("open");
  const opened = findOpened(openValue);
  // An open record wins over the address's chosen reader, so that the words lit on the page always belong to the record beside them.
  const chosen = opened ?? findReader(readerValue);

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (opened && focusClose.current) document.querySelector<HTMLElement>(".hc-root .ms-sheet.open .ms-sheet-close")?.focus();
    focusClose.current = false;
    if (!opened && focusOpener.current) {
      // The opener is found again by its key after the render: the one that was pressed may have been redrawn.
      const back = opener.current ? document.querySelector<HTMLElement>(`.hc-root [data-opener="${CSS.escape(opener.current)}"]`) : null;
      (back ?? document.querySelector<HTMLElement>(".hc-root #page h2"))?.focus();
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
  const choose = useCallback((id: string) => setMany({ reader: id }), [setMany]);
  const open = useCallback((id: string) => {
    opener.current = (document.activeElement as HTMLElement | null)?.dataset?.opener ?? null;
    focusClose.current = true;
    setMany({ reader: id, open: `reader:${id}` });
  }, [setMany]);
  const close = useCallback(() => {
    focusOpener.current = true;
    setMany({ open: null });
  }, [setMany]);
  // Safari and Firefox on a Mac do not focus a pressed button, so note it before the press's handler reads the focus.
  const notePress = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-opener]");
    if (target) target.focus({ preventScroll: true });
  }, []);
  const resetKey = `${readerValue}|${askValue}|${senseValue}|${openValue}`;

  return <div className="hc-root" onClickCapture={notePress}><div className="hc-wrap">
    <HcSection id="landing"><Landing /></HcSection>
    <HcSection id="page" resetKey={resetKey}><GlossedPage chosen={chosen} resetKey={resetKey} onChoose={choose} onOpen={open} /></HcSection>
    <HcSection id="questions" resetKey={resetKey}><Questions question={findQuestion(askValue)} onQuestion={(id) => setMany({ ask: id })} onOpen={open} /></HcSection>
    <HcSection id="senses" resetKey={resetKey}><Senses sense={findSense(senseValue)} onSense={(id) => setMany({ sense: id })} /></HcSection>
    <HcSection id="time"><LineOfTime onOpen={open} /></HcSection>
    <HcSection id="whom"><Whom onOpen={open} /></HcSection>
    <HcSection id="claims"><Claims /></HcSection>
    <HcSection id="stops"><Closing /></HcSection>
  </div><HcSection id="sheet" resetKey={resetKey}><ReaderSheet reader={opened} onClose={close} /></HcSection></div>;
}
