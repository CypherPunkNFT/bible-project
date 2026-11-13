// /games/odd-one-out_mockup .. _mockup4 (owner, 2026-11-12): the real Odd one out page with the player's cards of odd
// ones out. While a round is played, each answer drops its odd one onto a stack on the screen beside the puzzle
// (PlayStack.tsx), the same in all four. The start screen shows the whole deck, four ways (Directions.tsx).
// No MOCK-UP tag and no switcher: a mock-up shows only the page.
import { useEffect, useMemo } from "react";
import OddOneOutGame from "@/pages/games/odd-one-out/OddOneOutGame";
import { OddExtrasContext, type OddExtras } from "@/pages/games/odd-one-out/extras";
import type { SetsFile } from "@/pages/games/odd-one-out/game";
import { Carousel, Collection, Wallet, WhereWhen } from "./Directions";
import { PlayStack } from "./PlayStack";
import { keep, seedOnce } from "./deck";
import "./odd-deck.css";

const VERSIONS = { 1: Wallet, 2: Carousel, 3: WhereWhen, 4: Collection } as const;

function Seeded({ data, version }: { data: SetsFile; version: keyof typeof VERSIONS }) {
  useEffect(() => { seedOnce(data); }, [data]);
  const Direction = VERSIONS[version];
  return <Direction />;
}

export default function OddDeckMockup({ version = 1 }: { version?: keyof typeof VERSIONS }) {
  const extras = useMemo<OddExtras>(() => ({
    startArt: (data) => <Seeded data={data} version={version} />,
    playAside: (data, round) => <PlayStack data={data} round={round} />,
    onReveal: (data, set, right) => { keep(data, set, right); },
  }), [version]);
  return <OddExtrasContext.Provider value={extras}>
    <OddOneOutGame />
  </OddExtrasContext.Provider>;
}
