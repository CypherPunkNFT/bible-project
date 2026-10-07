import { ArrowUpRight } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/letters/LetterParts";
import { LetterMap } from "@/components/letters/LetterMap";
import { TimelineStrip } from "@/components/letters/TimelineStrip";
import type { Timeline, TimelineEvent } from "@/data/letters/types";
import type { ReignEvent, Ruler } from "@/data/people-pages/types";
import { EvidenceClaim } from "./Evidence";
import { EVENT_MARK, REALM_LABEL, isForeign } from "./kinds";
import { atlasCityHref } from "./links";
import { placeLayers } from "./map-layers";

/**
 * The kingdom: the words on top, the Atlas's own map as the bottom half of the card (PRESENTATION.md §3.4). A Roman
 * official gets one pin, at his seat. Pointing at a pin tells the page (`onPoint`), which lights the events there.
 */
export function KingdomCard({ ruler, focus, onPoint }: { ruler: Ruler; focus?: string; onPoint?: (placeId?: string) => void }) {
  const [note, setNote] = useState(false);
  const seatOnly = ruler.kind === "roman" && Boolean(ruler.capital);
  const places = [...(ruler.capital ? [ruler.capital] : []), ...(seatOnly ? [] : ruler.places.filter((p) => p.name !== ruler.capital?.name))];
  const foreign = isForeign(ruler);
  const layers = placeLayers(places, seatOnly ? "His seat" : foreign ? "Places in Scripture's account" : "Places named in the reign");
  if (!places.length) return null;
  const capitalHref = atlasCityHref(ruler.capital?.name);
  const kicker = foreign ? "The realm" : seatOnly ? "The seat" : ruler.kind === "judge" || ruler.kind === "leader" ? "The land" : "The kingdom";
  return <section id="pp-kingdom" className="lg-glass pp-kingdom" aria-labelledby="pp-kingdom-title">
    <div className="pp-kingdom-text">
      <p className="lg-kicker">{kicker}</p>
      <h3 id="pp-kingdom-title" className="lg-title">{seatOnly ? `${ruler.capital!.name}, where he sat` : ruler.capital ? `${ruler.capital.name} and the places of the ${ruler.kind === "judge" ? "story" : foreign || ruler.kind === "queen" ? "account" : "reign"}` : "The places Scripture names"}</h3>
      <p className="lg-lead">{seatOnly ? ruler.capital!.note ?? `${ruler.title}.` : <>{REALM_LABEL[ruler.realm]}{ruler.tribe ? ` · tribe of ${ruler.tribe}` : ""}. Only places Scripture names are shown, each where the Atlas puts it.</>}</p>
      <div className="lg-chips">
        {ruler.capital && (capitalHref ? <Link className="lg-chip" to={capitalHref}>Capital ● {ruler.capital.name} <ArrowUpRight size={13} aria-hidden /></Link> : <span className="lg-chip">Capital ● {ruler.capital.name}</span>)}
        {!seatOnly && <span className="lg-chip">Places named: {places.length}</span>}
        <button type="button" className="lg-chip" aria-expanded={note} onClick={() => setNote(!note)}>No borders drawn ⓘ</button>
      </div>
      {note && <p className="lg-caption">Borders are drawn only where a sourced outline exists. None does for this page, so the map shows the places Scripture names in the reign and no border at all.</p>}
    </div>
    {layers.length > 0 && <div className="pp-kingdom-map">
      <LetterMap layers={layers} title={`${ruler.name}: places`} displayWidth={900} focus={focus} onActive={onPoint} />
      <Link className="pp-link" to={capitalHref ?? "/study/atlas/map"}>Open in the Atlas <ArrowUpRight size={14} aria-hidden /></Link>
    </div>}
  </section>;
}

/**
 * The reign as a strip of events by year of the reign; events the Bible does not date go in a tray, never guessed.
 * Pointing at an event lights its place on the map (`onFocus`); a pin pointed at on the map lights its events (`mapPlace`).
 */
export function ReignEvents({ ruler, onFocus, mapPlace }: { ruler: Ruler; onFocus: (placeId?: string) => void; mapPlace?: string }) {
  const [chosen, setChosen] = useState<ReignEvent | null>(null);
  const dated = ruler.events.filter((e) => e.year !== undefined);
  const undated = ruler.events.filter((e) => e.year === undefined);
  const labelOf = (e: ReignEvent) => `${EVENT_MARK[e.kind].symbol} ${e.label}`;
  const timeline: Timeline = {
    id: `${ruler.id}-events`, title: "Year by year", axis: "years",
    events: dated.map((e) => ({ label: labelOf(e), from: e.year!, refs: e.claim.refs, cites: e.claim.cites, kind: EVENT_MARK[e.kind].label })),
    claim: { text: "Each mark sits at the year of the reign the Bible gives for it." },
  };
  const pointed = useCallback((event: TimelineEvent | null) => {
    onFocus(event ? dated.find((e) => labelOf(e) === event.label)?.placeId : undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dated follows ruler
  }, [ruler, onFocus]);
  if (!ruler.events.length) return null;
  const kinds = [...new Set(ruler.events.map((e) => e.kind))];
  return <Section id="pp-events" kicker={ruler.kind === "roman" ? "Trials and hearings" : "Events"} title={ruler.kind === "roman" ? "The hearings held" : "Wars, works and turning points"}
    lead={<>{kinds.map((k) => `${EVENT_MARK[k].symbol} ${EVENT_MARK[k].label}`).join(" · ")}{ruler.kind === "roman" ? "" : ". Pointing at an event lights its place on the map, and pointing at a place on the map lights its events"}.</>}>
    {dated.length > 0 && <TimelineStrip timeline={timeline} formatYear={(v) => `year ${v}`} onActive={pointed}
      lit={mapPlace ? (event) => dated.some((e) => labelOf(e) === event.label && e.placeId === mapPlace) : undefined} />}
    {undated.length > 0 && <div style={{ marginTop: dated.length ? "1rem" : 0 }}>
      <p className="pp-label">Undated in Scripture</p>
      <div className="pp-tray">{undated.map((e) => <button key={e.label} type="button" aria-pressed={chosen === e} data-lit={mapPlace && e.placeId === mapPlace ? "" : undefined}
        onMouseEnter={() => onFocus(e.placeId)} onMouseLeave={() => onFocus(chosen?.placeId)} onFocus={() => onFocus(e.placeId)}
        onClick={() => { const next = chosen === e ? null : e; setChosen(next); onFocus(next?.placeId); }}>
        <span aria-hidden>{EVENT_MARK[e.kind].symbol}</span>{e.label}</button>)}</div>
      {chosen && <div className="pp-card" style={{ marginTop: ".75rem" }}><h4>{chosen.label}</h4><EvidenceClaim claim={chosen.claim} as="div" /></div>}
    </div>}
  </Section>;
}
