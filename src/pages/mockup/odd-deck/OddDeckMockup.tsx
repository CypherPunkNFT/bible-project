// /games/odd-one-out_mockup (owner, 2026-11-12): where the Odd one out deck was tried, a stack of the odd ones beside
// the puzzle while a round is played. Approved the same day and put in the real game (src/pages/games/odd-one-out/deck/,
// switched on in ../../games/odd-one-out/extras.ts), so this page now shows the real game; it stays as the record of
// the approved mock-up. No MOCK-UP tag and no switcher: a mock-up shows only the page.
import OddOneOutGame from "@/pages/games/odd-one-out/OddOneOutGame";

export default function OddDeckMockup() {
  return <OddOneOutGame />;
}
