import { useState } from "react";
import { Link } from "react-router-dom";
import type { Ruler } from "@/data/people-pages/types";
import { formatYears } from "@/lib/eras";
import { prophetFor, prophetHref, rulerFor, rulerHref, rulersOfRealm, type RulerSummary } from "@/lib/people-pages-index";
import { REALM_LABEL, VERDICT, isConsort, ordinal, reignLength } from "./kinds";
import { atlasCityHref, eraOfYear } from "./links";
import { AspectSwitch } from "./PersonEntry";
import { SlideLink } from "./SlideLink";
import { useCarried } from "./use-carried";

/** The reign at a glance: name, the line under it, five figures, and the whole line of rulers with this one lit. */
export function RulerHero({ ruler, summary }: { ruler: Ruler; summary: RulerSummary }) {
  const [dating, setDating] = useState(false);
  const main = summary.dates;
  const middle = main ? (main.from + main.to) / 2 : summary.near;
  const era = middle !== undefined ? eraOfYear(middle) : undefined;
  const line = rulersOfRealm(ruler.realm);
  const place = line.findIndex((r) => r.id === ruler.id) + 1;
  const judge = ruler.kind === "judge" || ruler.kind === "leader";
  // What the first figures are called for each kind of ruler (PRESENTATION.md §3.10).
  const held = judge ? "Led Israel" : isConsort(ruler) ? "Queen" : ruler.kind === "governor" ? "Governed" : ruler.kind === "herod" || ruler.kind === "roman" ? "Ruled" : "Reigned";
  const seat = ruler.kind === "governor" || ruler.kind === "roman" || ruler.kind === "herod" ? "Seat" : "Capital";
  // "3rd of 20 in Judah" only where the realm is one line of rulers, not the other nations gathered together.
  const inLine = place > 0 && ruler.realm !== "other" ? `${ordinal(place)} of ${line.length} in ${REALM_LABEL[ruler.realm].split(" (")[0]}` : undefined;
  const tone = VERDICT[ruler.verdictTone];
  const capitalHref = atlasCityHref(ruler.capital?.name);
  const length = reignLength(ruler.reign);
  const said = summary.verdict?.replace(/^["“]+|["”]+$/g, "");
  return <section className="lg-glass lg-hero pp-hero" aria-labelledby="pp-hero-title">
    <div className="pp-hero-head">
      <p className="lg-kicker">{ruler.title}{era ? ` · ${era.label}` : ` · ${REALM_LABEL[ruler.realm]}`}</p>
      <AspectSwitch id={ruler.id} name={ruler.name} current="rule" />
    </div>
    <h2 id="pp-hero-title">{ruler.name}.<em>{ruler.tagline}</em></h2>
    {(ruler.otherNames?.length || ruler.title.toLowerCase().includes("prophet")) && <div className="pp-badges">
      {ruler.otherNames?.length ? <span className="pp-badge">Also called {ruler.otherNames.join(", ")}</span> : null}
      {ruler.title.toLowerCase().includes("prophet") && (prophetFor(ruler.id)
        ? <Link className="pp-badge" to={prophetHref(ruler.id)}>{ruler.title.toLowerCase().includes("prophetess") ? "Prophetess" : "Prophet"} · the word →</Link>
        : <Link className="pp-badge" to="/study/people?view=prophets">{ruler.title.toLowerCase().includes("prophetess") ? "Prophetess" : "Prophet"} · in Prophets through time →</Link>)}
    </div>}
    <dl className="pp-stats">
      <div className="pp-stat">
        <dt>{held}<button type="button" className="pp-info" aria-expanded={dating} aria-controls="pp-dating-note" aria-label="How the dates are worked out" onClick={() => setDating(!dating)}>i</button></dt>
        <dd>{length || "Not given"}<small>{main ? `${formatYears(main.from, main.to, main.approx)}${ruler.dates.length > 1 ? " (dates vary)" : ""}` : length ? "No years BC in Scripture" : ruler.reign.text}</small></dd>
        {dating && <div id="pp-dating-note" className="pp-stat-note">
          {ruler.reign.text && <p>Scripture: “{ruler.reign.text}”.</p>}
          {ruler.dates.filter((d) => d.from).map((d) => <p key={d.system + d.label}>{d.label}: {formatYears(d.from!, d.to ?? d.from!, d.approx)}</p>)}
          <a href="#pp-dating" className="pp-link">Dates differ: every view</a>
        </div>}
      </div>
      <div className="pp-stat">
        <dt>{judge || (!ruler.capital && ruler.tribe) ? "Tribe" : seat}</dt>
        <dd>{judge || !ruler.capital ? ruler.tribe ?? "Not stated" : capitalHref ? <Link to={capitalHref}>{ruler.capital.name}</Link> : ruler.capital.name}</dd>
      </div>
      <div className="pp-stat">
        <dt>{judge ? "In the line" : "House"}</dt>
        <dd>{judge ? `${ordinal(place)} of ${line.length}` : ruler.house ?? "Not stated"}{!judge && inLine && <small>{inLine}</small>}</dd>
      </div>
      <div className="pp-stat" data-wide="">
        <dt>{ruler.verdictTone === "none" ? "Scripture says" : "Verdict"}</dt>
        <dd>{ruler.verdictTone === "none" ? <small className="pp-said">{said ? `“${said}”` : "No verdict formula"}</small> : <><span aria-hidden>{tone.symbol} </span>{tone.label}{said && <small>“{said}”</small>}</>}</dd>
      </div>
      <div className="pp-stat">
        <dt>Prophets</dt>
        <dd>{ruler.prophets.length ? ruler.prophets.map((p, i) => <span key={p.person.name}>{i > 0 && " · "}{p.person.personId ? <Link to={prophetHref(p.person.personId)}>{p.person.name}</Link> : p.person.name}</span>) : "None named"}</dd>
      </div>
    </dl>
    {line.length > 1 && <RealmLane line={line} current={ruler.id} />}
  </section>;
}

/** The whole line of this realm's rulers as one thin strip; pointing names a ruler, choosing one opens their reign. */
function RealmLane({ line, current }: { line: RulerSummary[]; current: string }) {
  const carried = useCarried();
  const [tip, setTip] = useState<RulerSummary | null>(null);
  const here = rulerFor(current);
  const resting = here ? `${here.name} glows. Point at another to name them; choose one to open their reign.` : "";
  return <div className="pp-lane">
    <p className="pp-lane-label"><span>{REALM_LABEL[line[0].realm]}: {line.length} rulers</span><span>{line[0].name} → {line[line.length - 1].name}</span></p>
    <nav className="pp-lane-track" aria-label={`The rulers of ${REALM_LABEL[line[0].realm]}`}>
      {line.map((r) => <SlideLink key={r.id} to={rulerHref(r.id)} state={carried} aria-current={r.id === current ? "page" : undefined}
        style={{ flexGrow: r.years ?? 12 }} aria-label={`${r.name}, ${r.title}${r.years ? `, ${r.years} years` : ""}`}
        onMouseEnter={() => setTip(r)} onMouseLeave={() => setTip(null)} onFocus={() => setTip(r)} onBlur={() => setTip(null)} />)}
    </nav>
    {/* Every line the tip can show sits in one grid cell, hidden but measured, so the box is always as tall as the
        longest and never jumps when a two-line name is pointed at. */}
    <div className="pp-lane-tip">
      {[resting, ...line.map(laneTip)].map((text, i) => <span key={i} className="pp-lane-tip-sizer" aria-hidden="true">{text}</span>)}
      <span aria-live="polite">{tip ? laneTip(tip) : resting}</span>
    </div>
  </div>;
}

/** The tip line for one ruler in the realm strip. */
function laneTip(r: RulerSummary): string {
  return `${r.name} · ${r.reignText || r.title}${r.dates ? ` · ${formatYears(r.dates.from, r.dates.to, r.dates.approx)}` : ""}`;
}
