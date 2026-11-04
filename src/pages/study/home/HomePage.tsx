// /study/home-and-household: what an Israelite house looked like and how a family lived in it, with what was found kept apart from what
// is pictured. The verses are scripts/build-home-study.py's; the claims and sources are the research record's. Each section keeps its
// own failure, the view lives in the address, and a chosen room or object opens the record sheet from the right.
import { useCallback, useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { BreadThread } from "./BreadThread";
import { Cabinet } from "./Cabinet";
import { Claims } from "./Claims";
import { Closing } from "./Closing";
import { House } from "./House";
import { Household } from "./Household";
import { Landing } from "./Landing";
import { findOpened } from "./model";
import { HhSection } from "./parts";
import { HomeSheet } from "./Sheet";
import { Work } from "./Work";
import "./home.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`Home and household page: could not read the address's section "${hash}"`, error);
  }
}

export default function HomePage() {
  useEffect(() => {
    document.title = "Home and household in Old Testament Israel · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const returnFocus = useRef<HTMLElement | null>(null);
  const focusClose = useRef(false);
  const openValue = params.get("open");
  const taskValue = params.get("task");
  const opened = findOpened(openValue);

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusClose.current && opened) document.querySelector<HTMLElement>(".hh-root .ms-sheet.open .ms-sheet-close")?.focus();
    focusClose.current = false;
  }, [opened]);

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
  const resetKey = `${openValue}|${taskValue}`;

  return <div className="hh-root"><div className="hh-wrap">
    <HhSection id="landing"><Landing /></HhSection>
    <HhSection id="house" resetKey={resetKey}><House picked={opened?.type === "room" ? opened.room.id : null} onOpen={open} /></HhSection>
    <HhSection id="work" resetKey={resetKey}><Work taskId={taskValue} onTask={(id) => setParam("task", id)} /></HhSection>
    <HhSection id="bread" resetKey={resetKey}><BreadThread /><Cabinet picked={opened?.type === "object" ? opened.object.id : null} onOpen={open} /></HhSection>
    <HhSection id="kin"><Household /></HhSection>
    <HhSection id="claims"><Claims /></HhSection>
    <HhSection id="stops"><Closing /></HhSection>
  </div><HhSection id="sheet" resetKey={resetKey}><HomeSheet opened={opened} onClose={close} /></HhSection></div>;
}
