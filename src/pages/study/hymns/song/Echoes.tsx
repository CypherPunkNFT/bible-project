// The hymn with its echoes: the stanzas set like a printed page and, beside each line that echoes a verse, that verse
// floating in the margin, joined by a thin line. Pointing joins a line and its verse; clicking opens the passage
// (approved mock-up: design/hymn-directions/shared/echoes.js, shown in its "compare" form).
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { HymnSong } from "@/lib/hymns";
import { ROMAN, type OpenPassage } from "./parts";

interface Joins { tops: number[]; paths: { i: number; d: string; x1: number; y1: number; x2: number; y2: number }[]; height: number }

export function Echoes({ song, open, closedAt }: { song: HymnSong; open: OpenPassage; closedAt: number }) {
  const box = useRef<HTMLDivElement>(null);
  const margin = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const noteRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [joins, setJoins] = useState<Joins>({ tops: [], paths: [], height: 0 });
  const [focus, setFocus] = useState<number[]>([]);
  const [lastClosed, setLastClosed] = useState(closedAt);
  if (closedAt !== lastClosed) { setLastClosed(closedAt); setFocus([]); }

  // Each verse sits level with its line, pushed down when the one above would overlap it; the joins are curves from the
  // end of the line to the verse. Measured after layout, and again when the width or the fonts change.
  const layout = useCallback(() => {
    const ec = box.current, side = margin.current;
    if (!ec || !side || window.innerWidth <= 900) return;
    const frame = ec.getBoundingClientRect(), left = side.getBoundingClientRect().left - frame.left;
    let floor = -Infinity;
    const tops: number[] = [], paths: Joins["paths"] = [];
    song.echoes.forEach((_, i) => {
      const line = lineRefs.current[i], note = noteRefs.current[i];
      if (!line || !note) return;
      const r = line.getBoundingClientRect();
      const top = Math.max(r.top - frame.top + r.height / 2 - 14, floor);
      tops[i] = top; floor = top + note.offsetHeight + 8;
      const x1 = r.right - frame.left + 10, y1 = r.top - frame.top + r.height / 2, x2 = left - 12, y2 = top + 9, mid = (x1 + x2) / 2;
      paths.push({ i, d: `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`, x1, y1, x2, y2 });
    });
    const height = Math.max(0, ...song.echoes.map((_, i) => (tops[i] ?? 0) + (noteRefs.current[i]?.offsetHeight ?? 0)));
    setJoins({ tops, paths, height });
  }, [song]);

  useLayoutEffect(() => {
    layout();
    let live = true;
    document.fonts.ready.then(() => { if (live) layout(); }, (error: unknown) => console.warn("Hymn echoes: fonts did not report ready", error));
    const observer = new ResizeObserver(layout);
    if (box.current) observer.observe(box.current);
    return () => { live = false; observer.disconnect(); };
  }, [layout]);

  const openEcho = (i: number) => {
    const e = song.echoes[i];
    open({ passage: e, line: song.stanzas[e.stanza][e.line], kicker: `Stanza ${ROMAN[e.stanza]} echoes` });
    setFocus([i]);
  };
  const on = (i: number) => focus.includes(i);

  return <>
    <div className={`ec${focus.length ? " focus" : ""}`} ref={box}>
      <svg className="links" aria-hidden="true">{joins.paths.map((p) => <g key={p.i}>
        <path className={on(p.i) ? "on" : undefined} d={p.d} /><circle className={on(p.i) ? "on" : undefined} cx={p.x1} cy={p.y1} r="2.5" /><circle className={on(p.i) ? "on" : undefined} cx={p.x2} cy={p.y2} r="2.5" /></g>)}</svg>
      <div className="stanzas">{song.stanzas.map((lines, s) => <div key={s} className="stanza"><span className="rn" aria-hidden="true">{ROMAN[s]}</span>
        {lines.map((text, l) => {
          const ids = song.echoes.flatMap((e, i) => (e.stanza === s && e.line === l ? [i] : []));
          if (!ids.length) return <span key={l} className="line"><span className="t">{text}</span></span>;
          return <span key={l} className={`line echo${ids.some(on) ? " on" : ""}`} onMouseEnter={() => setFocus(ids)} onMouseLeave={() => setFocus([])} onClick={() => openEcho(ids[0])}>
            <span className="t" ref={(el) => { for (const i of ids) lineRefs.current[i] = el; }}>{text}</span>
            {ids.map((i) => <span key={i} className="inline-note"><b>{song.echoes[i].ref}</b>{song.echoes[i].words}</span>)}</span>;
        })}</div>)}</div>
      <div className="margin" ref={margin} style={{ minHeight: joins.height || undefined }}>{song.echoes.map((e, i) =>
        <button key={i} type="button" ref={(el) => { noteRefs.current[i] = el; }} className={`note${on(i) ? " on" : ""}`} style={{ top: joins.tops[i] ?? 0 }}
          onMouseEnter={() => setFocus([i])} onMouseLeave={() => setFocus([])} onClick={() => openEcho(i)}>
          <span className="ref">{e.ref}</span><span className="w">“{e.words}”</span></button>)}</div>
    </div>
    <p className="ec-key">{song.echoes.length} echoes in {song.stanzas.reduce((n, s) => n + s.length, 0)} lines.</p>
  </>;
}
