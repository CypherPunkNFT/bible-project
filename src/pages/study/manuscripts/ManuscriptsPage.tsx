// /study/manuscripts: the open catalogue of the Bible's manuscripts, drawn as the owner-approved mock-up direction B
// (design/manuscripts-directions/?d=b): its sections in its order, its markup and its own CSS (generated into
// mockup-manuscripts.css by scripts/build-manuscript-styles.py). The data is scripts/build-manuscripts.py's. Each section
// keeps its own failure; any manuscript chosen anywhere opens the record sheet from the right.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { loadManuscripts } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import { PageStatus } from "@/pages/teachers/shared/Frame";
import { Cabinet } from "./Cabinet";
import { Catalogue } from "./Catalogue";
import { Landing } from "./Landing";
import { buildIndex } from "./model";
import { BehindTheRecords, KeepGoing } from "./Onward";
import { MsContext } from "./context";
import { MsSection, SectionHead } from "./parts";
import { Places } from "./Places";
import { RecordSheet } from "./Sheet";
import { TimeBook } from "./TimeBook";
import "./manuscripts.css";

export default function ManuscriptsPage() {
  const collection = useAsync(loadManuscripts, "manuscripts/collection");
  useEffect(() => {
    document.title = "Manuscripts · Study · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  if (collection.status !== "ready") return <PageStatus error={collection.status === "error" ? collection.error as Error : null} />;
  return <Page data={collection.value} />;
}

function Page({ data }: { data: Parameters<typeof buildIndex>[0] }) {
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

  return <MsContext.Provider value={context}><div className="ms-root">
    <div className="wrap t-page ms-page ms-b">
      <MsSection id="landing" title="Manuscripts"><Landing /></MsSection>
      <MsSection id="timebook" title="Through time · book by book"><TimeBook num="01" /></MsSection>
      <MsSection id="places" title="Where are they now?"><Places num="02" /></MsSection>
      <MsSection id="collection" title="Every manuscript">
        <SectionHead num="03" kicker="Every manuscript" title={<>The great witnesses, <em>then every record</em></>}
          lead="The famous copies on one shelf, oldest first in each family; below them the whole catalogue, by kind, searchable." />
        <Cabinet /><Catalogue />
      </MsSection>
      <MsSection id="onward" title="Keep going"><KeepGoing num="04" /></MsSection>
      <MsSection id="basis" title="Behind the records"><BehindTheRecords num="05" /></MsSection>
    </div>
    <RecordSheet index={index} record={record} open={sheet.open} onClose={closeRecord} returnFocus={returnFocus} justOpened={justOpened} />
  </div></MsContext.Provider>;
}
