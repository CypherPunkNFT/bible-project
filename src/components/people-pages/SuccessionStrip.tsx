import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import { Section, Refs } from "@/components/letters/LetterParts";
import type { Claim, Quote, Ruler } from "@/data/people-pages/types";
import { formatYears } from "@/lib/eras";
import { PEOPLE_PAGES, rulerFor, rulerHref, rulersOfRealm, type RulerSummary } from "@/lib/people-pages-index";
import { LANE_LABEL, VERDICT, WORLD_REALMS, laneOf } from "./kinds";
import { SlideLink } from "./SlideLink";
import { layoutStrip, linearYears, timeSpan, yearTicks, type StripBar } from "./strip-layout";
import { useCarried } from "./use-carried";
import { useStripPill } from "./use-strip-pill";
import { ClaimList } from "./Evidence";

const LABEL_H = 20, TRACK_H = 34, BAR_H = 26, LANE_GAP = 14, AXIS_H = 26, NOMINAL_W = 1000;
/** A neighbour in the line widens the window only if their reign is this close (years) to this one. */
const NEIGHBOUR_REACH = 80;

/** The lanes this ruler's strip shows: both thrones for the two kingdoms; the split for the united kingdom; for
 *  everyone else, the world stage's lanes with the governors, Rome and the two kingdoms. Empty lanes drop out. */
function lanesFor(ruler: Ruler): string[] {
  if (ruler.realm === "united") return ["united", "israel", "judah"];
  if (ruler.realm === "israel" || ruler.realm === "judah") return [...WORLD_REALMS, "israel", "judah"];
  if (ruler.realm === "tribes") return ["tribes"];
  return [...WORLD_REALMS, "governors", "rome", "israel", "judah"];
}

/** The years shown: up to two reigns either side of this one in its own line (if near in time), never under sixty years. */
function windowFor(summary: RulerSummary): [number, number] {
  const own = timeSpan(summary)!;
  const line = rulersOfRealm(summary.realm).filter((r) => timeSpan(r));
  const at = line.findIndex((r) => r.id === summary.id);
  const near = line.slice(Math.max(0, at - 2), at + 3).map((r) => timeSpan(r)!).filter((s) => s.to <= own.from + NEIGHBOUR_REACH && s.from >= own.to - NEIGHBOUR_REACH);
  let earliest = Math.max(own.from, ...near.map((s) => s.from)) + 4, latest = Math.min(own.to, ...near.map((s) => s.to)) - 4;
  if (summary.realm === "united") latest = Math.min(latest, 905);
  if (earliest - latest < 60) { const middle = (earliest + latest) / 2; earliest = middle + 30; latest = middle - 30; }
  return [earliest, latest];
}

type Tip = { bar: StripBar } | { quote: Quote; other?: RulerSummary } | null;

/** The signature picture: this reign among its neighbours, both kingdoms at once, joined by Scripture's cross-dating. */
export function SuccessionStrip({ ruler, summary, intro }: { ruler: Ruler; summary: RulerSummary; intro?: Claim[] }) {
  const carried = useCarried();
  const [tip, setTip] = useState<Tip>(null);
  const strip = useMemo(() => {
    if (!timeSpan(summary)) return null;
    const [earliest, latest] = windowFor(summary);
    const lanes = lanesFor(ruler);
    const inWindow = PEOPLE_PAGES.rulers.filter((r) => { const span = timeSpan(r); return span && span.to <= earliest && span.from >= latest && lanes.includes(laneOf(r)); });
    const x = linearYears(earliest, latest);
    const layout = layoutStrip(inWindow, laneOf, lanes, (y) => Math.min(100, Math.max(0, x(y))), 0.8);
    let top = 0;
    const laneTop = new Map<string, number>();
    for (const lane of layout.lanes) { laneTop.set(lane.id, top); top += LABEL_H + lane.tracks * TRACK_H + LANE_GAP; }
    const topY = (bar: StripBar) => (laneTop.get(bar.lane) ?? 0) + LABEL_H + bar.track * TRACK_H;
    const centreY = (bar: StripBar) => topY(bar) + BAR_H / 2;
    return { earliest, latest, x, layout, laneTop, height: top + AXIS_H, centreY, topY };
  }, [ruler, summary]);
  const here = strip?.layout.bars.find((b) => b.ruler.id === ruler.id);
  const pill = useStripPill(here ? (here.x0 + here.x1) / 200 : undefined);
  const before = summary.predecessor ? rulerFor(summary.predecessor) : undefined;
  const after = summary.successor ? rulerFor(summary.successor) : undefined;
  const powers = ruler.worldStage.map((w) => w.power);
  const worldShown = strip?.layout.lanes.some((l) => WORLD_REALMS.includes(l.id as Ruler["realm"]));

  const lead = ruler.realm === "united" ? "One lane for the united kingdom, which splits in two at Rehoboam. Each bar is a reign; choose one to open it."
    : ruler.realm === "israel" || ruler.realm === "judah" ? "Both thrones at once. The lines are Scripture's own cross-dating between the two kingdoms. Each bar is a reign; choose one to open it."
      : "This rule among its neighbours. Each bar is a ruler; choose one to open their page.";
  return <Section id="pp-succession" kicker="Succession" title={ruler.realm === "united" || ruler.realm === "israel" || ruler.realm === "judah" ? "The two kingdoms" : "Before and after"} lead={lead}>
    {!strip ? <SequenceStrip summary={summary} intro={intro} /> : <>
      {powers.length > 0 && !worldShown && <p className="pp-label" style={{ marginBottom: ".75rem" }}>On the world stage: <span className="lg-muted" style={{ letterSpacing: 0, textTransform: "none", fontWeight: 400 }}>{powers.join(" · ")}</span></p>}
      <div ref={pill.frame} className="pp-strip-frame">
        <div className="pp-strip" style={{ height: strip.height }}>
          {strip.layout.lanes.map((lane) => <StripLane key={lane.id} id={lane.id} top={strip.laneTop.get(lane.id)!} tracks={lane.tracks}
            bars={strip.layout.bars.filter((b) => b.lane === lane.id)} current={ruler.id} carried={carried} onTip={setTip} />)}
          <svg className="pp-strip-lines" viewBox={`0 0 100 ${strip.height}`} preserveAspectRatio="none" aria-hidden>
            <SplitLines bars={strip.layout.bars} centreY={strip.centreY} />
            {ruler.synchronisms?.map((s) => {
              const other = strip.layout.bars.find((b) => b.ruler.id === s.otherRulerId);
              if (!other || !here) return null;
              // From edge to edge, never across a bar, so the names on the bars stay readable (lines run under the bars).
              const above = strip.topY(other) < strip.topY(here);
              const d = `M${(other.x0 + other.x1) / 2} ${above ? strip.topY(other) + BAR_H : strip.topY(other)} L${here.x0 + 0.6} ${above ? strip.topY(here) : strip.topY(here) + BAR_H}`;
              return <g key={s.quote.span.join("-")} onMouseEnter={() => setTip({ quote: s.quote, other: other.ruler })} onMouseLeave={() => setTip(null)}>
                <path d={d} className="pp-sync" />
                <path d={d} className="pp-sync-hit" />
              </g>;
            })}
          </svg>
          <div className="pp-strip-axis" style={{ top: strip.height - AXIS_H }}>
            {/* Ticks too near an edge would hang outside the frame (and scroll it): they are left out. */}
            {yearTicks(strip.earliest, strip.latest).filter((t) => strip.x(t) >= 4 && strip.x(t) <= 96).map((t) => <span key={t} style={{ left: `${strip.x(t)}%` }}>{formatYears(t, t)}</span>)}
          </div>
        </div>
      </div>
      <div ref={pill.pill} className="pp-hpill" onPointerDown={pill.onPillDown} aria-hidden><span ref={pill.thumb} /></div>
      <div className="lg-tip" aria-live="polite">{tip && "bar" in tip ? <><strong>{tip.bar.ruler.name}</strong> <span className="lg-muted">· {tip.bar.ruler.title} · {tip.bar.ruler.reignText}{tip.bar.ruler.dates && ` · ${formatYears(tip.bar.ruler.dates.from, tip.bar.ruler.dates.to, tip.bar.ruler.dates.approx)}`} · {VERDICT[tip.bar.ruler.verdictTone].symbol} {VERDICT[tip.bar.ruler.verdictTone].label}</span></>
        : tip ? <><span>“{tip.quote.text}”</span><Refs refs={[tip.quote.span]} /></>
          : <span className="lg-muted">{ruler.synchronisms?.length ? "Point at a line to read the verse that dates one reign by the other. " : ""}Point at a bar to name the reign. Bars use {summary.dates?.label || "the main dating"}; other systems are under “Dates differ”.{strip.layout.bars.some((b) => b.undated) ? " A dotted bar has no years of its own: it stands beside the rulers Scripture names with it." : ""}</span>}</div>
    </>}
    <CrossDating ruler={ruler} />
    <nav className="pp-strip-nav" aria-label="Neighbouring reigns">
      {before ? <SlideLink to={rulerHref(before.id)} state={carried} rel="prev"><ArrowLeft size={16} aria-hidden />Before: {before.name}</SlideLink> : <span />}
      {after ? <SlideLink to={rulerHref(after.id)} state={carried} rel="next">After: {after.name}<ArrowRight size={16} aria-hidden /></SlideLink> : <span />}
    </nav>
  </Section>;
}

/**
 * Rulers Scripture gives no years BC for (the judges): the line in the order of the book, each as long as the years
 * Scripture gives (a set width where it gives none), never placed on a guessed scale. The book's own totals follow.
 */
function SequenceStrip({ summary, intro }: { summary: RulerSummary; intro?: Claim[] }) {
  const carried = useCarried();
  const line = rulersOfRealm(summary.realm);
  const at = line.findIndex((r) => r.id === summary.id);
  const pill = useStripPill(line.length ? (at + 0.5) / line.length : undefined);
  const [tip, setTip] = useState<RulerSummary | null>(null);
  return <>
    <div ref={pill.frame} className="pp-strip-frame">
      <nav className="pp-seq" aria-label={`The line in order: ${line.length}`}>
        {line.map((r) => <SlideLink key={r.id} to={rulerHref(r.id)} state={carried} className="pp-sbar" aria-current={r.id === summary.id ? "page" : undefined}
          style={{ flexGrow: r.years ?? 12 }} data-unknown={r.years ? undefined : ""} aria-label={`${r.name}, ${r.title}: ${r.reignText}`}
          onMouseEnter={() => setTip(r)} onMouseLeave={() => setTip(null)} onFocus={() => setTip(r)} onBlur={() => setTip(null)}><span>{r.name}</span></SlideLink>)}
      </nav>
    </div>
    <div ref={pill.pill} className="pp-hpill" onPointerDown={pill.onPillDown} aria-hidden><span ref={pill.thumb} /></div>
    <div className="lg-tip" aria-live="polite">{tip ? <><strong>{tip.name}</strong> <span className="lg-muted">· {tip.title} · {tip.reignText}</span></>
      : <span className="lg-muted">{summary.realm === "tribes" ? "In the order of the book. Each bar is as long as the years Scripture gives; a dotted bar means Scripture gives no number. No year BC is given for any of them." : "In the order of the story. A dotted bar means Scripture gives no length; none of these has years of its own in Scripture."}</span>}</div>
    {intro?.length ? <details className="lg-more"><summary>How long was the time of the judges? Scripture's own numbers</summary><ClaimList claims={intro} /></details> : null}
  </>;
}

/** Every cross-dating verse of this reign, each naming the other ruler (their reign, or their person page). */
function CrossDating({ ruler }: { ruler: Ruler }) {
  const carried = useCarried();
  if (!ruler.synchronisms?.length) return null;
  return <details className="lg-more">
    <summary>Cross-dated in Scripture · {ruler.synchronisms.length}</summary>
    <ul className="pp-claims" style={{ marginTop: ".6rem" }}>{ruler.synchronisms.map((s) => {
      const other = rulerFor(s.otherRulerId);
      return <li key={s.quote.span.join("-")}>“{s.quote.text}”<Refs refs={[s.quote.span]} /> <span className="lg-muted">· with </span>
        <SlideLink to={rulerHref(s.otherRulerId)} state={other ? carried : undefined} className="pp-link">{other?.name ?? s.otherRulerId.split("-")[0].replace(/^./, (c) => c.toUpperCase())}</SlideLink></li>;
    })}</ul>
  </details>;
}

/** One lane of bars; the arrow keys move along it. */
function StripLane({ id, top, tracks, bars, current, carried, onTip }: { id: string; top: number; tracks: number; bars: StripBar[]; current: string; carried: ReturnType<typeof useCarried>; onTip: (tip: Tip) => void }) {
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>("a")];
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (at < 0) return;
    event.preventDefault();
    links[Math.min(links.length - 1, Math.max(0, at + (event.key === "ArrowRight" ? 1 : -1)))].focus();
  };
  const ordered = [...bars].sort((a, b) => a.x0 - b.x0);
  return <div className="pp-strip-lane" style={{ top, height: LABEL_H + tracks * TRACK_H }} onKeyDown={move}>
    <span className="pp-strip-lane-label">{LANE_LABEL[id] ?? id}</span>
    {ordered.map((bar, i) => {
      const r = bar.ruler, fits = ((bar.x1 - bar.x0) / 100) * NOMINAL_W > r.name.length * 7.2 + 26;
      const coup = r.realm === "israel" && i > 0 && ordered[i - 1].ruler.house !== r.house;
      const label = `${r.name}, ${r.title}, ${r.reignText}${r.dates ? `, ${formatYears(r.dates.from, r.dates.to, r.dates.approx)}` : ""}, ${VERDICT[r.verdictTone].spoken}`;
      return <SlideLink key={r.id} to={rulerHref(r.id)} state={carried} className="pp-sbar" aria-label={label} aria-current={r.id === current ? "page" : undefined}
        data-coup={coup ? "" : undefined} data-undated={bar.undated ? "" : undefined} style={{ left: `${bar.x0}%`, width: `${bar.x1 - bar.x0}%`, top: LABEL_H + bar.track * TRACK_H }}
        onMouseEnter={() => onTip({ bar })} onMouseLeave={() => onTip(null)} onFocus={() => onTip({ bar })} onBlur={() => onTip(null)}>
        {fits && <span>{r.name}</span>}{fits && r.verdictTone !== "none" && <i aria-hidden>{VERDICT[r.verdictTone].symbol}</i>}
      </SlideLink>;
    })}
  </div>;
}

/** The kingdom divides: Solomon's bar runs on into the first kings of Israel and of Judah (1 Kings 12). */
function SplitLines({ bars, centreY }: { bars: StripBar[]; centreY: (bar: StripBar) => number }) {
  const united = bars.filter((b) => b.lane === "united").sort((a, b) => b.x1 - a.x1)[0];
  if (!united) return null;
  const firsts = ["israel", "judah"].map((lane) => bars.filter((b) => b.lane === lane).sort((a, b) => a.x0 - b.x0)[0]).filter(Boolean);
  return <>{firsts.map((first) => {
    const x0 = united.x1, y0 = centreY(united), x1 = first.x0, y1 = centreY(first);
    return <path key={first.lane} d={`M${x0} ${y0} C${x0 + 2} ${y0} ${x1 - 2} ${y1} ${x1} ${y1}`} className="pp-split" />;
  })}</>;
}
