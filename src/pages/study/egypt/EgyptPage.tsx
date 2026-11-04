// /study/egypt-beside-israel: a wisdom book, a hymn and letters from Canaan, read beside Scripture for how Israel's neighbours wrote and
// thought. The verses and the letters are scripts/build-egypt-study.py's; the claims and sources are the research record's. Each section
// keeps its own failure, the view lives in the address, and a chosen passage opens the record sheet from the right.
import { useCallback, useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Claims } from "./Claims";
import { Closing } from "./Closing";
import { Day } from "./Day";
import { Landing } from "./Landing";
import { Letters } from "./Letters";
import { Likeness } from "./Likeness";
import { findOpened } from "./model";
import { EgSection } from "./parts";
import { Seam } from "./Seam";
import { EgyptSheet } from "./Sheet";
import "./egypt.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`The Egypt beside Israel page: could not read the address's section "${hash}"`, error);
  }
}

export default function EgyptPage() {
  useEffect(() => {
    document.title = "Egypt beside Israel · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const returnFocus = useRef<HTMLElement | null>(null);
  const focusClose = useRef(false);
  const openValue = params.get("open");
  const opened = findOpened(openValue);
  const judge = params.get("judge"), theme = params.get("theme"), city = params.get("city"), letter = params.get("letter"), view = params.get("view");

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusClose.current && opened) document.querySelector<HTMLElement>(".eg-root .ms-sheet.open .ms-sheet-close")?.focus();
    focusClose.current = false;
  }, [opened]);

  // Each action changes its address values in one call: React Router does not queue a second call made in the same handler.
  const setValues = useCallback((values: Record<string, string | null>) => {
    setParams((p) => {
      const q = new URLSearchParams(p);
      for (const [name, value] of Object.entries(values)) { if (value) q.set(name, value); else q.delete(name); }
      return q;
    }, { replace: true, preventScrollReset: true });
  }, [setParams]);
  const open = useCallback((key: string) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    focusClose.current = true;
    setValues({ open: key });
  }, [setValues]);
  const close = useCallback(() => {
    setValues({ open: null });
    returnFocus.current?.focus();
  }, [setValues]);
  const resetKey = `${openValue}|${judge}|${theme}|${city}|${letter}|${view}`;

  return <div className="eg-root"><div className="eg-wrap">
    <EgSection id="landing"><Landing /></EgSection>
    <EgSection id="seam" resetKey={resetKey}><Seam judgeId={judge} picked={opened?.id ?? null} onJudge={(id) => setValues({ judge: id })} onOpen={open} /></EgSection>
    <EgSection id="songs" resetKey={resetKey}><Day themeId={theme} onTheme={(id) => setValues({ theme: id })} /></EgSection>
    <EgSection id="letters" resetKey={resetKey}><Letters cityId={city} letterId={letter} onChange={setValues} /></EgSection>
    <EgSection id="likeness" resetKey={resetKey}><Likeness viewId={view} onView={(id) => setValues({ view: id })} /></EgSection>
    <EgSection id="claims"><Claims /></EgSection>
    <EgSection id="stops"><Closing /></EgSection>
  </div><EgSection id="sheet" resetKey={resetKey}><EgyptSheet parallel={opened} onClose={close} /></EgSection></div>;
}
