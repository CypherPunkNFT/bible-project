// /games/odd-one-out_mockup (owner, 2026-11-12): the real Odd one out page with the player's cards of odd ones out, in
// the game only. While a round is played, each answer drops its odd one onto a stack on the screen beside the puzzle
// (PlayStack.tsx). The start screen is the real one: no deck there (owner: "No deck in the game home page, just in the
// game"). No MOCK-UP tag and no switcher: a mock-up shows only the page.
import { useMemo } from "react";
import OddOneOutGame from "@/pages/games/odd-one-out/OddOneOutGame";
import { OddExtrasContext, type OddExtras } from "@/pages/games/odd-one-out/extras";
import { PlayStack } from "./PlayStack";
import { keep } from "./deck";
import "./odd-deck.css";

export default function OddDeckMockup() {
  const extras = useMemo<OddExtras>(() => ({
    playAside: (data, round) => <PlayStack data={data} round={round} />,
    onReveal: (data, set, right) => { keep(data, set, right); },
  }), []);
  return <OddExtrasContext.Provider value={extras}>
    <OddOneOutGame />
  </OddExtrasContext.Provider>;
}
