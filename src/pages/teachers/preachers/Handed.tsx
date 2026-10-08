// 06 · Who passed it to whom (approved mock-up: design/authors-directions/teachers/handed.js): the documented teacher,
// colleague and influence links drawn as curves between lifelines. Pick a chain and it draws in one link at a time, with
// numbered notes beside it; it also draws itself in the first time the section comes into view. Point at or tap a curve
// to read its note.
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { SectionHead } from "../shared/Frame";
import { usePreachers } from "./context";
import { HandedChart } from "./handed/HandedChart";
import { HandedNote } from "./handed/HandedNote";
import { chainsFor, gapOf, lanes, linksFrom, linksOf } from "./handed/model";
import { drawRelay } from "./handed/relay";
import { onFirstView, plural, prefersReducedMotion, useWidth } from "./lives/common";
import { FloatingTip, type TipHandle } from "./lives/FloatingTip";
import "./Handed.css";

export function Handed() {
  const { data, openProfile } = usePreachers();
  const byId = useMemo(() => new Map(data.people.map((p) => [p.id, p])), [data.people]);
  const links = useMemo(() => linksFrom(data, byId), [data, byId]);
  const chains = useMemo(() => chainsFor(byId), [byId]);
  const laneList = useMemo(() => lanes(links), [links]);
  const [chainKey, setChainKey] = useState(chains[0].key);
  const [relay, setRelay] = useState(0); // bumped to draw the chosen chain in, link by link
  const [hot, setHot] = useState<number | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const tip = useRef<TipHandle>(null);
  const arcs = useRef(new Map<number, SVGPathElement>());
  const badges = useRef(new Map<number, SVGGElement>());
  const width = useWidth(host);
  const chain = chains.find((c) => c.key === chainKey) ?? chains[0];
  const list = useMemo(() => linksOf(chain, links), [chain, links]);
  const focus = useMemo(() => (chain.ids ? { people: new Set(chain.ids), links: new Set(list.map((l) => l.k)) } : null), [chain, list]);
  const numbers = useMemo(() => new Map(chain.ids ? list.map((l, i) => [l.k, i + 1]) : []), [chain, list]);

  // The relay runs when a chain is picked and the first time the chart comes into view (never with reduced motion).
  useEffect(() => {
    if (!relay || !chain.ids || prefersReducedMotion()) return;
    return drawRelay(list, arcs.current, badges.current);
  }, [relay, chain, list]);
  useEffect(() => {
    const el = host.current;
    return el ? onFirstView(el, 0.35, () => setRelay((n) => n + 1)) : undefined;
  }, []);

  const showLink = (k: number | null, x = 0, y = 0) => {
    setHot(k);
    if (k === null) tip.current?.hide(); else tip.current?.move(x, y);
  };
  useEffect(() => {
    const hide = () => { setHot(null); tip.current?.hide(); };
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, []);
  const linkAt = (e: ReactPointerEvent) => {
    const g = (e.target as Element).closest<SVGGElement>(".hand-link");
    return g ? Number(g.dataset.k) : null;
  };
  const open = (id: string, origin: Element) => { showLink(null); openProfile(id, origin); };
  const pick = (key: string) => { setChainKey(key); setRelay((n) => n + 1); };
  const hotLink = hot === null ? null : links.find((l) => l.k === hot) ?? null;
  const hotGap = hotLink ? gapOf(hotLink) : 0;

  return <>
    <SectionHead num="06" kicker="Handed on" title={<>Who passed it <em>to whom</em></>}
      line="Each curve is a documented link: a teacher and a student, two colleagues, or a writer who shaped a later one. Where their lives overlapped the curve sits in their shared years; where they did not, it runs from one death to the next birth. Point at or tap a curve to read the link." />
    <div className="hand-chains">
      <span className="hand-lab">Follow</span>
      {chains.map((c) => <button key={c.key} type="button" className="hand-chip" aria-pressed={c.key === chain.key} onClick={() => pick(c.key)}>
        {c.label}<small>{linksOf(c, links).length}</small>
      </button>)}
    </div>
    <div className="hand-grid">
      <div className="hand-card hand-chart">
        <div className="hand-host" ref={host}
          onPointerMove={(e) => { if (e.pointerType === "mouse") showLink(linkAt(e), e.clientX, e.clientY); }}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") showLink(null); }}
          onPointerUp={(e) => { if (e.pointerType !== "mouse") showLink(linkAt(e), e.clientX, e.clientY); }}>
          {width > 0 && <HandedChart width={width} lanes={laneList} links={links} focus={focus} numbers={numbers} hot={hot} arcs={arcs} badges={badges} onOpen={open} />}
        </div>
      </div>
      <div className="hand-card hand-note" aria-live="polite">
        <HandedNote chain={chain} list={list} all={links} hot={hot} onOpen={open} />
      </div>
    </div>
    <FloatingTip ref={tip} className="hand-tip">
      {hotLink && <><b>{hotLink.a.short} → {hotLink.b.short}</b>{hotLink.note}{hotGap > 0 && <><br /><small>{plural(hotGap, "year")} between one life and the next</small></>}</>}
    </FloatingTip>
  </>;
}
