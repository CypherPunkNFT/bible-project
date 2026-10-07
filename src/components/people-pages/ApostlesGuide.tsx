import { ArrowLeft, ArrowUpRight, Cross } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { RevealSelection } from "@/pages/places/RevealSelection";
import { cameFrom } from "@/lib/came-from";
import { PEOPLE_PAGES, personPath, type ApostleSummary } from "@/lib/people-pages-index";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { ListsOfTwelve } from "./GospelStrip";
import { APOSTLE_GLOW, initials } from "./kinds";
import { SlideLink } from "./SlideLink";
import { readyKey } from "./usePeoplePageSlide";
import "@/components/letters/letters.css";
import "@/pages/places/places-collection.css";
import "./people-pages.css";
import "./people-guides.css";

/** The betrayer keeps his place in the ring, drawn dashed; Matthias stands in it (Acts 1:26). */
const JUDAS = "judas-mat-10-4";
/** Named beside the apostles in Acts and the letters (PRESENTATION.md §4.8): names only here, each opening their page. */
const WIDER: [string, string][] = [["Barnabas", "barnabas-act-4-36"], ["James, the Lord's brother", "james-mat-13-55"], ["Silas", "silas-act-15-22"], ["Timothy", "timothy-act-16-1"],
  ["Apollos", "apollos-act-18-24"], ["Priscilla", "priscilla-act-18-2"], ["Aquila", "aquila-act-18-2"], ["Andronicus", "andronicus-rom-16-7"], ["Junia", "junia-rom-16-7"]];

/** The ring's twelve (those in the lists of the Twelve), the one chosen in Judas's place, and those called later. */
function circles(apostles: ApostleSummary[]) {
  const ordered = [...apostles].sort((a, b) => a.order - b.order);
  const twelve = ordered.filter((a) => a.lists?.length);
  const [replacement, ...later] = ordered.filter((a) => !a.lists?.length);
  return { twelve, replacement, later };
}

/**
 * The apostles (/study/people?view=apostles, PRESENTATION.md §5.2): the Twelve as a ring, Matthias in Judas's place,
 * Paul outside it; each medallion opens a preview in place; the four lists compared; the wider circle.
 */
export function ApostlesGuide() {
  const phone = useMediaQuery("(max-width: 700px)");
  const [chosen, setChosen] = useState<ApostleSummary | null>(null);
  const [mode, setMode] = useState<"ring" | "lists">("ring");
  const [wider, setWider] = useState(false);
  const { twelve, replacement, later } = circles(PEOPLE_PAGES.apostles);
  const medal = (a: ApostleSummary, style?: CSSProperties) => <button key={a.id} type="button" className="ag-medal" data-dashed={a.id === JUDAS ? "" : undefined} data-selection-key={a.id} style={style}
    onClick={() => setChosen(a)} aria-label={`${a.name}: ${a.title}. Show a preview`}><span className="ag-medal-disc">{initials(a.name)}</span><span className="ag-medal-name">{a.name}</span></button>;
  const ring = phone ? <div className="ag-grid">
    {twelve.map((a) => medal(a))}{replacement && medal(replacement)}
    {later.map((a) => <button key={a.id} type="button" className="ag-wide" data-selection-key={a.id} onClick={() => setChosen(a)}><span className="ag-medal-disc">{initials(a.name)}</span><span><strong>{a.name}</strong><small>{a.title}</small></span></button>)}
  </div> : <div className="ag-stage">
    <svg className="ag-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <circle cx="42" cy="50" r="33" />{later.length > 0 && <path d="M75 50 Q 84 50 90 50" />}
      {wider && <circle cx="42" cy="50" r="46" className="ag-wider-ring" />}
    </svg>
    <span className="ag-centre" aria-hidden><Cross size={34} strokeWidth={1.3} /></span>
    {twelve.map((a, i) => {
      const angle = (i / twelve.length) * Math.PI * 2 - Math.PI / 2;
      return medal(a, { left: `${42 + Math.cos(angle) * 33}%`, top: `${50 + Math.sin(angle) * 33}%` });
    })}
    {replacement && (() => { const slot = twelve.findIndex((a) => a.id === JUDAS); const angle = ((slot < 0 ? twelve.length - 1 : slot) / twelve.length) * Math.PI * 2 - Math.PI / 2;
      return medal(replacement, { left: `${42 + Math.cos(angle) * 18}%`, top: `${50 + Math.sin(angle) * 17}%` }); })()}
    {later.map((a, i) => medal(a, { left: "90%", top: `${50 + i * 18}%` }))}
    {wider && WIDER.map(([name, id], i) => { const angle = (i / WIDER.length) * Math.PI * 1.2 + Math.PI * 0.4;
      return <Link key={id} to={personPath(id)} state={cameFrom("The apostles")} className="ag-wider" style={{ left: `${42 + Math.cos(angle) * 46}%`, top: `${50 + Math.sin(angle) * 46}%` }}>{name}</Link>; })}
  </div>;
  return <section className="rg ag" aria-labelledby="ag-title" data-people-ready={readyKey({ kind: "guide", view: "apostles" })} style={{ "--lg": APOSTLE_GLOW } as CSSProperties}>
    <header className="rg-head">
      <p className="lg-kicker">Study · People · Apostles</p>
      <h2 id="ag-title">The Twelve, and one <em>untimely born.</em></h2>
      <p>Where each was called, where they went, and how their stories end, with Scripture and later tradition kept apart. Choose a medallion to preview a life.</p>
      <dl className="rg-figures"><div><dt>The Twelve</dt><dd>{twelve.length}</dd></div><div><dt>Chosen after</dt><dd>{(replacement ? 1 : 0) + later.length}</dd></div><div><dt>Pages</dt><dd>{PEOPLE_PAGES.apostles.length}</dd></div></dl>
    </header>
    <div className="rg-tools" role="group" aria-label="Show">
      <button type="button" className="lg-chip" aria-pressed={mode === "lists"} onClick={() => { setMode(mode === "lists" ? "ring" : "lists"); setChosen(null); }}>The lists compared</button>
      {!phone && mode === "ring" && <button type="button" className="lg-chip" aria-pressed={wider} onClick={() => setWider(!wider)}>The wider circle</button>}
    </div>
    {mode === "lists" ? <div className="lg-glass"><ListsOfTwelve /></div>
      : <RevealSelection expanded={Boolean(chosen)} selectionKey={chosen?.id ?? ""} grid={ring} onBack={() => setChosen(null)}>{chosen && <ApostlePreview apostle={chosen} onBack={() => setChosen(null)} />}</RevealSelection>}
    {phone && <p className="rg-wider-list"><strong>The wider circle:</strong> {WIDER.map(([name, id], i) => <span key={id}>{i > 0 && " · "}<Link to={personPath(id)} state={cameFrom("The apostles")}>{name}</Link></span>)}</p>}
    <h3 className="rg-subtitle">Every apostle</h3>
    <ol className="rg-cards">{[...PEOPLE_PAGES.apostles].sort((a, b) => a.order - b.order).map((a) => <li key={a.id} className="rg-card">
      <SlideLink to={personPath(a.id, "mission")} state={cameFrom("The apostles")}>
        <span className="rg-card-top"><span className="ag-mini" data-dashed={a.id === JUDAS ? "" : undefined}>{initials(a.name)}</span><span>{a.title}</span></span>
        <strong>{a.name}</strong><span className="rg-card-line">{a.tagline}</span>
      </SlideLink>
    </li>)}</ol>
  </section>;
}

/** The preview that rolls down in place of the ring (the Atlas reveal). */
function ApostlePreview({ apostle, onBack }: { apostle: ApostleSummary; onBack: () => void }) {
  return <article className="lg-glass ag-preview">
    <button type="button" className="places-collections-back" onClick={onBack}><ArrowLeft size={14} aria-hidden /> All the apostles</button>
    <div className="ag-preview-head"><span className="ag-medal-disc ag-big" data-dashed={apostle.id === JUDAS ? "" : undefined}>{initials(apostle.name)}</span>
      <div><p className="lg-kicker">{apostle.title}</p><h3 className="lg-title">{apostle.name}</h3>{apostle.otherNames.length > 0 && <p className="lg-muted">Also called {apostle.otherNames.join(", ")}</p>}</div></div>
    <dl className="lg-facts">
      <div className="lg-fact"><dt>Called</dt><dd>{apostle.called ?? "Scripture does not tell the scene"}</dd></div>
      <div className="lg-fact"><dt>From · trade</dt><dd>{[apostle.home, apostle.trade].filter(Boolean).join(" · ") || "Scripture does not say"}</dd></div>
      <div className="lg-fact"><dt>How the story ends · Scripture</dt><dd>{apostle.ending ?? "Scripture does not record it"}</dd></div>
      {apostle.tradition && <div className="lg-fact"><dt>Later tradition says</dt><dd>{apostle.tradition}</dd></div>}
    </dl>
    <SlideLink to={personPath(apostle.id, "mission")} state={cameFrom("The apostles")} className="rg-button" style={{ marginTop: "1rem" }}>Open his mission <ArrowUpRight size={15} aria-hidden /></SlideLink>
  </article>;
}
