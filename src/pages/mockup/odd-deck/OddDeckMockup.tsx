// /games/odd-one-out_mockup .. _mockup4 (owner, 2026-11-12): the real Odd one out page, with the start screen's sample
// deal replaced by the player's deck of odd ones out, shown four ways (Directions.tsx), and a card that flies in to
// say "joined your deck" each time a puzzle is answered. No MOCK-UP tag and no switcher: a mock-up shows only the page.
import { useEffect, useMemo, useState } from "react";
import OddOneOutGame from "@/pages/games/odd-one-out/OddOneOutGame";
import { OddExtrasContext, type OddExtras } from "@/pages/games/odd-one-out/extras";
import type { SetsFile } from "@/pages/games/odd-one-out/game";
import { formatNumber } from "@/lib/site-format";
import { Carousel, Collection, Wallet, WhereWhen } from "./Directions";
import { CARDS, isKept, keep, seedOnce, useDeck, type CardData } from "./deck";
import "./odd-deck.css";

const VERSIONS = { 1: Wallet, 2: Carousel, 3: WhereWhen, 4: Collection } as const;

function Seeded({ data, version }: { data: SetsFile; version: keyof typeof VERSIONS }) {
  useEffect(() => { seedOnce(data); }, [data]);
  const Direction = VERSIONS[version];
  return <Direction />;
}

function Joined({ card, isNew }: { card: CardData; isNew: boolean }) {
  const deck = useDeck();
  return <div className="od-joined" role="status" style={{ "--sec": `var(--${card.top.sec})` } as React.CSSProperties}>
    <span className="od-joined-card"><b>{card.name}</b></span>
    <span className="od-joined-text">{isNew ? "joined your deck" : "is already in your deck"}
      <small>{`${formatNumber(deck.length)} of ${formatNumber(CARDS.size)}`}</small></span>
  </div>;
}

export default function OddDeckMockup({ version = 1 }: { version?: keyof typeof VERSIONS }) {
  const [joined, setJoined] = useState<{ card: CardData; isNew: boolean; at: number } | null>(null);
  useEffect(() => {
    if (!joined) return;
    const timer = window.setTimeout(() => setJoined(null), 2600);
    return () => window.clearTimeout(timer);
  }, [joined]);
  const extras = useMemo<OddExtras>(() => ({
    startArt: (data) => <Seeded data={data} version={version} />,
    onReveal: (data, set, right) => {
      const before = isKept(set.odd);
      const card = keep(data, set, right);
      if (card) setJoined({ card, isNew: !before, at: Date.now() });
    },
  }), [version]);
  return <OddExtrasContext.Provider value={extras}>
    <OddOneOutGame />
    {joined && <Joined key={joined.at} card={joined.card} isNew={joined.isNew} />}
  </OddExtrasContext.Provider>;
}
