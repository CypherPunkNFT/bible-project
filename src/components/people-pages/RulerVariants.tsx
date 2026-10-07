import { Fragment } from "react";
import { Section } from "@/components/letters/LetterParts";
import type { Claim, Ruler } from "@/data/people-pages/types";
import { PEOPLE_PAGES, rulerHref } from "@/lib/people-pages-index";
import { ClaimList, EvidenceClaim } from "./Evidence";
import { PersonName } from "./RulerContext";
import { SlideLink } from "./SlideLink";
import { useCarried } from "./use-carried";

/** The parts of a ruler page only some kinds of ruler have (PRESENTATION.md §3.10). */

const STAGES = ["Forgot God", "Oppressed", "Cried out", "Delivered", "Rest"] as const;

/** The judges' cycle as a ring, this judge's deliverance lit, with Scripture's words for each turn beside it. */
export function JudgeCycle({ ruler }: { ruler: Ruler }) {
  const c = ruler.cycle;
  if (!c) return null;
  const restClaim: Claim | undefined = c.rest ? { text: `The land had rest ${c.rest.years} years.`, layer: "scripture", refs: [c.rest.span] } : undefined;
  const parts: (Claim | undefined)[] = [c.sin, c.oppressor?.claim, c.cry, c.deliverance, restClaim];
  const R = 92, centre = 120;
  const at = (i: number) => { const a = (i / STAGES.length) * Math.PI * 2 - Math.PI / 2; return [centre + Math.cos(a) * R, centre + Math.sin(a) * R] as const; };
  return <Section id="pp-cycle" kicker="The cycle" title="Forgetting, oppression, a cry, a deliverer, rest" lead="The pattern the book of Judges repeats. The lit turn is this judge's part in it.">
    <div className="pp-cycle">
      <svg viewBox="-10 -18 260 272" role="img" aria-label={`The cycle: ${STAGES.map((s, i) => `${s}${parts[i] ? "" : " (not stated)"}`).join(", ")}. ${ruler.name} is the deliverer.`}>
        <circle cx={centre} cy={centre} r={R} fill="none" stroke="var(--lg-line)" strokeWidth="1.5" strokeDasharray="3 5" />
        {STAGES.map((stage, i) => {
          const [x, y] = at(i), lit = i === 3, present = Boolean(parts[i]);
          return <g key={stage} opacity={present ? 1 : 0.35}>
            <circle cx={x} cy={y} r={lit ? 21 : 15} fill={lit ? "var(--lg)" : "var(--surface)"} stroke="var(--lg)" strokeWidth={lit ? 0 : 1.2} className={lit ? "lg-glow" : undefined} />
            <text x={x} y={y + 4} textAnchor="middle" style={{ font: `600 ${lit ? 12 : 11}px var(--font-sans)`, fill: lit ? "var(--page)" : "var(--ink)" }}>{i + 1}</text>
            <text x={x} y={y + (y < centre ? -26 : 36)} textAnchor="middle" className="lg-svg-text">{stage}</text>
          </g>;
        })}
        <text x={centre} y={centre - 2} textAnchor="middle" className="lg-svg-strong">{ruler.name}</text>
        <text x={centre} y={centre + 14} textAnchor="middle" className="lg-svg-text">{c.judged ? `judged ${c.judged.years} years` : "the deliverer"}</text>
      </svg>
      <ol className="pp-claims">
        {STAGES.map((stage, i) => <li key={stage}><span className="pp-label" style={{ display: "block", marginBottom: ".15rem" }}>{i + 1} · {stage}{i === 1 && c.oppressor ? `: ${c.oppressor.name}${c.oppressor.years ? `, ${c.oppressor.years} years` : ""}` : ""}</span>
          {parts[i] ? <EvidenceClaim claim={parts[i]} as="div" /> : <span className="lg-muted">Scripture does not say.</span>}</li>)}
      </ol>
    </div>
  </Section>;
}

/** How the ruler came to power: the anointing scene (Saul, David, Solomon) or the coup. */
export function Accession({ ruler }: { ruler: Ruler }) {
  if (!ruler.accession?.length) return null;
  const anointed = ruler.accession.some((c) => /anoint/i.test(c.text));
  return <Section id="pp-accession" kicker={anointed ? "The anointing" : "Accession"} title={anointed ? `How ${ruler.name} was anointed` : `How ${ruler.name} came to power`}>
    <ClaimList claims={ruler.accession} />
  </Section>;
}

/** Governors and Romans: who held authority over whom, from the throne of the empire down to this ruler. */
export function ChainOfAuthority({ ruler }: { ruler: Ruler }) {
  if (ruler.kind !== "governor" && ruler.kind !== "roman") return null;
  const above = ruler.worldStage.flatMap((w) => w.rulers.slice(0, 1).map((person) => ({ person, power: w.power })));
  if (!above.length) return null;
  return <Section id="pp-chain" kicker="Authority" title="Under whom, over whom" lead="The chain of authority as Scripture names it.">
    <div className="pp-chain">
      {above.map(({ person, power }) => <Fragment key={person.name}><span><PersonName person={person} /> <small className="lg-muted">· {power}</small></span><i aria-hidden>→</i></Fragment>)}
      <span data-here="">{ruler.name}</span>
    </div>
  </Section>;
}

/** The name Herod covers several men: the family strip, this one lit. */
export function HerodFamily({ ruler }: { ruler: Ruler }) {
  const carried = useCarried();
  if (ruler.kind !== "herod") return null;
  const herods = PEOPLE_PAGES.rulers.filter((r) => r.kind === "herod").sort((a, b) => a.order - b.order);
  if (herods.length < 2) return null;
  return <Section id="pp-herods" kicker="The Herods" title="Which Herod this is" lead="The name covers several men, father, sons and grandsons. This one is lit.">
    <nav className="pp-chain" aria-label="The Herod family">
      {herods.map((h, i) => <Fragment key={h.id}>{i > 0 && <i aria-hidden>→</i>}{h.id === ruler.id ? <span data-here="" aria-current="page">{h.name}</span>
        : <SlideLink to={rulerHref(h.id)} state={carried} className="pp-badge">{h.name}</SlideLink>}</Fragment>)}
    </nav>
  </Section>;
}
