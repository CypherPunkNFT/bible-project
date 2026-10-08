import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { F, hills, P, stars, svg, walls, water } from "./art/kit";
import { scene } from "./art/scenes-2";
import { bookName, chapterOf, LAYER, PERIOD_TONE, plural, refText, whenShort } from "./data";
import { useSheet } from "./sheet";
import type { Apostle, Entry } from "./types";
import { ClaimFoot, Icon, LayerChip, Marked, RefLink, RefList } from "./ui";

/**
 * The chapters, cinema style (the Moses cinema containers): I before the call, II with Jesus (or the call), III the
 * church in Acts, IV after Scripture (tradition, dashed). Each chapter is one large screen with its giant numeral behind,
 * a sky of faint stars above and a line-art landscape beneath; its scenes slide sideways, each with a large drawing and
 * the record's own verse, people and places. The side rail of dots finds a chapter.
 */
const ground = (period: number) => {
  if (period === 3) return svg("0 0 1600 120", F(hills(70, 26, 61, 0, 1600, "g", 0), walls(980, 96, 300, 34, 0.05), P("M1060 62V40H1200V62", "f", 0.1), P("M0 110H1600", "f", 0)), "cn-land");
  if (period === 4) return svg("0 0 1600 120", F(hills(80, 20, 62, 0, 1600, "g", 0), ...[200, 520, 900, 1260].map((x, i) => P(`M800 120Q${(800 + x) / 2} ${90 - i * 6} ${x} ${60 + i * 4}`, "dash", 0.1)), P("M0 110H1600", "f", 0)), "cn-land");
  return svg("0 0 1600 120", F(hills(60, 30, 63 + period, 0, 1600, "g", 0), hills(76, 16, 64 + period, 0, 1600, "f", 0.05), water(0, 1600, 90, 118, 3, 65, "w", 0.1)), "cn-land");
};

function Facts({ d, e }: { d: Apostle; e: Entry }) {
  const names = Object.keys(e.with ?? {}).map((k) => d.rowByKey[k]?.name).filter(Boolean);
  const places = e.places.map((i) => d.places[i]?.name).filter(Boolean);
  const books = [...new Set(e.refs.map(([a]) => bookName(chapterOf(a).book)))];
  const rows: [string, ReactNode][] = [];
  if (names.length) rows.push(["Named with him", names.slice(0, 6).join(", ") + (names.length > 6 ? ` and ${names.length - 6} more` : "")]);
  if (places.length) rows.push(["Where", places.join(", ")]);
  if (e.h) rows.push(["In the harmony", `§${e.h.n} · ${e.h.title}`]);
  if (e.refs.length) rows.push([books.length > 1 ? `Told in ${books.length} books` : "Passage", <RefList refs={e.refs} max={4} />]);
  return rows.length ? <dl className="cn-facts">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl> : null;
}

function Slide({ d, entry, art, v, play }: { d: Apostle; entry: string; art: string; v: number | null; play: number | null }) {
  const sheet = useSheet(), e = d.byKey[entry], text = v ? d.verses[v] : undefined;
  const drawing = useMemo(() => scene(art), [art]);
  return <div className="cn-slide">
    <div className="cn-text"><p className="kicker"><Icon name={e.icon} size={14} />{LAYER[e.layer ?? ""] ?? ""}{e.refs[0] ? ` · ${refText(e.refs[0])}` : ""}</p>
      <h3 className="cn-title">{e.title}</h3>
      {v && text && <blockquote className="cn-verse"><p><Marked text={text} names={d.names} /></p><footer><RefLink r={[v, v]} /> · KJV</footer></blockquote>}
      {e.text && e.text !== e.title && <p className="cn-what">{e.text}</p>}
      <Facts d={d} e={e} />
      <div className="cn-actions"><button type="button" className="cn-more" onClick={() => sheet.openEntry(e)}><Icon name="layers" size={15} />Read it all<small>{e.refs.length ? plural(e.refs.length, "passage") : "with its sources"}</small></button></div></div>
    <div className="cn-art">{svg("0 0 400 260", drawing, play === null ? "scene" : "scene plot", { key: play ?? "still" })}</div>
  </div>;
}

function EmptySlide({ d }: { d: Apostle }) {
  const lines = d.notSaid.filter((t) => /home|trade|family|came from|Gospels|name/i.test(t)).slice(0, 2);
  const drawing = useMemo(() => scene("silence"), []);
  return <div className="cn-slide"><div className="cn-text"><p className="kicker"><Icon name="silence" size={14} />{d.periods[0].sub}</p><h3 className="cn-title">Scripture gives no home, trade or family for him</h3>
    {lines.map((t) => <p key={t} className="cn-what">{t}</p>)}
    {d.lists.length > 0 && <><p className="kicker cn-k">How each list names him</p><ul className="cn-names">{d.lists.map((l) => <li key={l.book}><b>{l.name}</b> <RefLink r={l.span} /></li>)}</ul></>}</div>
    <div className="cn-art">{svg("0 0 400 260", drawing, "scene")}</div></div>;
}

function AfterSlide({ d }: { d: Apostle }) {
  const sheet = useSheet();
  return <div className="cn-slide cn-after"><div className="cn-text"><p className="kicker"><Icon name="scroll" size={14} />Scripture first</p><h3 className="cn-title">What Scripture says of his end</h3>
    <ul className="cn-ending">{d.ending.scripture.map((c, i) => <li key={i}><p>{c.text}</p><ClaimFoot d={d} c={c} /></li>)}</ul></div>
    <div className="cn-ladder"><p className="kicker"><Icon name="tradition" size={14} />Then tradition · {plural(d.trad.length, "source")}, earliest first</p>
      <ol>{d.trad.map((t) => <li key={t.key}><button type="button" onClick={() => sheet.openEntry(t)}><span className="ld-when">{whenShort(t.when)}</span><span className="ld-who">{t.who}</span><LayerChip layer={t.layer ?? "tradition"} /></button></li>)}</ol>
      <p className="plain-line">Each is labelled with who said it and when; none is blended into Scripture.</p></div></div>;
}

interface Chapter { n: string; period: number; title: string; slides: { entry: string; art: string; v: number | null }[] }

export function Cinema({ d }: { d: Apostle }) {
  const chapters: Chapter[] = useMemo(() => [...d.chapters, { n: "IV", period: 4, title: "After Scripture", slides: [] }], [d]);
  const [at, setAt] = useState<number[]>(() => chapters.map(() => 0));
  const [plays, setPlays] = useState<(number | null)[]>(() => chapters.map(() => null));
  const [current, setCurrent] = useState(-1), [rail, setRail] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const count = (ci: number) => (ci === 3 ? 1 : Math.max(1, chapters[ci].slides.length));
  const atRef = useRef(at); atRef.current = at;
  const slideTo = (ci: number, to: number) => {
    const next = Math.max(0, Math.min(count(ci) - 1, to));
    if (next === atRef.current[ci]) return;
    setAt((a) => a.map((x, i) => (i === ci ? next : x)));
    setPlays((p) => p.map((x, i) => (i === ci ? (x ?? 0) + 1 : x)));
  };
  const slideRef = useRef(slideTo); slideRef.current = slideTo;

  useEffect(() => {
    const host = wrap.current;
    if (!host) return;
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const ci = Number((en.target as HTMLElement).dataset.ci);
      setCurrent(ci);
      setPlays((p) => (p[ci] === null ? p.map((x, i) => (i === ci ? 1 : x)) : p));
    }), { threshold: 0.35 });
    host.querySelectorAll(".cn-chapter").forEach((c) => io.observe(c));
    const railIo = new IntersectionObserver(([en]) => setRail(en.isIntersecting), { threshold: 0 });
    railIo.observe(host);
    // Arrow keys move the chapter in the middle of the window; a sideways swipe on a scene moves its chapter.
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== "ArrowRight" && e.key !== "ArrowLeft") || e.defaultPrevented || (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [role=menu], .ap-count-menu"))) return;
      const ch = [...host.querySelectorAll<HTMLElement>(".cn-chapter")].find((c) => { const r = c.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
      if (ch) { const ci = Number(ch.dataset.ci); slideRef.current(ci, atRef.current[ci] + (e.key === "ArrowRight" ? 1 : -1)); }
    };
    let sx: [number, number, number] | null = null;
    const onDown = (e: PointerEvent) => { const v = e.target instanceof Element ? e.target.closest<HTMLElement>(".cn-viewport") : null; if (v) sx = [e.clientX, e.clientY, Number(v.closest<HTMLElement>(".cn-chapter")!.dataset.ci)]; };
    const onMove = (e: PointerEvent) => {
      if (!sx) return;
      const dx = e.clientX - sx[0], dy = e.clientY - sx[1];
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { getSelection()?.removeAllRanges(); document.documentElement.classList.add("no-select"); }
    };
    const onUp = (e: PointerEvent) => {
      document.documentElement.classList.remove("no-select");
      if (!sx) return;
      const dx = e.clientX - sx[0], dy = e.clientY - sx[1];
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) slideRef.current(sx[2], atRef.current[sx[2]] + (dx < 0 ? 1 : -1));
      sx = null;
    };
    addEventListener("keydown", onKey); host.addEventListener("pointerdown", onDown); addEventListener("pointermove", onMove); addEventListener("pointerup", onUp); addEventListener("pointercancel", onUp);
    return () => {
      io.disconnect(); railIo.disconnect(); removeEventListener("keydown", onKey); host.removeEventListener("pointerdown", onDown);
      removeEventListener("pointermove", onMove); removeEventListener("pointerup", onUp); removeEventListener("pointercancel", onUp);
      document.documentElement.classList.remove("no-select");
    };
  }, []);

  const sky = useMemo(() => [1, 2, 3, 4].map((p) => svg("0 0 1600 200", stars(60, 70 + p, [0, 0, 1600, 200], 0), "cn-sky")), []);
  const grounds = useMemo(() => [1, 2, 3, 4].map(ground), []);
  return <div className="cn" data-sec="chapters" ref={wrap}>
    {chapters.map((ch, ci) => {
      const p = d.periods[ch.period - 1], n = p.entries.length, k = count(ci);
      const slides = ci === 3 ? [<AfterSlide key="after" d={d} />] : ch.slides.length ? ch.slides.map((s, si) => <Slide key={s.entry + si} d={d} {...s} play={si === at[ci] ? plays[ci] : null} />) : [<EmptySlide key="empty" d={d} />];
      return <section key={ch.n} id={`ap-chapter-${ch.period}`} className={`cn-chapter${ch.period === 4 ? " trad" : ""}`} data-ci={ci} style={{ "--tone": PERIOD_TONE[ch.period] } as CSSProperties} aria-label={`Chapter ${ch.n}: ${ch.title}`}>
        {sky[ch.period - 1]}<div className="cn-bgnum" aria-hidden="true">{ch.n}</div>
        <header className="cn-head"><p className="kicker">Chapter {ch.n} · {p.title}</p><h2>{ch.title}</h2><p className="sub">{p.sub} · {n ? plural(n, ch.period === 4 ? "source" : "record") : "nothing recorded"}</p></header>
        <div className="cn-viewport"><div className="cn-track" style={{ "--x": at[ci] } as CSSProperties}>{slides}</div></div>
        {k > 1 && <div className="cn-nav"><button type="button" className="cn-arrow" aria-label="Previous scene" onClick={() => slideTo(ci, at[ci] - 1)}><Icon name="arrowLeft" size={18} /></button>
          <div className="cn-dots">{Array.from({ length: k }, (_, i) => <button key={i} type="button" aria-label={`Scene ${i + 1}`} aria-current={i === at[ci] ? "true" : undefined} onClick={() => slideTo(ci, i)} />)}</div>
          <span className="cn-count"><b>{at[ci] + 1}</b> / {k}</span><button type="button" className="cn-arrow" aria-label="Next scene" onClick={() => slideTo(ci, at[ci] + 1)}><Icon name="arrowRight" size={18} /></button></div>}
        {grounds[ch.period - 1]}
      </section>;
    })}
    <nav className={`cn-rail${rail ? " show" : ""}`} aria-label="Chapters">{chapters.map((ch, ci) => <a key={ch.n} href={`#ap-chapter-${ch.period}`} aria-current={ci === current ? "true" : undefined}
      onClick={(e) => { e.preventDefault(); document.getElementById(`ap-chapter-${ch.period}`)?.scrollIntoView({ behavior: "smooth" }); }}><i /><span>{ch.n} · {ch.title}</span></a>)}</nav>
  </div>;
}
