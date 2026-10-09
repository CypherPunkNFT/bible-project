import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { PERIOD_TONE, personHref, plural, refText, ROMAN } from "./data";
import { useSheet } from "./sheet";
import { Tip } from "./tip";
import type { Apostle, Entry, Place } from "./types";
import { ClaimFoot, Marked, RefLink, SecHead } from "./ui";

/**
 * 03 · Who was with him? Two views in one section, so the page does not grow: "Lines" (his records in story order, each
 * companion a line that lights where a verse of that record names them) and "Everyone around him" (he is at the centre,
 * with rings of people, places and records; choosing a point draws what joins it to the rest).
 */
type Now = { kind: "entry"; e: Entry } | { kind: "person"; key: string } | { kind: "place"; p: Place } | { kind: "centre" };

function Lines({ d, row, onEntry, onRow }: { d: Apostle; row: string | null; onEntry: (e: Entry) => void; onRow: (key: string | null) => void }) {
  const cols = d.scripture, scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hot, setHot] = useState(() => Math.max(0, cols.findIndex((e) => Object.keys(e.with).length > 2)));
  const [kept, setKept] = useState<number | null>(null);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([en]) => setWidth(Math.round(en.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const groups = ([["The Twelve", d.rows.filter((r) => r.twelve)], ["Others named with him", d.rows.filter((r) => !r.twelve)]] as const).filter(([, rs]) => rs.length);
  const W = Math.max(width, 720), left = 170, right = 10, top = 46, rowH = 19, gapH = 26, step = (W - left - right) / Math.max(1, cols.length), X = (i: number) => left + step * (i + 0.5);
  const o: ReactNode[] = [];
  d.periods.slice(0, 3).forEach((p, pi) => {
    const idx = cols.map((e, i) => (e.period === pi + 1 ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) return;
    const x0 = left + step * idx[0], x1 = left + step * (idx[idx.length - 1] + 1);
    o.push(<rect key={`b${pi}`} className={`band${pi % 2 ? " alt" : ""}`} x={x0} y={top - 6} width={x1 - x0} height="100%" />,
      <text key={`bt${pi}`} className="band-t" x={x0 + 6} y={top - 16} style={{ fill: PERIOD_TONE[pi + 1] }}>{x1 - x0 > p.title.length * 7.5 + 40 ? `${p.n} · ${p.title}` : p.n}</text>);
  });
  let y = top + 6;
  o.push(<text key="me" className="rl me" x={0} y={y + 4}>{d.short}</text>, ...cols.map((e, i) => <circle key={`me${i}`} className="me-dot" cx={X(i)} cy={y} r={3.2} style={{ fill: PERIOD_TONE[e.period] }} />));
  y += rowH + 8;
  for (const [label, rows] of groups) {
    o.push(<text key={label} className="gl" x={0} y={y + 2}>{label.toUpperCase()}</text>); y += gapH - 8;
    for (const r of rows) {
      const hits = cols.map((e, i) => (e.with[r.key] ? i : -1)).filter((i) => i >= 0), yy = y;
      o.push(<g key={r.key} className={`row${row === r.key ? " on" : ""}`}><rect className="row-hit" x={0} y={yy - rowH / 2} width={W} height={rowH} />
        <text className="rl" x={0} y={yy + 4} onClick={() => onRow(row === r.key ? null : r.key)}>{r.name}</text>
        {hits.length > 1 && <line className="span" x1={X(hits[0])} x2={X(hits[hits.length - 1])} y1={yy} y2={yy} />}
        {hits.map((i) => <circle key={i} className="hitdot" cx={X(i)} cy={yy} r={3.8} />)}</g>);
      y += rowH;
    }
    y += 8;
  }
  const H = y + 6;
  const pick = (i: number) => { if (kept === null && i !== hot) { setHot(i); onEntry(cols[i]); } };
  const keep = (i: number) => { if (kept === i) { setKept(null); return; } setKept(i); setHot(i); onEntry(cols[i]); };
  const tip = (e: ReactPointerEvent, en: Entry) => {
    const names = Object.keys(en.with).map((k) => d.rowByKey[k]?.name).filter(Boolean);
    Tip.show({ title: en.title, lines: [`${en.refs[0] ? refText(en.refs[0]) : ""}${names.length ? ` · with ${names.slice(0, 4).join(", ")}${names.length > 4 ? "…" : ""}` : ""}`] }, e.clientX, e.clientY);
  };
  return <>
    <div className="a-chart-scroll" ref={scroller}><div className="a-chart" onPointerLeave={() => Tip.hide()}>{width > 0 && <svg className="a-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <g className="hl">{hot >= 0 && <rect className={`col-on${kept === hot ? " kept" : ""}`} x={left + step * hot} y={top - 6} width={step} height="100%" />}</g>
      {o}
      {cols.map((en, i) => <rect key={`c${i}`} className="colhit" x={left + step * i} y={top - 6} width={step} height={H - top} onPointerMove={(e) => { pick(i); tip(e, en); }} onClick={() => keep(i)} />)}
    </svg>}</div></div>
    <p className="a-key"><span><i className="k-dot" />named in the passage</span><span><i className="k-line" />from first to last mention</span><span>Point at a column to see what happens; click it to keep it (click again to let go); choose a name to follow that person.</span></p>
  </>;
}

const RINGS: [string, string, number][] = [["people", "People", 0.4], ["places", "Places", 0.62], ["moments", "Records", 0.86]];
interface Node { i: number; ring: string; label: string; e?: Entry; r?: Apostle["rows"][number]; p?: Place; k: number; n: number; x: number; y: number; a: number }

function Circle({ d, onNow }: { d: Apostle; onNow: (now: Now) => void }) {
  const [sel, setSel] = useState(0);
  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [], links: [number, number][] = [];
    const add = (n: Omit<Node, "i" | "x" | "y" | "a">) => { const node = { ...n, i: nodes.length, x: 0, y: 0, a: 0 }; nodes.push(node); return node; };
    add({ ring: "centre", label: d.short, k: 0, n: 1 });
    const moments = d.scripture.filter((e) => e.type !== "fact"), mNode: Record<string, Node> = {};
    moments.forEach((e, k) => { mNode[e.key] = add({ ring: "moments", label: e.title, e, k, n: moments.length }); });
    const people = d.rows.slice().sort((a, b) => moments.findIndex((e) => e.with[a.key]) - moments.findIndex((e) => e.with[b.key]));
    people.forEach((r, k) => { const n = add({ ring: "people", label: r.name, r, k, n: people.length }); moments.forEach((e) => { if (e.with[r.key]) links.push([n.i, mNode[e.key].i]); }); links.push([0, n.i]); });
    const places = d.places.filter((p) => p.entries.some((k) => mNode[k]) || p.tradition);
    places.forEach((p, k) => { const n = add({ ring: "places", label: p.name.replace(/\s*\(.*\)$/, ""), p, k, n: places.length }); p.entries.forEach((key) => { if (mNode[key]) links.push([n.i, mNode[key].i]); }); });
    const C = 380, R = 380 - 24;
    for (const n of nodes) {
      if (n.ring === "centre") { n.x = C; n.y = C; continue; }
      const r = R * RINGS.find(([k]) => k === n.ring)![2], a = -Math.PI / 2 + (n.k / n.n) * Math.PI * 2 + (n.ring === "people" ? 0.2 : n.ring === "places" ? 0.45 : 0);
      n.x = C + Math.cos(a) * r; n.y = C + Math.sin(a) * r; n.a = a;
    }
    return { nodes, links };
  }, [d]);
  const S = 760, C = S / 2, R = S / 2 - 24;
  const lit = new Set(links.filter(([a, b]) => a === sel || b === sel).map(([a, b]) => (a === sel ? b : a)));
  const choose = (i: number) => {
    setSel(i);
    const n = nodes[i];
    onNow(n.ring === "centre" ? { kind: "centre" } : n.ring === "people" ? { kind: "person", key: n.r!.key } : n.ring === "places" ? { kind: "place", p: n.p! } : { kind: "entry", e: n.e! });
  };
  return <div className="sky"><div className="sky-art" onPointerLeave={() => Tip.hide()}>
    <svg viewBox={`-150 -10 ${S + 300} ${S + 20}`} role="img" aria-label={`${d.short} and everyone around him`}>
      <g className="rings">{RINGS.map(([k, l, f]) => <g key={k}><circle cx={C} cy={C} r={R * f} /><text x={C} y={C - R * f - 6} textAnchor="middle">{l.toUpperCase()}</text></g>)}</g>
      <g className="links">{links.filter(([a, b]) => a === sel || b === sel).map(([a, b]) => {
        const p = nodes[a], q = nodes[b], mx = (p.x + q.x) / 2 + (C - (p.x + q.x) / 2) * 0.35, my = (p.y + q.y) / 2 + (C - (p.y + q.y) / 2) * 0.35;
        return <path key={`${a}-${b}`} d={`M${p.x.toFixed(1)} ${p.y.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`} />;
      })}</g>
      {nodes.map((n) => {
        if (n.ring === "centre") return <g key={0} className={`pt centre${sel === 0 ? " on" : ""}`} onClick={() => choose(0)}><circle cx={C} cy={C} r={38} /><text x={C} y={C + 5} textAnchor="middle">{d.short}</text></g>;
        const on = n.i === sel, li = lit.has(n.i), dim = sel !== 0 && !on && !li, lab = n.ring !== "moments" || on || li;
        const out = Math.cos(n.a) >= 0, txt = n.label.length > 32 ? n.label.slice(0, 30) + "…" : n.label;
        return <g key={n.i} className={`pt ${n.ring}${on ? " on" : ""}${li ? " lit" : ""}${dim ? " dim" : ""}`} onClick={() => choose(n.i)}
          onPointerMove={(e) => Tip.show({ title: n.label, lines: [RINGS.find(([k]) => k === n.ring)?.[1] ?? ""] }, e.clientX, e.clientY)}>
          {n.ring === "places" ? <rect x={n.x - 4} y={n.y - 4} width={8} height={8} transform={`rotate(45 ${n.x} ${n.y})`} className={n.p?.tradition ? "trad" : undefined} />
            : <circle cx={n.x} cy={n.y} r={n.ring === "people" ? 5.5 : 4} style={n.e ? { "--tone": PERIOD_TONE[n.e.period] } as CSSProperties : undefined} />}
          <circle className="hit" cx={n.x} cy={n.y} r={10} />
          {lab && <text x={(n.x + (out ? 9 : -9)).toFixed(1)} y={(n.y + 4).toFixed(1)} textAnchor={out ? "start" : "end"}>{txt}</text>}
        </g>;
      })}
    </svg></div></div>;
}

function NowPanel({ d, now }: { d: Apostle; now: Now }) {
  const sheet = useSheet();
  if (now.kind === "entry") {
    const e = now.e, names = Object.entries(e.with ?? {});
    return <><p className="kicker">{ROMAN[e.period]} · {d.periods[e.period - 1].title}</p><h3>{e.title}</h3>
      {e.lead && <blockquote><p><Marked text={d.verses[e.lead] ?? ""} names={d.names} /></p><footer><RefLink r={[e.lead, e.lead]} /> · KJV</footer></blockquote>}
      {names.length ? <><p className="kicker">Named with him here</p><ul className="named">{names.map(([k, vs]) => <li key={k}><b>{d.rowByKey[k]?.name ?? k}</b> <RefLink r={[vs[0], vs[0]]} /></li>)}</ul></>
        : <p className="plain-line">No companion is named in these verses.</p>}
      <button type="button" className="a-read" onClick={() => sheet.openEntry(e)}>Read it all</button></>;
  }
  if (now.kind === "person") {
    const r = d.rowByKey[now.key], shared = d.scripture.filter((e) => e.with[now.key]), comp = d.companions.find((c) => c.person.personId === r.id);
    return <><p className="kicker">Named beside him · {plural(shared.length, "record")}</p><h3>{r.name}</h3>
      {comp && <><p className="with-text">{comp.claim.text}</p><ClaimFoot d={d} c={comp.claim} /></>}
      <ol className="with-list">{shared.map((e) => <li key={e.key}><button type="button" onClick={() => sheet.openEntry(e)}><span>{e.title}</span><small>{refText([e.with[now.key][0], e.with[now.key][0]])}</small></button></li>)}</ol>
      <Link className="ref" to={personHref(r.id)}>Open {r.name}'s page</Link></>;
  }
  if (now.kind === "place") {
    const p = now.p;
    return <><p className="kicker">{p.tradition ? "Known from tradition" : "A place in his story"}</p><h3>{p.name}</h3>
      {p.from && <p className="plain-line">{p.from.km.toLocaleString("en-GB")} km {p.from.dir} of Jerusalem</p>}
      {p.note && <p className="with-text">{p.note}</p>}<ClaimFoot d={d} c={{ layer: p.tradition ? "tradition" : "scripture", refs: p.refs }} /></>;
  }
  return <><p className="kicker">The centre</p><h3>{d.name}</h3><p className="with-text">{d.story ?? d.tagline}</p><p className="plain-line">Choose a person, a place or a record on the circle.</p></>;
}

export function WithSection({ d }: { d: Apostle }) {
  const [view, setView] = useState<"lines" | "circle">("lines");
  const [row, setRow] = useState<string | null>(null);
  const [now, setNow] = useState<Now>(() => { const cols = d.scripture; return { kind: "entry", e: cols[Math.max(0, cols.findIndex((e) => Object.keys(e.with).length > 2))] }; });
  const tone = now.kind === "entry" ? PERIOD_TONE[now.e.period] : now.kind === "place" && now.p.tradition ? "var(--muted)" : "var(--accent)";
  const show = (v: "lines" | "circle") => {
    if (v === view) return;
    Tip.hide(); setView(v); setRow(null);
    const cols = d.scripture;
    setNow(v === "circle" ? { kind: "centre" } : { kind: "entry", e: cols[Math.max(0, cols.findIndex((e) => Object.keys(e.with).length > 2))] });
  };
  return <section className="sec" data-sec="with" data-view={view}>
    <SecHead num="03" kicker="The people around him" title="Who was " em="with him?"
      sub={`Every record of ${d.short} in Scripture, in story order${d.key === "paul" ? " (Acts as told, with the Lord's words to him where Acts or his letter sets them)" : " (the Gospels in the order of Robertson's harmony, then Acts and the letters)"}. A person counts as "with him" only where a verse of that record names them both. ${plural(d.rows.length, "person", "people")} in all.`} />
    <div className="with-tools"><div className="seg" role="group" aria-label="View">
      <button type="button" aria-pressed={view === "lines"} onClick={() => show("lines")}>Lines</button>
      <button type="button" aria-pressed={view === "circle"} onClick={() => show("circle")}>Everyone around him</button></div></div>
    <div className="with-body">
      <div className="with-view">{view === "lines"
        ? <Lines d={d} row={row} onEntry={(e) => setNow({ kind: "entry", e })} onRow={(key) => { setRow(key); if (key) setNow({ kind: "person", key }); }} />
        : <Circle d={d} onNow={setNow} />}</div>
      <aside className="with-now" aria-live="polite" style={{ "--tone": tone } as CSSProperties}><NowPanel d={d} now={now} /></aside>
    </div>
  </section>;
}
