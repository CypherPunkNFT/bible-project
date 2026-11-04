// /study/how-hebrew-works: the alphabet, the points, the roots and the verb, so a reader can sound out a line and tell what a form shows
// from what is read into it. The words and counts are scripts/build-hebrew-study.py's; the claims and sources are the research record's.
// Each section keeps its own failure, the view lives in the address, and a chosen letter or word opens the record sheet from the right.
import { useCallback, useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Bench } from "./Bench";
import { Closing } from "./Closing";
import { Landing } from "./Landing";
import { Layers } from "./Layers";
import { Letters } from "./Letters";
import { findOpened } from "./model";
import { HwSection } from "./parts";
import { Points } from "./Points";
import { Roots } from "./Roots";
import { HebrewSheet } from "./Sheet";
import { Verbs } from "./Verbs";
import "./hebrew.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`How Hebrew works page: could not read the address's section "${hash}"`, error);
  }
}

export default function HebrewPage() {
  useEffect(() => {
    document.title = "How Hebrew works · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const focusClose = useRef(false);
  const openValue = params.get("open");
  const opened = findOpened(openValue);

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // A record opened by its address has no button behind it, so the reader starts at its heading.
    if (opened) document.querySelector<HTMLElement>(".hw-root .ms-sheet.open h2")?.focus();
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusClose.current && opened) document.querySelector<HTMLElement>(".hw-root .ms-sheet.open .ms-sheet-close")?.focus();
    focusClose.current = false;
  }, [opened]);

  const setParam = useCallback((name: string, value: string | null) => {
    setParams((p) => { const q = new URLSearchParams(p); if (value) q.set(name, value); else q.delete(name); return q; }, { replace: true, preventScrollReset: true });
  }, [setParams]);
  const open = useCallback((key: string) => {
    focusClose.current = true;
    setParam("open", key);
  }, [setParam]);
  const close = useCallback(() => {
    const key = openValue;
    setParam("open", null);
    // Back to the button that opened it, found by its key; when it is not on the page, the top of the page.
    const trigger = key ? document.querySelector<HTMLElement>(`.hw-root [data-open="${CSS.escape(key)}"]`) : null;
    if (trigger) trigger.focus(); else document.querySelector<HTMLElement>(".hw-root h1")?.focus();
  }, [openValue, setParam]);

  const line = params.get("line"), layer = params.get("layer"), lens = params.get("lens"), root = params.get("root"), form = params.get("form");
  const resetKey = [openValue, line, layer, lens, root, form].join("|");

  return <div className="hw-root"><div className="hw-wrap">
    <HwSection id="landing"><Landing /></HwSection>
    <HwSection id="line" resetKey={resetKey}><Layers lineValue={line} layerValue={layer} onParam={setParam} /></HwSection>
    <HwSection id="letters" resetKey={resetKey}><Letters lensValue={lens} picked={opened?.type === "letter" ? opened.letter.id : null} onLens={(id) => setParam("lens", id)} onOpen={open} /></HwSection>
    <HwSection id="points" resetKey={resetKey}><Points onOpen={open} /></HwSection>
    <HwSection id="bench"><Bench /></HwSection>
    <HwSection id="roots" resetKey={resetKey}><Roots rootValue={root} onRoot={(id) => setParam("root", id)} onOpen={open} /></HwSection>
    <HwSection id="verb" resetKey={resetKey}><Verbs formValue={form} onForm={(id) => setParam("form", id)} onOpen={open} /></HwSection>
    <HwSection id="stops"><Closing /></HwSection>
  </div><HwSection id="sheet" resetKey={resetKey} onDismiss={close}><HebrewSheet opened={opened} onClose={close} /></HwSection></div>;
}
