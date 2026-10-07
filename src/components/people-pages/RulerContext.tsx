import { ArrowUpRight, BookOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/letters/LetterParts";
import type { PersonRef, Ruler } from "@/data/people-pages/types";
import { personPath, rulerHref } from "@/lib/people-pages-index";
import { ClaimList, EvidenceClaim, QuoteText } from "./Evidence";
import { initials } from "./kinds";
import { prophetsForKingHref } from "./links";

type LensId = keyof Ruler["nation"];
const LENS_LABEL: Record<LensId, string> = { worship: "Worship", building: "Building", alliances: "Alliances & tribute", people: "The people" };

/** Builders lead with Building (Solomon's temple; the governors' temple and walls). */
const lensOrder = (ruler: Ruler): LensId[] => (ruler.kind === "governor" || ruler.id.startsWith("solomon-") ? ["building", "worship", "alliances", "people"] : ["worship", "building", "alliances", "people"]);

/** "What the nation did": four lenses in one glass panel; choosing one replaces the text in place (no fade). */
export function NationLenses({ ruler }: { ruler: Ruler }) {
  const order = lensOrder(ruler).filter((id) => ruler.nation[id]?.length);
  const [chosen, setChosen] = useState<LensId | undefined>(undefined);
  if (!order.length) return null;
  if (ruler.kind === "foreign") return <Section id="pp-nation" kicker="Dealings" title="Dealings with God's people" lead="What Scripture records between this ruler and Israel or Judah.">
    <ClaimList claims={order.flatMap((id) => ruler.nation[id])} />
  </Section>;
  const lens = chosen && order.includes(chosen) ? chosen : order[0];
  return <Section id="pp-nation" kicker="The nation" title="What the nation did" lead="Explore the reign through one lens at a time. Each line carries its verses.">
    <div className="pp-lenses" role="group" aria-label="Explore through">
      {lensOrder(ruler).map((id) => <button key={id} type="button" aria-pressed={lens === id} disabled={!ruler.nation[id]?.length} onClick={() => setChosen(id)}>{LENS_LABEL[id]}{ruler.nation[id]?.length ? ` · ${ruler.nation[id].length}` : ""}</button>)}
    </div>
    <div className="pp-lens-body" aria-live="polite"><ClaimList claims={ruler.nation[lens]} /></div>
  </Section>;
}

/** A person named on the page: their own page (a ruler's reign when they have one), or just the name. */
export function PersonName({ person }: { person: PersonRef }) {
  if (!person.personId) return <>{person.name}</>;
  return <Link to={rulerHref(person.personId)} className="underline decoration-[var(--lg-line)] underline-offset-2 hover:text-[var(--lg)]">{person.name}</Link>;
}

/** The prophets who confronted or counselled the ruler: medallion cards that open across their row. */
export function ReignProphets({ ruler }: { ruler: Ruler }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!ruler.prophets.length) return null;
  const about = ruler.kind === "foreign";
  return <Section id="pp-prophets" kicker="Prophets" title={about ? "The prophets who spoke about him" : "Prophets of the reign"}
    lead={about ? "Prophets who spoke of this ruler, with their words." : "Who stood before the ruler, and what they said. Choose a card to read the exchange."}
    aside={!about && <Link className="pp-link" to={prophetsForKingHref(ruler.id)}>Prophets through time, at this {ruler.kind === "judge" ? "judge" : "reign"} <ArrowUpRight size={14} aria-hidden /></Link>}>
    <ul className="lg-themes">
      {ruler.prophets.map((p, i) => {
        const isOpen = open === i;
        return <li key={p.person.name + i} className="lg-theme" data-open={isOpen ? "" : undefined}>
          <button type="button" className="lg-theme-head pp-prophet-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
            <span className="pp-medal" aria-hidden>{initials(p.person.name)}</span>
            <span><span className="lg-theme-title">{p.person.name}</span><span className="lg-theme-teaser" style={{ display: "block" }}>{p.quote ? `“${p.quote.text}”` : p.claim.text}</span></span>
          </button>
          {isOpen && <div className="lg-theme-body">
            {p.quote && <QuoteText quote={p.quote} />}
            <div style={{ marginTop: ".75rem" }}><EvidenceClaim claim={p.claim} as="div" /></div>
            {p.person.personId && <Link className="pp-link" style={{ marginTop: ".75rem" }} to={personPath(p.person.personId)}><BookOpen size={14} aria-hidden /> {p.person.name}'s page</Link>}
          </div>}
        </li>;
      })}
    </ul>
  </Section>;
}

/** The empires and foreign rulers of the time, and any record outside the Bible: kept visibly apart from Scripture. */
export function WorldStage({ ruler }: { ruler: Ruler }) {
  if (!ruler.worldStage.length && !ruler.outside.length) return null;
  return <Section id="pp-world" kicker="On the world stage" title="The powers of the day" lead="Foreign powers and rulers in the record of this reign. Records from outside the Bible have a sand-coloured edge.">
    {ruler.worldStage.length > 0 && <div className="pp-cards">
      {ruler.worldStage.map((w) => <article key={w.power} className="pp-card">
        <p className="lg-kicker">{w.power}</p>
        {w.rulers.length > 0 && <h4>{w.rulers.map((r, i) => <span key={r.name}>{i > 0 && " · "}<PersonName person={r} /></span>)}</h4>}
        <EvidenceClaim claim={w.claim} as="div" />
      </article>)}
    </div>}
    {ruler.outside.length > 0 && <>
      <p className="pp-label" style={{ marginTop: "1.2rem" }}>Outside the Bible</p>
      <div className="pp-cards">{ruler.outside.map((o) => <article key={o.name} className="pp-card" data-outside="">
        <p className="lg-kicker">Outside the Bible · {o.date}</p><h4>{o.name}</h4><EvidenceClaim claim={o.claim} as="div" plain />
      </article>)}</div>
    </>}
  </Section>;
}
