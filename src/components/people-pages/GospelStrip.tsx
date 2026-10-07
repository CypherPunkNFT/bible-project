import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Refs } from "@/components/letters/LetterParts";
import type { Apostle } from "@/data/people-pages/types";
import { PEOPLE_PAGES, type ApostleSummary } from "@/lib/people-pages-index";
import { useCachedLoad } from "@/lib/people-pages";
import { loadHarmony, type HarmonySection } from "@/lib/study";
import { GOSPELS, harmonySectionOf, harmonySections } from "./harmony";
import { harmonyHref } from "./links";

type Dot = { moment: Apostle["moments"][number]; section: HarmonySection; index: number; books: string[] };

/**
 * His moments with Jesus, one row per Gospel in the order of the site's harmony: a dot for each event in which he is
 * named; choosing one opens the harmony there (PRESENTATION.md §4.3).
 */
export function GospelStrip({ apostle }: { apostle: Apostle }) {
  const harmony = useCachedLoad("harmony", loadHarmony);
  const [tip, setTip] = useState<Dot | null>(null);
  const layout = useMemo(() => {
    if (harmony.status !== "ready") return null;
    const all = harmonySections(harmony.value);
    const dots: Dot[] = apostle.moments.flatMap((moment) => {
      const section = moment.harmony ? all.find((s) => s.n === moment.harmony) : moment.refs[0] && harmonySectionOf(harmony.value, moment.refs[0]);
      if (!section) return [];
      const books = GOSPELS.map(([code]) => code).filter((code) => section.refs[code]?.length);
      return [{ moment, section, index: all.indexOf(section), books }];
    });
    return { total: all.length, dots };
  }, [harmony, apostle]);
  if (!layout) return <div className="lg-figure" style={{ minHeight: 180 }} />;
  const unplaced = apostle.moments.filter((m) => !layout.dots.some((d) => d.moment === m));
  return <figure>
    <div className="lg-figure pp-gospels">
      <div className="pp-gstrip" role="list" aria-label={`${apostle.name} in the Gospels, in the order of the harmony`}>
        {GOSPELS.map(([code, name]) => <div key={code} className="pp-grow">
          <span className="pp-grow-label">{name}</span>
          <div className="pp-grow-track">
            {layout.dots.filter((d) => d.books.includes(code)).map((d) => <Link key={`${code}-${d.section.n}-${d.moment.label}`} role="listitem" to={harmonyHref(d.section.n)} className="pp-gdot"
              data-on={tip === d ? "" : undefined} style={{ left: `${((d.index + 0.5) / layout.total) * 100}%` }} aria-label={`${d.moment.label}, in ${name}: open in the Gospel harmony`}
              onMouseEnter={() => setTip(d)} onMouseLeave={() => setTip(null)} onFocus={() => setTip(d)} onBlur={() => setTip(null)} />)}
          </div>
        </div>)}
      </div>
    </div>
    <div className="lg-tip" aria-live="polite">{tip ? <><strong>{tip.moment.label}</strong> <span className="lg-muted">· harmony event {tip.section.n}: {tip.section.title}</span><Refs refs={tip.moment.refs} /></>
      : <span className="lg-muted">Each dot is an event in which he is named, in the order of the harmony's {layout.total} events. Choose one to open it.</span>}</div>
    {unplaced.length > 0 && <p className="lg-caption">Also: {unplaced.map((m, i) => <span key={m.label}>{i > 0 && " · "}{m.label}<Refs refs={m.refs} limit={2} /></span>)}</p>}
  </figure>;
}

const LIST_BOOKS = [["MAT", "Matthew 10"], ["MRK", "Mark 3"], ["LUK", "Luke 6"], ["ACT", "Acts 1"]] as const;

/**
 * The four lists of the Twelve side by side, each name at its place, with a ribbon joining each man across them. With
 * `highlight`, his ribbon glows and the rest stay faint; without, pointing at a name lights its ribbon.
 */
export function ListsOfTwelve({ highlight }: { highlight?: string }) {
  const [hover, setHover] = useState<string | undefined>();
  const listed = PEOPLE_PAGES.apostles.filter((a) => a.lists?.length);
  if (!listed.length) return <p className="lg-muted">The lists of the Twelve are still being prepared.</p>;
  const W = 1000, ROW = 30, TOP = 46;
  const colX = (i: number) => 125 + i * 250;
  const yOf = (pos: number) => TOP + (pos - 1) * ROW;
  const lit = hover ?? highlight;
  const height = TOP + 12 * ROW;
  const ribbon = (a: ApostleSummary) => {
    const points = LIST_BOOKS.map(([book], i) => { const entry = a.lists?.find((l) => l.book === book); return entry ? [colX(i), yOf(entry.position)] as const : null; });
    let d = "";
    points.forEach((p, i) => {
      if (!p) return;
      const prev = points.slice(0, i).reverse().find(Boolean);
      d += prev ? ` C${prev[0] + 110} ${prev[1]} ${p[0] - 110} ${p[1]} ${p[0]} ${p[1]}` : `M${p[0]} ${p[1]}`;
    });
    return d;
  };
  return <figure>
    <div className="lg-figure pp-lists">
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label="The four lists of the Twelve: Matthew 10, Mark 3, Luke 6 and Acts 1">
        {LIST_BOOKS.map(([, label], i) => <text key={label} x={colX(i)} y={18} textAnchor="middle" className="lg-svg-strong">{label}</text>)}
        {listed.map((a) => <path key={a.id} d={ribbon(a)} fill="none" stroke={lit === a.id ? "var(--lg)" : "var(--lg-line)"} strokeWidth={lit === a.id ? 3 : 1.4} opacity={lit && lit !== a.id ? 0.45 : 1} className={lit === a.id ? "lg-glow" : undefined} />)}
        {/* Judas Iscariot has no page; his place at the end of the first three lists is kept, dashed. */}
        {LIST_BOOKS.slice(0, 3).map(([book], i) => !listed.some((a) => a.lists?.some((l) => l.book === book && l.position === 12)) && <text key={`judas-${book}`} x={colX(i)} y={yOf(12) + 4} textAnchor="middle" className="lg-svg-text" style={{ textDecoration: "underline dashed", opacity: 0.6 }}>Judas Iscariot</text>)}
        {listed.flatMap((a) => (a.lists ?? []).map((entry) => {
          const i = LIST_BOOKS.findIndex(([book]) => book === entry.book);
          if (i < 0) return null;
          const on = lit === a.id;
          return <text key={`${a.id}-${entry.book}`} x={colX(i)} y={yOf(entry.position) + 4} textAnchor="middle" className={on ? "lg-svg-strong" : "lg-svg-text"}
            style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 5, cursor: "default", fill: on ? "var(--lg)" : undefined }}
            onMouseEnter={() => setHover(a.id)} onMouseLeave={() => setHover(undefined)}>{entry.name.length > 26 ? `${entry.name.slice(0, 24)}…` : entry.name}</text>;
        }))}
      </svg>
    </div>
    <figcaption className="lg-caption">Each list names twelve; Acts 1 names eleven, after Judas. The names are as each list gives them. Peter is first in every list.</figcaption>
  </figure>;
}
