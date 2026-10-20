// /study/passage-through-manuscripts: "A passage through the manuscripts", drawn as the owner-approved mock-up direction D
// (design/passage-directions/?d=d, the merger of A, B and C): its sections in its order, its markup and its own CSS
// (generated into the three mockup-passage-*.css files by scripts/build-passage-styles.py). Every word comes from evidence.ts; every count
// and picture from the open Manuscripts collection. Each section keeps its own failure; any manuscript chosen anywhere
// (an element carrying data-open="<record id>") opens the Manuscripts page's record sheet from the right.
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { loadManuscripts } from "@/lib/data";
import type { ManuscriptCollection } from "@/lib/manuscripts";
import { useAsync } from "@/lib/useAsync";
import { PageStatus } from "@/pages/teachers/shared/Frame";
import { MsContext } from "../manuscripts/context";
import { buildIndex } from "../manuscripts/model";
import { RecordSheet } from "../manuscripts/Sheet";
import { Chapter, Prologue } from "./Chapter";
import { Editions } from "./Editions";
import { chapters } from "./evidence";
import { Kinds } from "./Kinds";
import { Cabinet, Closing } from "./Onward";
import { Opening } from "./Opening";
import { Rail } from "./Rail";
import "./passage-manuscripts.css";

/** One section of the page; if it fails to draw, only it says so and the rest of the page carries on. */
class Section extends Component<{ id: string; extra?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Passage study: section #${this.props.id} failed to draw`, error, info.componentStack);
  }
  render() {
    const { id, extra = "", children } = this.props;
    return <section id={id} className={`t-sec pm-sec sec-${id} ${extra}`.trim()}>
      {this.state.failed ? <p className="t-failed">This section could not be drawn.</p> : children}
    </section>;
  }
}

export default function PassageManuscriptsPage() {
  const collection = useAsync(loadManuscripts, "manuscripts/collection");
  useEffect(() => {
    document.title = "A passage through the manuscripts · Study · Bible Project";
    return () => { document.title = "Bible Project"; };
  }, []);
  if (collection.status !== "ready") return <PageStatus error={collection.status === "error" ? collection.error as Error : null} />;
  return <Page data={collection.value} />;
}

function Page({ data }: { data: ManuscriptCollection }) {
  const index = useMemo(() => buildIndex(data), [data]);
  const [sheet, setSheet] = useState<{ id: string | null; open: boolean }>({ id: null, open: false });
  const returnFocus = useRef<HTMLElement | SVGElement | null>(null), justOpened = useRef(false);
  const openRecord = useCallback((id: string, from?: HTMLElement | SVGElement | null) => {
    if (!index.byId.has(id)) { console.error(`record sheet: no record with id "${id}" in the collection`); return; }
    returnFocus.current = from ?? (document.activeElement as HTMLElement | null);
    justOpened.current = true;
    setTimeout(() => { justOpened.current = false; }, 0);
    setSheet({ id, open: true });
  }, [index]);
  const closeRecord = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);
  const context = useMemo(() => ({ index, openRecord }), [index, openRecord]);

  // As the mock-up's document handler did: any element with data-open="<record id>" opens that record.
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const click = (e: MouseEvent) => {
      const target = (e.target as Element | null)?.closest<HTMLElement>("[data-open]");
      if (!target || target.closest(".ms-sheet")) return;
      e.preventDefault();
      openRecord(target.dataset.open ?? "", target);
    };
    el.addEventListener("click", click);
    return () => el.removeEventListener("click", click);
  }, [openRecord]);

  // Ways in from other pages: ?record=<id> opens that record's sheet; #<section> scrolls to it once the page is drawn.
  const [params] = useSearchParams(), { hash } = useLocation();
  useEffect(() => {
    const id = params.get("record");
    if (id) openRecord(id);
    else if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    // Only on arrival: the sheet and the scroll are the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const record = sheet.id ? index.byId.get(sheet.id) ?? null : null;

  return <MsContext.Provider value={context}><div className="pm-root" ref={root}>
    <div className="wrap pm-page pm-d">
      <Section id="a-landing"><Opening /></Section>
      <Section id="b-prologue" extra="bp"><Prologue num="01" /></Section>
      {chapters.map((chapter, i) => <Section key={chapter.id} id={chapter.id} extra="bc"><Chapter num={`0${i + 2}`} chapter={chapter} /></Section>)}
      <Section id="d-gaps"><Kinds num="05" /></Section>
      <Section id="a-editions"><Editions num="06" /></Section>
      <Section id="a-cabinet"><Cabinet num="07" /></Section>
      <Section id="a-close"><Closing num="08" /></Section>
    </div>
    <Rail />
    <RecordSheet index={index} record={record} open={sheet.open} onClose={closeRecord} returnFocus={returnFocus} justOpened={justOpened} />
  </div></MsContext.Provider>;
}
