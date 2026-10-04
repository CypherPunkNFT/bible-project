import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { groupOf, VERSION_GROUPS } from "@/lib/languages";
import type { Translation } from "@/lib/types";

const GROUP_COLOR: Record<string, string> = { english: "var(--history)", original: "var(--prophets)", translations: "var(--gospels)" };
const START = 1350;
const END = 2030;
const WIDTH = 1000;
const PAD = 64;
const x = (year: number) => PAD + (year - START) / (END - START) * (WIDTH - PAD * 2);

export function VersionsTimeline() {
  const catalog = useCatalog();
  const [group, setGroup] = useState("");
  const [mode, setMode] = useState(() => window.matchMedia("(max-width: 767px)").matches ? "list" : "timeline");
  const sorted = useMemo(() => catalog.translations.filter((t) => !group || groupOf(t.lang).id === group).sort((a, b) => a.year - b.year), [catalog.translations, group]);
  const early = sorted.filter((t) => t.year < START);
  const rows: Translation[][] = [];
  // Reserve the full badge width, rather than a fixed number of years, to avoid overlapping labels.
  for (const translation of sorted.filter((t) => t.year >= START)) {
    const row = rows.find((r) => x(translation.year) - x(r[r.length - 1].year) >= 112);
    if (row) row.push(translation);
    else rows.push([translation]);
  }
  const reader = (t: Translation) => {
    const book = Object.keys(t.books)[0];
    return "/read/" + t.slug + "/" + book + "/" + t.books[book][0];
  };

  return <div>
    <div className="chart-controls">
      <div role="group" aria-label="Timeline display" className="inline-flex rounded-full bg-surface-2 p-0.5">
        {["timeline", "list"].map((value) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)} className={"rounded-full px-3 py-1.5 capitalize " + (mode === value ? "bg-ink text-page" : "text-muted")}>{value === "list" ? "Chronological list" : "Timeline"}</button>)}
      </div>
      <label>Versions<select value={group} onChange={(event) => setGroup(event.target.value)}><option value="">All groups</option>{VERSION_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></label>
      <span className="chart-hint">{sorted.length} editions</span>
    </div>
    {mode === "timeline" ? <>
      <div className="slim-scroll relative overflow-x-auto rounded-lg border border-line bg-page py-4" tabIndex={0} role="region" aria-label="Edition timeline; scroll horizontally on smaller screens">
        <div className="relative" style={{ width: WIDTH, height: rows.length * 38 + 40 }}>
          {[1400, 1500, 1600, 1700, 1800, 1900, 2000].map((year) => <div key={year} className="absolute bottom-0 top-0 border-l border-dashed border-line" style={{ left: x(year) }}><span className="absolute bottom-0 -translate-x-1/2 text-[11px] text-muted">{year}</span></div>)}
          {rows.map((row, i) => row.map((t) => <Link key={t.slug} to={reader(t)} aria-label={t.name + " (" + t.year + "). Read this version."} title={t.name}
            className="absolute flex w-[104px] -translate-x-1/2 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1.5 text-xs shadow-sm transition-colors hover:border-ink hover:z-10 focus-visible:z-10"
            style={{ left: x(t.year), top: i * 38 + 4 }}><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: GROUP_COLOR[groupOf(t.lang).id] }} /><strong>{t.abbr}</strong><span className="text-muted">{t.year}</span></Link>))}
        </div>
      </div>
      {early.map((t) => <p key={t.slug} className="chart-hint mt-3">Earlier than this axis: <Link className="underline" to={reader(t)}>{t.name} · {t.year} AD</Link></p>)}
    </> : <ol className="timeline-editions">{sorted.map((t) => <li key={t.slug}><Link to={reader(t)}><span className="timeline-year" style={{ color: GROUP_COLOR[groupOf(t.lang).id] }}>{t.year}</span><span><strong>{t.abbr}</strong><small>{t.name}</small></span><span aria-hidden="true">↗</span></Link></li>)}</ol>}
    <div className="chart-legend">{VERSION_GROUPS.map((g) => <span key={g.id}><i style={{ background: GROUP_COLOR[g.id] }} />{g.title}</span>)}</div>
  </div>;
}
