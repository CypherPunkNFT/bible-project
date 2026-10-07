import { useState, type CSSProperties } from "react";
import type { Ruler } from "@/data/people-pages/types";
import { rulerFor } from "@/lib/people-pages-index";
import { useRuler } from "@/lib/people-pages";
import { PeopleCitations } from "./Evidence";
import { glowFor, isConsort, isForeign, pageHeading } from "./kinds";
import { RULERS_GUIDE } from "./links";
import { PageTop, Sections, type PageSection } from "./PageFrame";
import { DatingSection, PassagesSection, SourcesSection } from "./PageSources";
import { NationLenses, ReignProphets, WorldStage } from "./RulerContext";
import { RulerHero } from "./RulerHero";
import { KingdomCard, ReignEvents } from "./ReignMapEvents";
import { Accession, ChainOfAuthority, HerodFamily, JudgeCycle } from "./RulerVariants";
import { TwoAccounts, VerdictCard } from "./RulerVerdict";
import { SuccessionStrip } from "./SuccessionStrip";
import { readyKey } from "./usePeoplePageSlide";
import "@/components/letters/letters.css";
import "./people-pages.css";

type Sex = "M" | "F" | "G" | "";

/**
 * A ruler's page (/people/:id/rule): the reign at a glance, the succession strip, Scripture's verdict, the kingdom
 * map, the events, what the nation did, the prophets, the world stage, the two accounts, the dating questions, every
 * passage and the sources. The order and a few parts change by kind of ruler (PRESENTATION.md §3.10).
 */
export function RulerPage({ id, sex }: { id: string; sex: Sex }) {
  const state = useRuler(id);
  const summary = rulerFor(id);
  const [placeFocus, setPlaceFocus] = useState<string | undefined>();
  // A pin pointed at on the kingdom map lights the events that happened there.
  const [mapPlace, setMapPlace] = useState<string | undefined>();
  if (!summary || state.status === "missing") return <p className="lg-glass lg-muted">This ruler's page is still being prepared.</p>;
  if (state.status === "loading") return <div className="lg-glass" style={{ minHeight: 420 }} aria-busy="true" />;
  const ruler = state.item;
  const heading = pageHeading(ruler, sex);
  const foreign = isForeign(ruler);
  const possessive = sex === "F" ? "her" : "him";
  const sections: Record<string, PageSection> = {
    cycle: { id: "pp-cycle", title: "The cycle", node: <JudgeCycle ruler={ruler} /> },
    chain: { id: "pp-chain", title: "Authority", node: <ChainOfAuthority ruler={ruler} /> },
    herods: { id: "pp-herods", title: "The Herods", node: <HerodFamily ruler={ruler} /> },
    accession: { id: "pp-accession", title: ruler.accession?.some((c) => /anoint/i.test(c.text)) ? "Anointing" : "Accession", node: <Accession ruler={ruler} /> },
    succession: { id: "pp-succession", title: "Succession", node: <SuccessionStrip ruler={ruler} summary={summary} intro={ruler.realm === "tribes" ? state.group.intro : undefined} /> },
    verdict: { id: "pp-verdict", title: ruler.records.some((r) => r.verdict) ? "Verdict" : "Scripture says", node: <VerdictCard ruler={ruler} possessive={possessive} /> },
    kingdom: { id: "pp-kingdom", title: foreign ? "The realm" : ruler.kind === "roman" ? "The seat" : "The kingdom", node: <KingdomCard ruler={ruler} focus={placeFocus} onPoint={setMapPlace} /> },
    events: { id: "pp-events", title: ruler.kind === "roman" ? "Hearings" : "Events", node: <ReignEvents ruler={ruler} onFocus={setPlaceFocus} mapPlace={mapPlace} /> },
    nation: { id: "pp-nation", title: isConsort(ruler) ? "Her people" : foreign ? "Dealings" : "The nation", node: <NationLenses ruler={ruler} /> },
    prophets: { id: "pp-prophets", title: "Prophets", node: <ReignProphets ruler={ruler} /> },
    world: { id: "pp-world", title: "World stage", node: <WorldStage ruler={ruler} /> },
    accounts: { id: "pp-accounts", title: "Two accounts", node: <TwoAccounts ruler={ruler} /> },
    dating: { id: "pp-dating", title: "Dates", node: <DatingSection dates={ruler.dates} questions={ruler.questions} reignText={ruler.reign.text} /> },
    passages: { id: "pp-passages", title: "Passages", node: <PassagesSection passages={ruler.passages} notSaid={ruler.notSaid} identifications={ruler.identifications} /> },
    sources: { id: "pp-sources", title: "Sources", node: <SourcesSection citations={state.group.citations} /> },
  };
  const order = foreign
    ? ["world", "succession", "kingdom", "verdict", "nation", "events", "prophets", "accounts", "dating", "passages", "sources"]
    : ruler.kind === "judge" || ruler.kind === "leader"
      ? ["cycle", "accession", "succession", "verdict", "events", "kingdom", "nation", "prophets", "world", "dating", "passages", "sources"]
      : ["chain", "herods", "accession", "succession", "verdict", "kingdom", "events", "nation", "prophets", "world", "accounts", "dating", "passages", "sources"];
  return <PeopleCitations citations={state.group.citations}>
    <div className="lg-page pp-page" style={{ "--lg": glowFor(ruler.kind, ruler.realm) } as CSSProperties} data-people-ready={readyKey({ kind: "special", id, aspect: "rule" })}>
      <PageTop id={ruler.id} name={ruler.name} page={heading} fallback={RULERS_GUIDE} />
      <RulerHero ruler={ruler} summary={summary} />
      <Sections sections={order.filter((key) => hasContent(key, ruler)).map((key) => sections[key])} />
    </div>
  </PeopleCitations>;
}

/** Sections with nothing to show are left out of the page and of the jump chips. */
function hasContent(key: string, ruler: Ruler): boolean {
  switch (key) {
    case "cycle": return Boolean(ruler.cycle);
    case "chain": return (ruler.kind === "governor" || ruler.kind === "roman") && Boolean(ruler.worldStage[0]?.rulers.length);
    case "herods": return ruler.kind === "herod";
    case "accession": return Boolean(ruler.accession?.length);
    case "verdict": return ruler.records.some((r) => r.verdict) || Boolean(ruler.scriptureSays?.length);
    case "kingdom": return Boolean(ruler.capital || ruler.places.length);
    case "events": return ruler.events.length > 0;
    case "nation": return Object.values(ruler.nation).some((list) => list.length);
    case "prophets": return ruler.prophets.length > 0;
    case "world": return ruler.worldStage.length + ruler.outside.length > 0;
    case "accounts": return ruler.twoAccounts.length > 0;
    case "dating": return ruler.dates.length + ruler.questions.length > 0;
    case "passages": return ruler.passages.length + ruler.notSaid.length > 0 || Boolean(ruler.identifications?.length);
    default: return true;
  }
}
