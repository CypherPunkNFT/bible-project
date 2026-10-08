import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { readyKey } from "@/components/people-pages/usePeoplePageSlide";
import { AccountsSection } from "./Accounts";
import { Cinema } from "./Cinema";
import { Counter } from "./Counter";
import { headerHeight, PERIOD_TONE, plural, preloadOthers, useApostleData } from "./data";
import { Landing } from "./Landing";
import { takePlace } from "./place";
import { PlacesSection } from "./Places";
import { QuestionsSection } from "./Questions";
import { GridSection, RingSection } from "./Record";
import { SheetContext, type SheetApi } from "./sheet";
import { Tip } from "./tip";
import type { Apostle } from "./types";
import { EntrySheet, Sheet } from "./ui";
import { WithSection } from "./With";
import "./apostle-page.css";
import "./apostle-sections.css";
import "./apostle-art.css";

/**
 * The apostle pages (/people/:id/mission) of the Twelve, Matthias and Paul, as the owner approved them
 * (design/apostle-merged/, 2026-10-08): the landing, 01 the record ring, 02 the chapter grid, the cinema chapters,
 * 03 who was with him, 04 one moment told several times, 05 where he was, 06 what readers still ask, and the sources.
 * The counter floats below the site's header the whole way down. The wider circle's mission pages (Barnabas, Silas …)
 * keep ApostlePage.tsx in people-pages/.
 */
export function ApostleMissionPage({ id }: { id: string }) {
  // One page per apostle: switching remounts it, so every section starts fresh, as the design does.
  return <ApostleMission key={id} id={id} />;
}

function Sources({ d }: { d: Apostle }) {
  return <details className="sources"><summary>Sources · {plural(d.citations.length, "work")} cited on this page</summary>
    <ul>{d.citations.map((c) => <li key={c.id}><a href={c.url ?? "#"} target="_blank" rel="noreferrer">{c.author}</a>, <i>{c.title}</i>{c.year ? ` (${c.year})` : ""}{c.where ? `, ${c.where}` : ""}</li>)}</ul>
    <p className="plain-line">Scripture is quoted from the King James Version as held on this site. Places from OpenBible.info (CC BY); the land outline is the Atlas's own (Natural Earth).</p></details>;
}

function ApostleMission({ id }: { id: string }) {
  const state = useApostleData(id);
  const [sheet, setSheet] = useState<{ node: ReactNode; tone: string } | null>(null);
  // Ready (for the people pages' wipe) once drawn and, when the reader switched with the counter, back at their place.
  const [placed, setPlaced] = useState(false);
  const d = state.status === "ready" ? state.value.apostle : undefined;

  const close = useCallback(() => setSheet(null), []);
  const api = useMemo<SheetApi>(() => ({
    open: (node, tone = "var(--accent)") => { Tip.hide(); setSheet({ node, tone }); },
    openEntry: (e) => { if (d) { Tip.hide(); setSheet({ node: <EntrySheet d={d} e={e} />, tone: PERIOD_TONE[e.period] }); } },
  }), [d]);

  useLayoutEffect(() => {
    if (!d) return;
    document.title = `${d.name} · Apostles · Bible Project`;
    const place = takePlace();
    if (!place) { setPlaced(true); return; }
    // The site's layout scrolls to the top on every new address after this runs; restore the place just after it.
    const timer = window.setTimeout(() => {
      const sec = document.querySelector<HTMLElement>(`.ap-page [data-sec="${place.sec}"]`);
      if (sec) window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY - (headerHeight() + 20) + Math.min(place.off, sec.offsetHeight - 40));
      setPlaced(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [d]);
  useEffect(() => {
    if (!d) return;
    const timer = window.setTimeout(() => preloadOthers(d.id), 700);
    return () => window.clearTimeout(timer);
  }, [d]);
  useEffect(() => () => { Tip.remove(); document.documentElement.classList.remove("no-select"); }, []);
  useLayoutEffect(() => {
    const set = () => document.documentElement.style.setProperty("--ap-head", `${headerHeight()}px`);
    set();
    addEventListener("resize", set);
    return () => removeEventListener("resize", set);
  }, []);

  if (state.status === "error") return <div className="ap ap-page"><div className="wrap"><p className="plain-line ap-missing">This page could not load its data ({state.message}).</p></div></div>;
  if (!d) return <div className="ap ap-page ap-loading" aria-busy="true"><div className="land" /></div>;
  return <SheetContext.Provider value={api}>
    <div className="ap ap-page" data-people-ready={placed ? readyKey({ kind: "special", id, aspect: "mission" }) : undefined} style={{ "--tone": "var(--accent)" } as CSSProperties}>
      <Counter id={d.id} />
      <Landing d={d} draw={state.status === "ready" ? state.value.draw : () => null} />
      <div className="wrap"><RingSection d={d} /><GridSection d={d} /></div>
      <Cinema d={d} />
      <div className="wrap"><WithSection d={d} /><AccountsSection d={d} /><PlacesSection d={d} /><QuestionsSection d={d} /><Sources d={d} /></div>
      <Sheet content={sheet?.node ?? null} tone={sheet?.tone ?? "var(--accent)"} onClose={close} />
    </div>
  </SheetContext.Provider>;
}
