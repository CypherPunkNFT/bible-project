// 05 · Where the site names them (approved mock-up: design/scholars-directions/scholars/named.js): scholars (rows) ×
// site areas (columns), shaded by how often each is named in that area compared with the most-named scholar there. No
// counts are shown; the match is a rough text search. Two sort orders slide the rows into place (transforms only);
// those never named are listed as chips underneath. Every name opens the shared profile.
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type SyntheticEvent } from "react";
import { SectionHead } from "../shared/Frame";
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
    setSort(key);
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
    const s = data.scholars.find((x) => x.id === id);
    if (!s) return;
    const g = grid.getBoundingClientRect(), c = cell.getBoundingClientRect();
    setTipState({ on: true, tip: { id, col, name: s.name, text: `${s.mentions[area] ? "Named" : "Not named"} in ${areaPhrase(area)}`,
      x: Math.min(Math.max(c.left + c.width / 2 - g.left, 90), g.width - 90), y: c.top - g.top - 8 } });
  };
  const onClick = (event: SyntheticEvent) => {
    const hit = (event.target as Element).closest<HTMLElement>("[data-scholar]");
    if (hit?.dataset.scholar) openProfile(hit.dataset.scholar, hit);
  };

  return <div onClick={onClick}>
    <SectionHead num="05" kicker="In the site's own pages" title={<>Where the site <em>names them</em></>}
      line="Darker squares mean a scholar is named more often in that part of the site, compared with the other scholars. Point at a square to read it; click a name to meet them." />
    <div className="nmd-tools" role="group" aria-label="Sort the grid">
      <span>Sort</span>
      <button type="button" aria-pressed={sort === "era"} onClick={() => choose("era")}>By era</button>
      <button type="button" aria-pressed={sort === "wide"} onClick={() => choose("wide")}>By how widely named</button>
    </div>
    <div ref={gridRef} className="nmd-grid" onPointerOver={onPointerOver} onPointerLeave={hide}>
      <div className="nmd-heads"><HeadRow hotCol={tip?.col ?? 0} /><HeadRow hotCol={tip?.col ?? 0} /></div>
      <ol ref={listRef} className="nmd-rows">
        {heat.sorted(sort).map((s) => <Row key={s.id} scholar={s} weights={weights.get(s.id) ?? []} hot={tip?.id === s.id} />)}
      </ol>
      <div className={`nmd-tip${tip ? " nmd-tip-on" : ""}`} aria-hidden="true"
        style={tipState.tip ? { transform: `translate(${tipState.tip.x}px, ${tipState.tip.y}px) translate(-50%, -100%)` } : undefined}>
        <b>{tipState.tip?.name}</b><span>{tipState.tip?.text}</span>
      </div>
    </div>
    <p className="nmd-unnamed"><span>Not named in the site's pages yet:</span>
      {heat.unnamed.map((s) => <button key={s.id} type="button" data-scholar={s.id}>{s.short}</button>)}</p>
  </div>;
}
