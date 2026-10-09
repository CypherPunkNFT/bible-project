import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { BOOK_TONE, bookCode, chapterOf, PERIOD_TONE, plural, refText, whenShort } from "./data";
import { useSheet } from "./sheet";
import { Tip } from "./tip";
import type { Apostle, Entry } from "./types";
import { Icon, Marked, RefLink, SecHead } from "./ui";

/** 01 · How much does Scripture tell? (the record ring) and 02 · Where is he named? (the chapter grid). */

const TAU = Math.PI * 2;
const pt = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
const arcD = (cx: number, cy: number, r: number, a0: number, a1: number) => { const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };

/** The four parts of a life (before the call, with Jesus or the call, the church in Acts, after Scripture). Scripture
 *  gives no years, so each arc's length follows its number of records, with a floor so a near-empty part still shows. */
function layout(d: Apostle) {
  const counts = d.periods.map((p) => p.entries.length), weights = counts.map((n) => Math.max(n, 4));
  const total = weights.reduce((a, b) => a + b, 0), gap = 0.05;
  let a = -Math.PI / 2 + gap / 2;
  return d.periods.map((p, i) => { const span = (TAU - gap * 4) * (weights[i] / total), seg = { i, p, a0: a, a1: a + span, n: counts[i] }; a += span + gap; return seg; });
}

function Ring({ d, sel, onPick }: { d: Apostle; sel: number; onPick: (period: number, entry?: Entry) => void }) {
  const size = 640, k = size / 440, cx = size / 2, cy = size / 2, r = size * 0.4, w = Math.max(8, size * 0.03), segs = layout(d), s = segs[sel - 1];
  const tipFor = (e: ReactPointerEvent, en: Entry) => Tip.show({ title: en.title, lines: [en.type === "trad" ? whenShort(en.when) : en.refs[0] ? refText(en.refs[0]) : ""] }, e.clientX, e.clientY);
  // A label at the ring's side: the numeral, then the title on two lines balanced by words ("THE CHURCH" / "IN ACTS"),
  // so it stays narrow and the ring can take the room. Labels above and below the ring keep one line.
  const sideLines = (n: string, title: string): string[] => {
    const words = title.toUpperCase().split(" "), cut = Math.floor(words.length / 2);
    return words.length < 2 ? [n, words[0]] : [n, words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
  };
  const isSide = (mid: number) => Math.abs(Math.cos(mid)) > 0.25;
  // Enough room beside the ring for the widest side label (about 9.6 drawing units a letter at the labels' size).
  const widest = Math.max(0, ...segs.filter((g) => isSide((g.a0 + g.a1) / 2)).flatMap((g) => sideLines(g.p.n, g.p.title)).map((l) => l.length));
  const pad = Math.max(size * 0.04, widest * 9.6 - size * 0.046 + 14), padY = size * 0.07;
  const lowest = Math.max(cy + r + w * 0.68, ...segs.map((g) => (g.a0 + g.a1) / 2).filter((mid) => !isSide(mid) && Math.sin(mid) > 0)
    .map((mid) => cy + (r + w * 1.8 + 8) * Math.sin(mid) + 6));
  const below = (size + padY - lowest) / (size + padY * 2); // share of the drawing's height under its lowest line
  const centre = (padY + cy) / (size + padY * 2); // where the circle's centre sits, as a share of the height
  return <svg className="ring" data-below={below.toFixed(4)} data-centre={centre.toFixed(4)} viewBox={`${-pad} ${-padY} ${size + pad * 2} ${size + padY * 2}`} role="img" aria-label={`${d.short}'s life in four parts`} onPointerLeave={() => Tip.hide()}>
    <circle className="ring-track" cx={cx} cy={cy} r={r} />
    {segs.map((g) => {
      const on = g.i + 1 === sel, trad = g.i === 3, tone = { "--tone": PERIOD_TONE[g.i + 1] } as CSSProperties;
      const mid = (g.a0 + g.a1) / 2, [lx, ly] = pt(cx, cy, r + w * 1.8 + 8, mid), [tx0, ty0] = pt(cx, cy, r - w * 1.4, g.a0 - 0.025), [tx1, ty1] = pt(cx, cy, r + w * 1.4, g.a0 - 0.025);
      return <g key={g.i}>
        <path className={`ring-arc${trad ? " trad" : ""}${on ? " on" : ""}`} style={tone} strokeWidth={on ? w * 1.35 : w} d={arcD(cx, cy, r, g.a0, g.a1)} />
        <path className="ring-hit" strokeWidth={w * 3} d={arcD(cx, cy, r, g.a0, g.a1)} onClick={() => onPick(g.i + 1)}><title>{`${g.p.n} · ${g.p.title}: ${plural(g.n, "record")}`}</title></path>
        {g.p.entries.map((key, k) => {
          const t = g.n === 1 ? 0.5 : (k + 0.5) / g.n, [x, y] = pt(cx, cy, r, g.a0 + (g.a1 - g.a0) * t), en = d.byKey[key];
          return <circle key={key} className={`bead${trad ? " trad" : ""}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={Math.max(2.4, w * 0.26).toFixed(1)} style={tone}
            onClick={() => onPick(g.i + 1, en)} onPointerMove={(e) => tipFor(e, en)} />;
        })}
        <path className="ring-tick" d={`M${tx0.toFixed(1)} ${ty0.toFixed(1)}L${tx1.toFixed(1)} ${ty1.toFixed(1)}`} />
        {(() => {
          const side = isSide(mid), anchor = Math.cos(mid) > 0.25 ? "start" : Math.cos(mid) < -0.25 ? "end" : "middle";
          const lines = side ? sideLines(g.p.n, g.p.title) : [`${g.p.n} · ${g.p.title.toUpperCase()}`];
          return <text className={`ring-label${on ? " on" : ""}`} x={lx.toFixed(1)} y={(ly + 4 - (lines.length - 1) * 6.5).toFixed(1)} textAnchor={anchor} style={tone} onClick={() => onPick(g.i + 1)}>
            {lines.map((line, j) => <tspan key={j} x={lx.toFixed(1)} dy={j ? "1.25em" : undefined}>{line}</tspan>)}</text>;
        })()}
      </g>;
    })}
    <text className="ring-num" x={cx} y={cy + size * 0.02} textAnchor="middle" style={{ fontSize: 76 * k }}>{s.n}</text>
    <text className="ring-cap" x={cx} y={cy + size * 0.085} textAnchor="middle" style={{ fontSize: 9.5 * k }}>{s.i === 3 ? (s.n === 1 ? "SOURCE OUTSIDE SCRIPTURE" : "SOURCES OUTSIDE SCRIPTURE") : s.n === 1 ? "RECORD IN SCRIPTURE" : "RECORDS IN SCRIPTURE"}</text>
    <text className="ring-sub" x={cx} y={cy - size * 0.145} textAnchor="middle" style={{ fontSize: 15 * k }}>{`${s.p.n} · ${s.p.title}`}</text>
  </svg>;
}

/** 01 · The ring, with the chosen part's records beside it. */
export function RingSection({ d }: { d: Apostle }) {
  const sheet = useSheet();
  const [sel, setSel] = useState(() => d.periods.slice(0, 3).reduce((best, p, i) => (p.entries.length > d.periods[best].entries.length ? i : best), 0) + 1);
  const told = d.scripture.filter((e) => e.type !== "fact").length;
  const p = d.periods[sel - 1], ents = p.entries.map((k) => d.byKey[k]);
  // Beside the ring (wide screens): a short list (six or fewer) sits centred on the circle; a longer one ends level
  // with the lowest line of the drawing ("II · WITH JESUS"), rising as high as the section's heading before it needs to
  // scroll (only the longest, like Peter's or John's, do). Measured from the drawing; kept in step as it resizes.
  const art = useRef<HTMLDivElement>(null), list = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ top: number; max: number } | null>(null);
  const short = ents.length <= 6;
  useLayoutEffect(() => {
    const svg = art.current?.querySelector("svg"), el = list.current, grid = el?.parentElement, head = grid?.parentElement?.querySelector(".sec-head");
    if (!svg || !el || !grid || !head) return;
    const measure = () => {
      if (!matchMedia("(min-width: 1100px)").matches) return setFit(null);
      const s = svg.getBoundingClientRect(), g = grid.getBoundingClientRect(), ceiling = head.getBoundingClientRect().top;
      const lowest = s.top + s.height * (1 - Number(svg.dataset.below ?? 0)), centre = s.top + s.height * Number(svg.dataset.centre ?? 0.5);
      const max = Math.max(160, lowest - ceiling), natural = Math.min(el.scrollHeight, max);
      const top = short ? centre - natural / 2 : lowest - natural;
      setFit((was) => (was && Math.abs(was.top - (top - g.top)) < 1 && Math.abs(was.max - max) < 1 ? was : { top: top - g.top, max }));
    };
    const watch = new ResizeObserver(measure);
    watch.observe(svg); if (el.firstElementChild) watch.observe(el); measure();
    return () => watch.disconnect();
  }, [d, sel, short]);
  return <section className="sec" data-sec="ring">
    <SecHead num="01" kicker="His life in four parts" title="How much does Scripture " em="tell?"
      sub={`${d.tagline} Scripture gives no years for his life, so the ring is divided by how much is recorded: ${plural(told, "record")} of what he did or what was said to him, one bead each. The last part is tradition and is drawn dashed. Choose a part to read it.`} />
    <div className="a-ring">
      <div className="a-ring-art" ref={art}><Ring d={d} sel={sel} onPick={(period, entry) => { setSel(period); if (entry) sheet.openEntry(entry); }} /></div>
      <div ref={list} className="a-ring-list slim-scroll" style={{ "--tone": PERIOD_TONE[sel], ...(fit ? { marginTop: fit.top, maxHeight: fit.max } : {}) } as CSSProperties}>
        <p className="kicker">{p.n} · {p.sub}</p><h3>{p.title}</h3>
        {ents.length ? <ol className={`a-recs${sel === 4 ? " trad" : ""}${ents.length > 9 ? " two" : ""}`}>{ents.map((e) => <li key={e.key}>
          <button type="button" onClick={() => sheet.openEntry(e)}><span className="t">{e.title}</span><small>{e.type === "trad" ? whenShort(e.when) : e.refs[0] ? refText(e.refs[0]) : ""}</small></button>
        </li>)}</ol> : <p className="plain-line">{sel === 1 ? "Scripture gives no home, trade or family for him." : "Scripture records nothing here."}</p>}
      </div>
    </div>
  </section>;
}

// ── 02 · The chapter grid ──
const ROWS = ["MAT", "MRK", "LUK", "JHN", "ACT"];
const ROW_NAME: Record<string, string> = { MAT: "Matthew", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts" };
const entriesIn = (d: Apostle, book: number, ch: number) => d.scripture.filter((e) => e.refs.some(([a, b = a]) => { const x = chapterOf(a), y = chapterOf(b); return x.book === book && ch >= x.ch && ch <= y.ch; }));
const sumOf = (o: Record<string, number> = {}) => Object.values(o).reduce((x, y) => x + y, 0);

export function GridSection({ d }: { d: Apostle }) {
  const sheet = useSheet();
  const alt = d.alt[0], heat = d.heat, altHeat = useMemo(() => alt?.heat ?? {}, [alt]);
  const codes = [...new Set([...Object.keys(heat), ...Object.keys(altHeat)])];
  const meta = (c: string) => heat[c] ?? altHeat[c];
  const byNum = (a: string, b: string) => meta(a).num - meta(b).num;
  const gospels = codes.filter((c) => ROWS.includes(c)).sort(byNum), letters = codes.filter((c) => !ROWS.includes(c)).sort(byNum);
  const max = Math.max(1, ...Object.values(heat).flatMap((b) => Object.values(b.counts)), ...Object.values(altHeat).flatMap((b) => Object.values(b.counts)));
  const missing = ROWS.filter((c) => !codes.includes(c)).map((c) => ROW_NAME[c]);
  const verses = Object.values(heat).reduce((n, b) => n + sumOf(b.counts), 0), chapters = Object.values(heat).reduce((n, b) => n + Object.keys(b.counts).length, 0);
  const [chosen, setChosen] = useState<[string, number] | null>(() => {
    let best: [string, number, number] | null = null;
    for (const code of codes) for (const [ch, n] of Object.entries(heat[code]?.counts ?? altHeat[code]?.counts ?? {})) if (!best || n > best[2] || (n === best[2] && ROWS.includes(code) && !ROWS.includes(best[0]))) best = [code, Number(ch), n];
    return best && [best[0], best[1]];
  });
  const tip = (e: ReactPointerEvent, code: string, ch: number) => {
    const b = meta(code), ents = entriesIn(d, b.num, ch);
    Tip.show({ title: `${b.name} ${ch}`, lines: [`${plural(heat[code]?.counts[ch] ?? 0, "verse")} name him${altHeat[code]?.counts[ch] ? ` · ${altHeat[code].counts[ch]} name ${alt.name}` : ""}`, ents.slice(0, 3).map((x) => x.title).join(" · ")] }, e.clientX, e.clientY);
  };
  const row = (code: string) => {
    const b = meta(code), mine = heat[code]?.counts ?? {}, other = altHeat[code]?.counts ?? {}, osum = sumOf(other);
    return <div key={code} className="heat-row" style={{ "--tone": BOOK_TONE(b.num) } as CSSProperties}><span className="heat-book">{b.name}</span>
      <div className="heat-cells">{Array.from({ length: b.chapters }, (_, i) => {
        const c = mine[i + 1] ?? 0, o = other[i + 1] ?? 0, sel = chosen?.[0] === code && chosen[1] === i + 1;
        return <button key={i} type="button" className={`cell${c ? " on" : ""}${o ? " alt" : ""}${sel ? " sel" : ""}`} style={{ "--k": (Math.max(c, o * 0.6) / max).toFixed(3) } as CSSProperties}
          aria-label={`${b.name} ${i + 1}: ${c} verses${o ? `, ${o} naming ${alt.name}` : ""}`} aria-pressed={sel}
          onClick={() => setChosen([code, i + 1])} onPointerMove={(e) => tip(e, code, i + 1)}>{c >= Math.max(3, max * 0.45) ? <i>{c}</i> : null}</button>;
      })}</div><span className="heat-sum">{sumOf(mine)}{osum ? <small>+{osum}</small> : null}</span></div>;
  };
  return <section className="sec" data-sec="grid">
    <SecHead num="02" kicker="Chapter by chapter" title="Where is he " em="named?"
      sub={`One square for each chapter of the books that name ${d.short}: ${plural(verses, "verse")} in ${plural(chapters, "chapter")}. The darker the square, the more verses in it name him.${alt ? ` Squares with a dashed edge name ${alt.name}, who is ${d.short} only if the two are one man (see the questions below).` : ""} Choose a chapter to read what happens there.`} />
    <div className={`heat-wrap${gospels.length + letters.length < 6 ? " below" : ""}`}>
      <div className="heat-scroll" onPointerLeave={() => Tip.hide()}><div className="heat">
        {gospels.length > 0 && <><p className="heat-group">The Gospels and Acts</p>{gospels.map(row)}</>}
        {letters.length > 0 && <><p className="heat-group">The letters and Revelation</p>{letters.map(row)}</>}
      </div></div>
      <aside className="heat-now" aria-live="polite" style={chosen ? { "--tone": BOOK_TONE(meta(chosen[0]).num) } as CSSProperties : undefined}>{chosen && <ChapterNow d={d} code={chosen[0]} ch={chosen[1]} open={(e) => sheet.openEntry(e)} />}</aside>
    </div>
    <div className="heat-foot">
      <div className="heat-key"><span>Fewer</span>{[0, 0.15, 0.35, 0.6, 1].map((k) => <i key={k} style={{ "--k": k } as CSSProperties} className={k ? "on" : undefined} />)}<span>More verses name him</span>
        {alt && <><i className="alt" style={{ "--k": 0.4 } as CSSProperties} /><span>names {alt.name}</span></>}</div>
      {missing.length > 0 && <p className="heat-others">No verse in {missing.join(", ").replace(/, ([^,]*)$/, " or $1")} names him.</p>}
    </div>
  </section>;
}

function ChapterNow({ d, code, ch, open }: { d: Apostle; code: string; ch: number; open: (e: Entry) => void }) {
  const alt = d.alt[0], altHeat = alt?.heat ?? {}, b = d.heat[code] ?? altHeat[code];
  const mineV = d.heat[code]?.first[ch], altV = altHeat[code]?.first[ch], v = mineV ?? altV, ents = entriesIn(d, b.num, ch);
  return <>
    <div className="heat-now-v">
      <p className="kicker">{b.name} {ch}</p>
      <h3>{plural(d.heat[code]?.counts[ch] ?? 0, "verse")} name him{altHeat[code]?.counts[ch] ? `; ${plural(altHeat[code].counts[ch], "verse")} name ${alt.name}` : ""}</h3>
      {v ? <blockquote><p><Marked text={d.verses[v] ?? ""} names={d.names} /></p><footer><RefLink r={[v, v]} /> · {mineV ? "the first verse here that names him" : `names ${alt.name}`}</footer></blockquote>
        : <p className="plain-line">No verse in this chapter names him.</p>}
    </div>
    <div className="heat-now-e">
      {ents.length > 0 && <><p className="kicker heat-k">What happens here</p><ul className="heat-ents">{ents.map((e) => <li key={e.key}><button type="button" onClick={() => open(e)}><Icon name={e.icon} size={15} /><span>{e.title}</span></button></li>)}</ul></>}
      <Link className="read" to={`/read/kjv/${bookCode(b.num)}/${ch}`}><Icon name="open" size={13} />Read {b.name} {ch}</Link>
    </div>
  </>;
}
