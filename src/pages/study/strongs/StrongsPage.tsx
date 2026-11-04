// /study/strongs-numbers: what a Strong's number is, how to use the tools the site has for it, and three mistakes. The counts are
// scripts/build-strongs-study.py's; the claims and sources are the research record's. Each section keeps its own failure, the view
// lives in the address, and a chosen rendering opens the record sheet from the right.
import { useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Bench } from "./Bench";
import { Closing } from "./Closing";
import { Landing } from "./Landing";
import { Mistakes } from "./Mistakes";
import { findOpened } from "./model";
import { Numbered } from "./Numbered";
import { SnSection } from "./parts";
import { Renderings } from "./Renderings";
import { StrongsSheet } from "./Sheet";
import "./strongs.css";

export default function StrongsPage() {
  useEffect(() => {
    document.title = "Strong's numbers · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const returnFocus = useRef<HTMLElement | null>(null);
  const opened = findOpened(params.get("word"), params.get("as"));

  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (word: string, label: string) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setParams((p) => { const q = new URLSearchParams(p); q.set("word", word); q.set("as", label); return q; }, { replace: true, preventScrollReset: true });
  };
  const close = () => {
    setParams((p) => { const q = new URLSearchParams(p); q.delete("word"); q.delete("as"); return q; }, { replace: true, preventScrollReset: true });
    returnFocus.current?.focus();
  };

  return <div className="sn-root"><div className="sn-wrap">
    <SnSection id="landing"><Landing /></SnSection>
    <SnSection id="numbered"><Numbered /></SnSection>
    <SnSection id="renderings"><Renderings onOpen={open} /></SnSection>
    <SnSection id="mistakes"><Mistakes /></SnSection>
    <SnSection id="bench"><Bench /></SnSection>
    <SnSection id="stops"><Closing /></SnSection>
  </div><StrongsSheet opened={opened} onClose={close} /></div>;
}
