import { ArrowLeft, ArrowRight, ArrowUpRight, Crown, Landmark, Scale, Shield } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { cameFrom } from "@/lib/came-from";
import { formatYears } from "@/lib/eras";
import { PEOPLE_PAGES, rulerFor, rulerHref, type RulerSummary } from "@/lib/people-pages-index";
import { useCachedLoad } from "@/lib/people-pages";
import { loadProphets } from "@/lib/study";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { VERDICT, glowFor, pageHeading } from "./kinds";
import { eraOfYear } from "./links";
import { ribbonLayout } from "./ribbon-layout";
import { RulersColumn } from "./RulersColumn";
import { RulersRibbon } from "./RulersRibbon";
import { SlideLink } from "./SlideLink";
import { readyKey } from "./usePeoplePageSlide";
import "./people-pages.css";
import "./people-guides.css";

type FilterId = "all" | "judges" | "united" | "israel" | "judah" | "women" | "foreign" | "governors" | "rome";
const FILTERS: { id: FilterId; label: string; test: (r: RulerSummary) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "judges", label: "Leaders & judges", test: (r) => r.kind === "judge" || r.kind === "leader" },
  { id: "united", label: "United kingdom", test: (r) => r.realm === "united" },
  { id: "israel", label: "Kings of Israel", test: (r) => r.realm === "israel" },
  { id: "judah", label: "Kings of Judah", test: (r) => r.realm === "judah" },
  { id: "women", label: "Women", test: (r) => r.sex === "F" },
  { id: "foreign", label: "Foreign", test: (r) => r.kind === "foreign" },
  { id: "governors", label: "Governors", test: (r) => r.kind === "governor" },
  { id: "rome", label: "Herods & Rome", test: (r) => r.kind === "herod" || r.kind === "roman" },
];
const ICON = { judge: Scale, leader: Shield, governor: Landmark, herod: Landmark, roman: Landmark } as const;
const iconOf = (r: RulerSummary) => ICON[r.kind as keyof typeof ICON] ?? Crown;
/** The era a ruler belongs to: by the middle of their reign, or (judges, undated) the time of the judges. */
const eraOf = (r: RulerSummary) => (r.dates ? eraOfYear((r.dates.from + r.dates.to) / 2)?.label : undefined) ?? "The judges";

/**
 * Rulers through time (/study/people?view=rulers, PRESENTATION.md §5.1): every throne on the shared era bands, the
 * prophets beside them on request, a preview of the ruler pointed at, and the same rulers as cards, era by era.
 */
export function RulersGuide() {
  const phone = useMediaQuery("(max-width: 700px)");
  const rulers = PEOPLE_PAGES.rulers;
  const [showProphets, setShowProphets] = useState(false);
  const prophets = useCachedLoad("prophets", loadProphets);
  const order = useMemo(() => [...ribbonLayout(rulers, 1000).layout.bars].sort((a, b) => a.x0 - b.x0 || a.ruler.order - b.ruler.order).map((b) => b.ruler), [rulers]);
  const [focus, setFocus] = useState<RulerSummary | undefined>(() => rulerFor("david-rut-4-17") ?? order[0]);
  const [filter, setFilter] = useState<FilterId>("all");
  const counts = FILTERS.map((f) => ({ ...f, count: rulers.filter(f.test).length })).filter((f) => f.id === "all" || f.count > 0);
  const shown = order.filter(FILTERS.find((f) => f.id === filter)!.test);
  const eras = [...new Set(shown.map(eraOf))];
  return <section className="rg" aria-labelledby="rg-title" data-people-ready={readyKey({ kind: "guide", view: "rulers" })} style={{ "--lg": "var(--epistles)" } as CSSProperties}>
    <header className="rg-head">
      <p className="lg-kicker">Study · People · Rulers</p>
      <h2 id="rg-title">Thrones through <em>time.</em></h2>
      <p>Leaders, judges, kings and a queen, from Moses to the fall of Jerusalem, in the order of their reigns, with the prophets beside them. Bar colours show the throne; the symbol at each bar's end is Scripture's verdict.</p>
      <dl className="rg-figures">{counts.map((f) => <div key={f.id}><dt>{f.id === "all" ? "Rulers" : f.label}</dt><dd>{f.count}</dd></div>)}</dl>
    </header>
    <div className="rg-tools">
      <button type="button" className="lg-chip" aria-pressed={showProphets} onClick={() => setShowProphets(!showProphets)}>Show the prophets</button>
      <span className="rg-legend">{(["right", "evil", "mixed"] as const).map((t) => <span key={t}>{VERDICT[t].symbol} {VERDICT[t].label}</span>)}<span><i className="rg-dotted" /> In story order: Scripture gives no years BC</span></span>
    </div>
    {phone ? <RulersColumn rulers={rulers} focus={focus} onFocus={setFocus} />
      : <RulersRibbon rulers={rulers} prophets={showProphets && prophets.status === "ready" ? prophets.value : undefined} focus={focus} onFocus={setFocus} />}
    {focus && <RulerPreview ruler={focus} order={order} onStep={setFocus} />}
    <h3 className="rg-subtitle">Every ruler, era by era</h3>
    <div className="lg-chips" role="group" aria-label="Show">
      {counts.map((f) => <button key={f.id} type="button" className="lg-chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}{f.id !== "all" && <small> {f.count}</small>}</button>)}
    </div>
    {eras.map((era) => <section key={era} className="rg-era" aria-label={era}>
      <h4>{era}</h4>
      <ol className="rg-cards">{shown.filter((r) => eraOf(r) === era).map((r) => <RulerCard key={r.id} ruler={r} />)}</ol>
    </section>)}
  </section>;
}

/** The ruler pointed at: a big medallion, the verdict line, the years, and a step through every reign in order. */
function RulerPreview({ ruler, order, onStep }: { ruler: RulerSummary; order: RulerSummary[]; onStep: (r: RulerSummary) => void }) {
  const at = Math.max(0, order.findIndex((r) => r.id === ruler.id));
  const step = (by: number) => onStep(order[(at + by + order.length) % order.length]);
  const Icon = iconOf(ruler);
  return <article className="rg-preview" style={{ "--lg": glowFor(ruler.kind, ruler.realm) } as CSSProperties} aria-live="polite">
    <span className="rg-preview-medal" aria-hidden><Icon size={38} strokeWidth={1.4} /></span>
    <div className="rg-preview-body">
      <p className="lg-kicker">{ruler.title} · {eraOf(ruler)}</p>
      <h3>{ruler.name}</h3>
      <p className="rg-preview-verdict"><span aria-hidden>{VERDICT[ruler.verdictTone].symbol} </span>{ruler.verdict ? `“${ruler.verdict}”` : VERDICT[ruler.verdictTone].label}</p>
      <p className="rg-preview-when">{ruler.reignText}{ruler.dates ? ` · ${formatYears(ruler.dates.from, ruler.dates.to, ruler.dates.approx)}` : " · no years BC in Scripture"}{ruler.prophets.length ? ` · prophets: ${ruler.prophets.join(", ")}` : ""}</p>
      <SlideLink to={rulerHref(ruler.id)} state={cameFrom("Rulers through time")} className="rg-button">Open {pageHeading(ruler.kind, ruler.sex).replace(/^The /, "the ").replace(/^(His|Her) /, (w) => w.toLowerCase())} <ArrowUpRight size={15} aria-hidden /></SlideLink>
    </div>
    <div className="rg-step">
      <button type="button" onClick={() => step(-1)} aria-label="Previous ruler in time"><ArrowLeft size={18} /></button>
      <span>{at + 1} / {order.length}</span>
      <button type="button" onClick={() => step(1)} aria-label="Next ruler in time"><ArrowRight size={18} /></button>
    </div>
  </article>;
}

function RulerCard({ ruler }: { ruler: RulerSummary }) {
  const Icon = iconOf(ruler);
  return <li className="rg-card" style={{ "--lg": glowFor(ruler.kind, ruler.realm) } as CSSProperties}>
    <SlideLink to={rulerHref(ruler.id)} state={cameFrom("Rulers through time")}>
      <span className="rg-card-top"><Icon size={22} strokeWidth={1.5} aria-hidden /><span>{ruler.title}</span></span>
      <strong>{ruler.name}</strong>
      <span className="rg-card-line">{ruler.tagline}</span>
      <span className="rg-card-foot"><span>{ruler.dates ? formatYears(ruler.dates.from, ruler.dates.to, ruler.dates.approx) : ruler.reignText}</span>{ruler.verdictTone !== "none" && <span>{VERDICT[ruler.verdictTone].symbol} {VERDICT[ruler.verdictTone].label}</span>}</span>
    </SlideLink>
  </li>;
}
