// /study/how-new-testament-greek-works: the alphabet, endings over word order, the article and the verb, so a reader can follow what is
// said "in the Greek" and tell what a form shows from what the verse shows. The words and counts are scripts/build-greek-study.py's; the
// claims and sources are the research record's. Each section keeps its own failure, the view lives in the address, and a chosen word opens
// the record sheet from the right.
import { useCallback, useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Article } from "./Article";
import { Closing } from "./Closing";
import { Common } from "./Common";
import { Endings } from "./Endings";
import { Landing } from "./Landing";
import { Letters } from "./Letters";
import { findOpened } from "./model";
import { MoveWords } from "./MoveWords";
import { NgSection } from "./parts";
import { GreekSheet } from "./Sheet";
import { Verb } from "./Verb";
import "./greek.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`How New Testament Greek works page: could not read the address's section "${hash}"`, error);
  }
}

export default function GreekPage() {
  useEffect(() => {
    document.title = "How New Testament Greek works · Bible Guide";
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
    if (opened) document.querySelector<HTMLElement>(".ng-root .ms-sheet.open h2")?.focus();
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusClose.current && opened) document.querySelector<HTMLElement>(".ng-root .ms-sheet.open .ms-sheet-close")?.focus();
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
    const trigger = key ? document.querySelector<HTMLElement>(`.ng-root [data-open="${CSS.escape(key)}"]`) : null;
    if (trigger) trigger.focus(); else document.querySelector<HTMLElement>(".ng-root h1")?.focus();
  }, [openValue, setParam]);

  const order = params.get("order"), swap = params.get("swap"), view = params.get("view"), noun = params.get("noun"), line = params.get("line"), lens = params.get("lens"), form = params.get("form");
  const resetKey = [openValue, order, swap, view, noun, line, lens, form].join("|");

  return <div className="ng-root"><div className="ng-wrap">
    <NgSection id="landing"><Landing /></NgSection>
    <NgSection id="move" num="01" kicker="Move the words" resetKey={resetKey}><MoveWords orderValue={order} swapValue={swap} onParam={setParam} /></NgSection>
    <NgSection id="letters" num="02" kicker="Twenty-four letters" resetKey={resetKey}><Letters viewValue={view} picked={opened?.type === "letter" ? opened.letter.id : null} onView={(id) => setParam("view", id === "groups" ? null : id)} onOpen={open} /></NgSection>
    <NgSection id="endings" num="03" kicker="The endings" resetKey={resetKey}><Endings nounValue={noun} lineValue={line} lensValue={lens} onParam={setParam} onOpen={open} /></NgSection>
    <NgSection id="article" num="04" kicker="The small word"><Article /></NgSection>
    <NgSection id="verb" num="05" kicker="The verb" resetKey={resetKey}><Verb formValue={form} onForm={(id) => setParam("form", id === "aorist" ? null : id)} onOpen={open} /></NgSection>
    <NgSection id="everyday" num="06" kicker="Everyday Greek"><Common /></NgSection>
    <NgSection id="stops" num="07" kicker="Where it stops"><Closing /></NgSection>
  </div><NgSection id="sheet" resetKey={resetKey} onDismiss={close}><GreekSheet opened={opened} onClose={close} /></NgSection></div>;
}
