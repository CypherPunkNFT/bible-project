// 05 · Where the site names them (approved mock-up: design/scholars-directions/scholars/named.js): scholars (rows) ×
// site areas (columns), shaded by how often each is named in that area compared with the most-named scholar there. No
// counts are shown; the match is a rough text search. Two sort orders slide the rows into place (transforms only);
// those never named are listed as chips underneath. Every name opens the shared profile.
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type SyntheticEvent } from "react";
import { ScholarSectionHead as SectionHead } from "./SectionHead";
import { reducedMotion } from "./marks/dom";
import { useScholars } from "./context";
import { AREAS, areaPhrase, buildHeat, type SortKey } from "./named/model";
import { Row } from "./named/Row";
import "./Named.css";

interface Tip { id: string; col: number; name: string; text: string; x: number; y: number }

function HeadRow({ hotCol }: { hotCol: number }) {
  return <div className="nmd-hrow"><span />{AREAS.map(([area, tone], i) =>
    <span key={area} className={hotCol === i + 1 ? "nmd-hot" : undefined} style={{ "--tone": `var(${tone})` } as CSSProperties}>{area}</span>)}</div>;
}

export function Named() {
  const { data, openProfile } = useScholars();
  const heat = useMemo(() => buildHeat(data.scholars), [data]);
  const weights = useMemo(() => new Map(heat.named.map((s) => [s.id, AREAS.map(([a]) => heat.weight(s, a))])), [heat]);
  const [limit, setLimit] = useState(96);
  const [sort, setSort] = useState<SortKey>("era");
  // The tip keeps its last words while it fades out; `on` says whether it is showing.
  const [tipState, setTipState] = useState<{ tip: Tip | null; on: boolean }>({ tip: null, on: false });
  const tip = tipState.on ? tipState.tip : null;
  const hide = () => setTipState((t) => (t.on ? { ...t, on: false } : t));
  const gridRef = useRef<HTMLDivElement>(null), listRef = useRef<HTMLOListElement>(null);
  const before = useRef<Map<string, DOMRect> | null>(null);

  const rowsNow = () => [...(listRef.current?.querySelectorAll<HTMLLIElement>("li[data-id]") ?? [])];
  const choose = (key: SortKey) => {
    if (key === sort) return;
    if (!reducedMotion()) before.current = new Map(rowsNow().map((li) => [li.dataset.id ?? "", li.getBoundingClientRect()]));
    setSort(key); setLimit(96); if(gridRef.current)gridRef.current.scrollTop=0;
  };
  // Re-sorted rows slide from where they were to where they land (FLIP, transforms only).
  useLayoutEffect(() => {
    const was = before.current;
    before.current = null;
    if (!was) return;
    const rows = rowsNow();
    for (const li of rows) {
      const a = was.get(li.dataset.id ?? ""), b = li.getBoundingClientRect();
      if (!a || (a.left === b.left && a.top === b.top)) continue;
      li.style.transition = "none";
      li.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    }
    listRef.current?.getBoundingClientRect();
    const frame = requestAnimationFrame(() => rows.forEach((li) => { li.style.transition = ""; li.style.transform = ""; }));
    return () => cancelAnimationFrame(frame);
  }, [sort]);

  const onPointerOver = (event: PointerEvent) => {
    const cell = (event.target as Element).closest<HTMLElement>(".nmd-cell"), grid = gridRef.current;
    const id = cell?.closest<HTMLElement>("li")?.dataset.id, area = cell?.dataset.area;
    if (!cell || !grid || !id || !area) { hide(); return; }
    const col = Number(cell.dataset.col);
    if (tip?.id === id && tip.col === col) return;
    const s = heat.named.find((x) => x.id === id);
    if (!s) return;
    const g = grid.getBoundingClientRect(), c = cell.getBoundingClientRect();
    setTipState({ on: true, tip: { id, col, name: s.name, text: `${s.mentions[area] ?? 0} distinct content pages in ${areaPhrase(area)}`,
      x: Math.min(Math.max(c.left + c.width / 2 - g.left, 90), g.width - 90), y: c.top - g.top - 8 + grid.scrollTop } });
  };
  const onClick = (event: SyntheticEvent) => {
    const hit = (event.target as Element).closest<HTMLElement>("[data-scholar]");
    if (hit?.dataset.scholar) { const credit=heat.named.find(s=>s.id===hit.dataset.scholar); if(credit?.profile)openProfile(credit.profile.id,hit); else if(credit)window.open(credit.records[0].url,"_blank","noopener,noreferrer"); else openProfile(hit.dataset.scholar,hit); }
  };

  return <div onClick={onClick}>
    <SectionHead section="named" kicker="In the site's own pages" title={<>Where the site <em>names them</em></>}
      line="Darker squares mean more distinct content pages credit that name. All recorded source credits are included, with initials and joint credits retained. Hover for the page count or follow a square to a linked page. Names open profiles where documented, otherwise their recorded source." />
    <div className="nmd-tools" role="group" aria-label="Sort the grid">
      <span>Sort</span>
      <button type="button" aria-pressed={sort === "era"} onClick={() => choose("era")}>By era</button>
      <button type="button" aria-pressed={sort === "wide"} onClick={() => choose("wide")}>By how widely named</button>
    </div>
    <div ref={gridRef} className="nmd-grid" role="region" aria-label="Source credit grid" tabIndex={0} onScroll={e=>{const el=e.currentTarget;if(el.scrollTop>=(el.scrollHeight-el.clientHeight)*.4)setLimit(n=>Math.min(n+96,heat.named.length));}} onPointerOver={onPointerOver} onPointerLeave={hide}>
      <div className="nmd-heads"><HeadRow hotCol={tip?.col ?? 0} /><HeadRow hotCol={tip?.col ?? 0} /></div>
      <ol ref={listRef} className="nmd-rows">
        {heat.sorted(sort).slice(0,limit).map((s) => <Row key={s.id} scholar={s} weights={weights.get(s.id) ?? []} hot={tip?.id === s.id} />)}
      </ol>
      <div className={`nmd-tip${tip ? " nmd-tip-on" : ""}`} aria-hidden="true"
        style={tipState.tip ? { transform: `translate(${tipState.tip.x}px, ${tipState.tip.y}px) translate(-50%, -100%)` } : undefined}>
        <b>{tipState.tip?.name}</b><span>{tipState.tip?.text}</span>
      </div>
    </div>
    <p className="num-explain">{heat.named.length} recorded credits, not unique people. Topics includes harmony and miracles; People includes apostles and prophets. Coverage is registered citations, bibliographies and verified feature inputs, not all incidental name mentions. Unknown dates sort after documented dates.</p>
    <p className="nmd-unnamed"><span>Profiles without a matched credit in this source index:</span>
      {heat.unnamed.map((s) => <button key={s.id} type="button" data-scholar={s.id}>{s.short}</button>)}</p>
  </div>;
}
