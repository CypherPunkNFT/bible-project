import { ArrowUpRight, BookOpen, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LetterMap } from "@/components/letters/LetterMap";
import { Refs, Section } from "@/components/letters/LetterParts";
import { PeopleNetwork } from "@/components/letters/PeopleNetwork";
import type { LetterGroup, MapLayer, Network } from "@/data/letters/types";
import type { Apostle } from "@/data/people-pages/types";
import { loadPlaces } from "@/lib/data";
import { useCachedLoad } from "@/lib/people-pages";
import { personPath } from "@/lib/people-pages-index";
import { loadHarmony } from "@/lib/study";
import { ClaimList, EvidenceClaim, QuoteText } from "./Evidence";
import { harmonySectionOf } from "./harmony";
import { harmonyHref, journeyHref, lettersHref } from "./links";
import { placeLayers } from "./map-layers";

/** The calling: one wide scene with the passage quoted in full; chips switch between the accounts. */
export function CallingScene({ apostle }: { apostle: Apostle }) {
  const [chosen, setChosen] = useState(0);
  const places = useCachedLoad("places", loadPlaces);
  const harmony = useCachedLoad("harmony", loadHarmony);
  if (!apostle.calling.length) return null;
  const call = apostle.calling[Math.min(chosen, apostle.calling.length - 1)];
  const place = call.placeId && places.status === "ready" ? places.value.find((p) => p.id === call.placeId) : undefined;
  const section = harmony.status === "ready" ? harmonySectionOf(harmony.value, call.quote.span) : undefined;
  return <Section id="pp-calling" kicker="The calling" title={apostle.calling.length > 1 ? `Called, as ${apostle.calling.length} accounts tell it` : "The calling"} lead={place ? `At ${place.name}.` : undefined}>
    {apostle.calling.length > 1 && <div className="lg-chips" style={{ marginTop: 0, marginBottom: "1rem" }} role="group" aria-label="Accounts">
      {apostle.calling.map((c, i) => <button key={c.label} type="button" className="lg-chip" aria-pressed={i === chosen} onClick={() => setChosen(i)}>{c.label}</button>)}
    </div>}
    <QuoteText quote={call.quote} />
    {call.claim && <div style={{ marginTop: ".75rem" }}><EvidenceClaim claim={call.claim} as="div" /></div>}
    {section && <Link className="pp-link" style={{ marginTop: ".75rem" }} to={harmonyHref(section.n)}>In the Gospel harmony: {section.title} <ArrowUpRight size={14} aria-hidden /></Link>}
  </Section>;
}

/** Paul's three journeys and the voyage to Rome, from the Letters data, drawn on his page's map. */
function usePaulJourneys(wanted: boolean): MapLayer[] {
  const [layers, setLayers] = useState<MapLayer[]>([]);
  useEffect(() => {
    if (!wanted) return;
    let live = true;
    void import("@/data/letters/paul-letters.json").then((module) => {
      const group = module.default as unknown as LetterGroup;
      if (live) setLayers(group.maps.filter((m) => m.id.startsWith("journey-") || m.id === "voyage-rome"));
    });
    return () => { live = false; };
  }, [wanted]);
  return layers;
}

/** Where he went: Scripture's places as pins (tradition dashed), his journeys where the Letters have them, Acts after. */
export function JourneySection({ apostle, their = "his" }: { apostle: Apostle; their?: string }) {
  const isPaul = apostle.id.startsWith("paul-");
  const journeys = usePaulJourneys(isPaul);
  const layers = [...journeys, ...placeLayers(apostle.places, `Places in ${their} story`)];
  const atlas = journeyHref(apostle.name);
  if (!layers.length && !apostle.acts.length && !apostle.places.length) return null;
  return <Section id="pp-journey" kicker={their === "their" ? "Where they went" : "Where he went"} title="Acts and after" lead="Places named in Scripture, with places known only from tradition as dashed pins. The full guided walk lives in the Atlas."
    aside={atlas && <Link className="pp-link" to={atlas}>Walk the journey in the Atlas <ArrowUpRight size={14} aria-hidden /></Link>}>
    {layers.length > 0 && <LetterMap layers={layers} title={`${apostle.name}: places`} displayWidth={900} />}
    {/* Every place by name, including those the Atlas has no pin for (Scythia, Edessa …). */}
    {apostle.places.length > 0 && <ul className="pp-places" aria-label={`Places in ${their} story`}>{apostle.places.map((p) => <li key={p.name} data-tradition={p.tradition ? "" : undefined}>
      <strong>{p.name}</strong>{p.tradition && <small> · tradition</small>}{!p.placeId && <small> · no map pin</small>}{p.note && <small> · {p.note}</small>}<Refs refs={p.refs} limit={2} />
    </li>)}</ul>}
    {apostle.acts.length > 0 && <div style={{ marginTop: "1rem" }}><p className="pp-label">In Acts and the letters</p><ClaimList claims={apostle.acts} /></div>}
  </Section>;
}

/** His companions: who travelled, worked, wrote or was imprisoned with him, with him at the centre. */
export function Companions({ apostle, them = "him" }: { apostle: Apostle; them?: string }) {
  const [paulNetwork, setPaulNetwork] = useState<Network | undefined>();
  const isPaul = apostle.id.startsWith("paul-");
  useEffect(() => {
    if (!isPaul) return;
    let live = true;
    void import("@/data/letters/paul-letters.json").then((module) => { if (live) setPaulNetwork((module.default as unknown as LetterGroup).networks.find((n) => n.id === "companions")); });
    return () => { live = false; };
  }, [isPaul]);
  if (!apostle.companions.length && !paulNetwork) return null;
  const network: Network = paulNetwork ?? {
    id: `${apostle.id}-companions`, title: `${apostle.name}'s companions`,
    nodes: [{ id: apostle.id, label: apostle.name }, ...apostle.companions.map((c) => ({ id: c.person.personId ?? c.person.name, label: c.person.name, refs: c.claim.refs, note: c.person.note }))],
    edges: apostle.companions.map((c) => ({ from: apostle.id, to: c.person.personId ?? c.person.name, refs: c.claim.refs })),
    claim: { text: `Each line joins ${them} to someone Scripture places beside ${them}.` },
  };
  return <Section id="pp-companions" kicker="Companions" title={`Who was with ${them}`} lead="Point at a name to see where Scripture places them together.">
    <PeopleNetwork network={network} />
    {apostle.companions.length > 0 && <ul className="pp-claims" style={{ marginTop: "1rem" }}>{apostle.companions.map((c) => <li key={c.person.name}>
      <strong>{c.person.personId ? <Link to={personPath(c.person.personId)} className="underline decoration-[var(--lg-line)] underline-offset-2">{c.person.name}</Link> : c.person.name}</strong>{" "}
      <EvidenceClaim claim={c.claim} as="div" />
    </li>)}</ul>}
  </Section>;
}

/** How the story ends: Scripture beside tradition, never blended; every tradition names who said it and when. */
export function StoryEnding({ apostle, their = "his" }: { apostle: Apostle; their?: string }) {
  const { scripture, tradition } = apostle.ending;
  if (!scripture.length && !tradition.length) return null;
  return <Section id="pp-ending" kicker="How the story ends" title="Scripture says, tradition says" lead="Scripture in solid glass; later tradition in a dashed frame, each line with who said it and when. The two are never blended.">
    <div className="pp-ending">
      <section className="pp-ending-scripture" aria-label="Scripture says">
        <p className="pp-label">Scripture says</p>
        {scripture.length ? <ClaimList claims={scripture} /> : <p className="lg-muted">Scripture does not record how {their} life ended.</p>}
      </section>
      <section className="pp-ending-tradition" aria-label="Tradition says">
        <p className="pp-label">Tradition says</p>
        {tradition.length ? <ul className="pp-claims">{tradition.map((t, i) => <li key={i}>
          <EvidenceClaim claim={{ ...t, who: undefined }} as="div" plain /><span className="pp-who">Who says so: {t.who}, {t.when}</span>
        </li>)}</ul> : <p className="lg-muted">No tradition is recorded here.</p>}
      </section>
    </div>
  </Section>;
}

/** His writings: links only, never retold (the Letters pages and the reader carry them). */
export function Writings({ apostle, tied }: { apostle: Apostle; tied?: string }) {
  if (!apostle.writings.length) return null;
  // The wider circle's writings are often letters addressed to them, or books tradition gives them: "tied to him".
  return <Section id="pp-writings" kicker={tied ? "Writings" : "His writings"} title={tied ? `Writings tied to ${tied}` : "What he wrote"} lead="Links only: the Letters pages and the reader carry the writings themselves.">
    <div className="pp-cards">{apostle.writings.map((w) => {
      const to = w.letters ? lettersHref(w.letters) : w.book ? `/read/kjv/${w.book}/1` : undefined;
      const body = <><p className="lg-kicker">{w.letters ? "Letters" : "Read"}</p><h4>{w.letters ? <Mail size={16} aria-hidden style={{ display: "inline", marginRight: ".4rem" }} /> : <BookOpen size={16} aria-hidden style={{ display: "inline", marginRight: ".4rem" }} />}{w.title}</h4></>;
      return to ? <Link key={w.title} to={to} className="pp-card pp-card-link">{body}<span className="pp-link">Open <ArrowUpRight size={14} aria-hidden /></span></Link> : <div key={w.title} className="pp-card">{body}</div>;
    })}</div>
  </Section>;
}
