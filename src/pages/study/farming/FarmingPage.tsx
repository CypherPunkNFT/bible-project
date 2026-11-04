// /study/the-farming-year: the farmer's year from the Gezer calendar, and what Ruth, the prophets and the parables assume their hearers
// know of it. The verses are scripts/build-farming-study.py's; the claims and sources are the research record's. Each section keeps its
// own failure, the view lives in the address, and a chosen job opens the record sheet from the right.
import { useCallback, useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Claims } from "./Claims";
import { Clock } from "./Clock";
import { Closing } from "./Closing";
import { Hearer } from "./Hearer";
import { Jobs } from "./Jobs";
import { Landing } from "./Landing";
import { findOpened } from "./model";
import { FySection } from "./parts";
import { FarmingSheet } from "./Sheet";
import { Stone } from "./Stone";
import "./farming.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`The farming year page: could not read the address's section "${hash}"`, error);
  }
}

export default function FarmingPage() {
  useEffect(() => {
    document.title = "The farming year · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const returnFocus = useRef<HTMLElement | null>(null);
  const focusClose = useRef(false);
  const openValue = params.get("open");
  const lineValue = params.get("line");
  const clockValue = params.get("clock");
  const job = findOpened(openValue);

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusClose.current && job) document.querySelector<HTMLElement>(".fy-root .ms-sheet.open .ms-sheet-close")?.focus();
    focusClose.current = false;
  }, [job]);

  // Each action changes one address value, in one call: React Router does not queue a second call made in the same handler.
  const setParam = useCallback((name: string, value: string | null) => {
    setParams((p) => { const q = new URLSearchParams(p); if (value) q.set(name, value); else q.delete(name); return q; }, { replace: true, preventScrollReset: true });
  }, [setParams]);
  const open = useCallback((key: string) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    focusClose.current = true;
    setParam("open", key);
  }, [setParam]);
  const close = useCallback(() => {
    setParam("open", null);
    returnFocus.current?.focus();
  }, [setParam]);
  const resetKey = `${openValue}|${lineValue}|${clockValue}`;

  return <div className="fy-root"><div className="fy-wrap">
    <FySection id="landing"><Landing /></FySection>
    <FySection id="stone" resetKey={resetKey}><Stone seasonId={lineValue} onSeason={(id) => setParam("line", id)} /></FySection>
    <FySection id="clock" resetKey={resetKey}><Clock passageId={clockValue} onPassage={(id) => setParam("clock", id)} /></FySection>
    <FySection id="jobs" resetKey={resetKey}><Jobs picked={job?.id ?? null} onOpen={open} /></FySection>
    <FySection id="hearer"><Hearer /></FySection>
    <FySection id="claims"><Claims /></FySection>
    <FySection id="stops"><Closing /></FySection>
  </div><FySection id="sheet" resetKey={resetKey}><FarmingSheet job={job} onClose={close} /></FySection></div>;
}
