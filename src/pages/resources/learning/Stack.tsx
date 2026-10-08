// One door's stack (mock-up A, as E opens it): every title lying flat, spine to the reader, grouped by subject in the
// site's track order with the ready title first in its group. A ready title is a solid spine in its reader's colour;
// planned titles are dashed outlines. Pointing at a book lifts it and fills the panel beside it (joined by a thin
// lead); clicking keeps it. The panel holds every title's facts at once (StableTip), so it never changes height.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { StableTip } from "@/components/StableTip";
import type { Audience, Division, Title } from "@/data/resources/learning-catalogue";
import { Glyph } from "./Art";
import { PageViewer } from "./PageViewer";
import { type Back, groupsFor } from "./model";
import { Panel } from "./Panel";

// Planned books: [thickness px, width % of the stack] by kind. Ready books take their thickness from their pages.
const SHAPE: Record<string, [number, number]> = { story: [24, 96], activity: [30, 88], cards: [31, 64], lesson: [31, 84], workbook: [34, 82], plan: [28, 74], devotional: [31, 78], maps: [23, 94], guide: [31, 78] };

/** A steady wobble per title, so the stack looks hand-placed but never moves between visits. */
function jitter(id: string, salt: number, span: number) {
  let h = 2166136261 ^ salt;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (((h >>> 0) % 1000) / 1000) * 2 * span - span;
}

function bookShape(t: Title, kindName: string) {
  const [base, width] = SHAPE[t.kind] ?? [30, 84];
  let thick = base;
  if (t.record) thick = Math.round(17 + t.record.pages * 0.5);
  else if (t.sessions) thick = Math.min(37, Math.round(22 + t.sessions * 1.15));
  // Never narrower than its title needs (about 520 px of stack at full width).
  const need = (t.title.length * 7.4 + kindName.length * 6.4 + 150) / 5.2;
  const dx = Math.round(jitter(t.id, 3, 12));
  return { thick: Math.round(thick + jitter(t.id, 1, 2)), width: Math.round(Math.min(100 - Math.abs(dx) / 2.2, Math.max(need, width + jitter(t.id, 2, 4)))), dx };
}


interface StackProps { division: Division; audience: Audience; kind: string | null; back: Back; reflow: number }

export function Stack({ division, audience, kind, back, reflow }: StackProps) {
  const items = division.forAudience(audience.id);
  const first = (items.find((t) => t.status === "ready") ?? groupsFor(division, audience.id)[0]?.[1][0])?.id ?? "";
  const [kept, setKept] = useState(first);
  const [pointed, setPointed] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ title: Title; page: number } | null>(null);
  const shown = pointed ?? kept;
  const view = useRef<HTMLDivElement>(null), lead = useRef<HTMLElement>(null);

  // The lead: a thin line from the shown book's right end to the panel's rule (desktop only).
  const placeLead = useCallback(() => {
    const box = view.current, line = lead.current;
    const book = box?.querySelector<HTMLElement>(`.lm-bk[data-id="${shown}"]`), panel = box?.querySelector<HTMLElement>(".lm-panel");
    if (!box || !line || !book || !panel) return;
    if (getComputedStyle(panel).borderLeftStyle === "none") { line.hidden = true; return; }
    const b = box.getBoundingClientRect(), r = book.getBoundingClientRect(), p = panel.getBoundingClientRect();
    const x1 = r.right - b.left + 6, x2 = p.left - b.left;
    line.hidden = x2 - x1 < 8;
    Object.assign(line.style, { left: `${x1}px`, width: `${x2 - x1}px`, top: `${r.top + r.height / 2 - b.top}px` });
  }, [shown]);
  useLayoutEffect(placeLead, [placeLead, reflow]);
  useEffect(() => {
    addEventListener("resize", placeLead);
    document.fonts?.ready.then(placeLead, (error: unknown) => console.warn("learning: fonts did not load", error));
    // The book eases sideways when pointed at; place the lead again once it has settled.
    const late = setTimeout(placeLead, 420);
    return () => { removeEventListener("resize", placeLead); clearTimeout(late); };
  }, [placeLead]);

  const panelFor = (t: Title) => <Panel key={t.id} title={t} division={division} back={back} onPage={(page) => setViewer({ title: t, page })} />;
  const book = (t: Title) => {
    const k = division.kind[t.kind], { thick, width, dx } = bookShape(t, k.name), ready = t.status === "ready";
    const tone = division.audience[t.audience];
    const cls = ["lm-bk", `k-${t.kind}`, t.status, t.id === shown ? "is-on" : "", kind && t.kind !== kind ? "dim" : "", kind && t.kind === kind ? "lit" : ""].filter(Boolean).join(" ");
    const style = { "--t": thick, "--w": `${width}%`, "--dx": dx, "--tone": `var(--${tone.tone})`, "--tone-solid": `var(--${tone.tone}-tab)`, "--tone-ink": `var(--${tone.tone}-tab-ink)` } as CSSProperties;
    return <button key={t.id} type="button" className={cls} data-id={t.id} data-kind={t.kind} aria-pressed={t.id === kept} style={style}
      aria-label={`${t.title}, ${k.name}, ${ready ? "ready" : "planned"}`} onPointerEnter={() => setPointed(t.id)} onClick={() => { setKept(t.id); setPointed(null); }}>
      <span className="lm-bk-g"><Glyph name={k.glyph} size={15} strokeWidth={1.3} /></span><span className="lm-bk-t">{t.title}</span><span className="lm-bk-k">{k.name}</span>
      <span className="lm-bk-s">{ready ? "Ready" : "Planned"}</span>
    </button>;
  };

  return <div className="lm-st-view" ref={view}>
    <div className="lm-st-stack" onPointerLeave={() => setPointed(null)}>
      {groupsFor(division, audience.id).map(([track, list]) => <div key={track.id} className="lm-st-group">
        <div className="lm-st-label" title={track.name}><span>{track.short}</span></div>
        <div className="lm-st-books">{list.map(book)}</div>
      </div>)}
      <div className="lm-st-group lm-st-base-row"><span /><div className="lm-st-base" /></div>
    </div>
    <aside className="lm-panel" aria-label="The title pointed at">
      <StableTip className="lm-panel-tip" options={items.map(panelFor)} show={division.title[shown] ? panelFor(division.title[shown]) : null} />
    </aside>
    <i className="lm-lead" ref={lead} hidden aria-hidden="true" />
    {viewer?.title.record?.pageImages && <PageViewer title={viewer.title.title} images={viewer.title.record.pageImages} start={viewer.page} onClose={() => setViewer(null)} />}
  </div>;
}
