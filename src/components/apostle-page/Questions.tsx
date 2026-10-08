import { useEffect, useRef, useState } from "react";
import { plural, REDUCED } from "./data";
import type { Apostle, Question } from "./types";
import { ClaimFoot, SecHead } from "./ui";

/**
 * 06 · What readers still ask: every open question the reviewed sources hold for him, as floating words joined by thin
 * lines (no boxes), in four groups: who he was, what happened, how it ended, the writings. What Scripture does not say
 * floats among them in italic. Choosing a question opens its answers below, each with who holds it and the sources.
 * Nothing here is written for the page: every question and answer is reviewed data.
 */
const KIND_TAG = { views: "Views, with who holds them", answer: "An identification this page relies on", ending: "Scripture beside tradition", silent: "Scripture does not say" };

function Answer({ d, q }: { d: Apostle; q: Question }) {
  const views = q.views ?? [];
  const note = q.full && q.full !== q.q ? q.full.slice(q.q.length).trim() : "";
  let body;
  if (q.kind === "silent") body = <p className="qv-silent">{q.q}</p>;
  else if (q.kind === "answer") body = <div className="qv-answer"><p>{views[0].argument.text}</p><ClaimFoot d={d} c={views[0].argument} /></div>;
  else if (q.kind === "ending") {
    const sc = views.filter((v) => v.label === "Scripture"), tr = views.filter((v) => v.label !== "Scripture");
    body = <div className="qv-ending"><div><p className="kicker">Scripture</p>{sc.map((v, i) => <div key={i} className="qv-sc"><p>{v.argument.text}</p><ClaimFoot d={d} c={v.argument} /></div>)}</div>
      <div><p className="kicker">Tradition, earliest first</p><ol className="qv-ladder">{tr.map((v, i) => <li key={i}><p className="qv-who">{v.label}<small>{v.holders}</small></p><p>{v.argument.text}</p><ClaimFoot d={d} c={v.argument} /></li>)}</ol></div></div>;
  } else body = <ol className="views-list">{views.map((v, i) => <li key={i}><p className="views-label">{v.label}</p>{v.holders && <p className="views-who">{v.holders}</p>}<p className="views-arg">{v.argument.text}</p><ClaimFoot d={d} c={v.argument} /></li>)}</ol>;
  return <><p className="kicker">{KIND_TAG[q.kind]} · {q.from}</p>{q.kind !== "silent" && <h3 className="views-q">{q.q}{note && <> <small>{note}</small></>}</h3>}{body}</>;
}

interface Word { kind: "c" | "g" | "q"; g?: string; q?: number; ph: number; amp: number; w: number; h: number; x: number; y: number }

export function QuestionsSection({ d }: { d: Apostle }) {
  const { groups, items } = d.questions;
  const nViews = items.filter((q) => q.kind !== "silent").length, nSilent = items.length - nViews;
  const [sel, setSel] = useState(() => Math.max(0, items.findIndex((q) => q.kind !== "silent")));
  const field = useRef<HTMLDivElement>(null), els = useRef<(HTMLElement | null)[]>([]), lines = useRef<(SVGElement | null)[]>([]);
  // Word order in the field: the centre, the four group heads, then every question.
  const total = 1 + groups.length + items.length;

  useEffect(() => {
    const host = field.current;
    if (!host) return;
    const words: Word[] = Array.from({ length: total }, (_, i) => {
      const kind = i === 0 ? "c" : i <= groups.length ? "g" : "q", q = kind === "q" ? i - 1 - groups.length : undefined;
      return { kind, g: kind === "g" ? groups[i - 1].id : q !== undefined ? items[q].group : undefined, q, ph: i * 1.37, amp: kind === "q" ? 2.6 : 0, w: 0, h: 0, x: 0, y: 0 };
    });
    let raf = 0, visible = false;
    // Each frame moves the words a little and redraws the lines that join them (geometry only; classes are React's).
    const frame = (now: number) => {
      const t = now / 1000, pos = words.map((n) => [n.x + Math.sin(t * 0.33 + n.ph) * n.amp, n.y + Math.cos(t * 0.27 + n.ph) * n.amp * 0.7]);
      words.forEach((n, i) => { const el = els.current[i]; if (el) el.style.transform = `translate(${(pos[i][0] - n.w / 2).toFixed(1)}px, ${(pos[i][1] - n.h / 2).toFixed(1)}px)`; });
      words.forEach((n, i) => {
        const line = lines.current[i];
        if (!line) return;
        if (n.kind === "g") { line.setAttribute("x1", pos[0][0].toFixed(1)); line.setAttribute("y1", (pos[0][1] + words[0].h / 2).toFixed(1)); line.setAttribute("x2", pos[i][0].toFixed(1)); line.setAttribute("y2", (pos[i][1] - n.h / 2).toFixed(1)); }
        if (n.kind === "q") {
          const hi = words.findIndex((m) => m.kind === "g" && m.g === n.g), h = pos[hi], hb = h[1] + words[hi].h / 2, [x, y] = pos[i], ty = y - n.h / 2;
          line.setAttribute("d", `M${h[0].toFixed(1)} ${hb.toFixed(1)}C${h[0].toFixed(1)} ${(hb + (ty - hb) * 0.6).toFixed(1)} ${x.toFixed(1)} ${(ty - 18).toFixed(1)} ${x.toFixed(1)} ${ty.toFixed(1)}`);
        }
      });
    };
    const place = () => {
      const W = host.clientWidth, cols = W < 760 ? 1 : 4, cw = W / cols;
      words.forEach((n, i) => { n.w = els.current[i]?.offsetWidth ?? 0; n.h = els.current[i]?.offsetHeight ?? 0; });
      const centre = words[0]; centre.x = W / 2; centre.y = centre.h / 2 + 4;
      let y0 = centre.y + 64, bottom = 0;
      groups.forEach((g, k) => {
        const head = words[k + 1], kids = words.filter((n) => n.kind === "q" && n.g === g.id), cx = cols === 1 ? W / 2 : cw * (k + 0.5);
        let y = (cols === 1 ? y0 : centre.y + 74) + head.h / 2;
        head.x = cx; head.y = y; y += head.h / 2 + 30;
        kids.forEach((n, j) => { const off = (j % 2 ? 1 : -1) * Math.min(28, cw * 0.07); n.x = Math.max(n.w / 2 + 4, Math.min(W - n.w / 2 - 4, cx + off)); n.y = y + n.h / 2; y += n.h + 14; });
        bottom = Math.max(bottom, y);
        if (cols === 1) y0 = y + 40;
      });
      host.style.height = `${bottom + 10}px`;
      frame(performance.now());
    };
    const loop = (now: number) => { raf = 0; if (!visible || !host.isConnected) return; frame(now); if (!REDUCED()) raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: "100px" });
    io.observe(host);
    let lastW = 0;
    const ro = new ResizeObserver(([en]) => { const w = Math.round(en.contentRect.width); if (w !== lastW) { lastW = w; place(); } });
    ro.observe(host);
    void document.fonts?.ready.then(() => { if (host.isConnected) place(); });
    place();
    return () => { io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf); };
  }, [groups, items, total]);

  const q = items[sel];
  let n = 0;
  const ref = (i: number) => (el: HTMLElement | null) => { els.current[i] = el; };
  const lineRef = (i: number) => (el: SVGElement | null) => { lines.current[i] = el; };
  return <section className="sec" data-sec="questions">
    <SecHead num="06" kicker="Open questions" title="What readers still " em="ask"
      sub={`${plural(nViews, "question")} the reviewed sources leave open for ${d.short}, with the answers given and who gives them, and ${plural(nSilent, "thing")} Scripture does not say, in italic. Choose one.`} />
    <div className="words" role="group" aria-label="Open questions" ref={field}>
      <svg className="words-lines" aria-hidden="true">
        {groups.map((g, k) => <line key={g.id} ref={lineRef(k + 1)} className="wl wl-g" />)}
        {items.map((x, i) => <path key={x.id} ref={lineRef(1 + groups.length + i)} className={`wl wl-${x.kind}${i === sel ? " on" : ""}`} />)}
      </svg>
      <span ref={ref(n++)} className="word w-centre">What readers still ask</span>
      {groups.map((g) => <span key={g.id} ref={ref(n++)} className={`word w-group${g.n ? "" : " empty"}`}>{g.title}<small>{g.n ? plural(g.n, "item") : "nothing open in the reviewed data"}</small></span>)}
      {items.map((x, i) => <button key={x.id} ref={ref(n++)} type="button" className={`word w-q k-${x.kind}${i === sel ? " on" : ""}`} aria-pressed={i === sel} onClick={() => setSel(i)}>{x.q}</button>)}
    </div>
    <div className="views" aria-live="polite">{q && <Answer d={d} q={q} />}</div>
  </section>;
}
