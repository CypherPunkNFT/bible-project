// The stack on the screen while a round is played (owner, 2026-11-12: "a stacking stack on the screen so you could see
// their cards as we play the game"). Each answer drops that puzzle's odd one onto the pile beside the puzzle; it stays
// there, newest on top at full face, the earlier ones stacked behind it with their name strips showing. A tap on a
// strip brings that card to the top until the next one lands. On a phone the pile sits above the question as a row of
// cards overlapping like a hand, newest on the right; tapping one opens its full face under the row.
import { useEffect, useMemo, useState } from "react";
import { headline, type SetsFile } from "@/pages/games/odd-one-out/game";
import type { RoundState } from "@/pages/games/odd-one-out/storage";
import { formatNumber } from "@/lib/site-format";
import { CardEdge, DeckCard } from "./DeckCard";
import { CARDS, useDeck, type CardData, type Kept } from "./deck";

interface Landed { card: CardData; kept: Kept }

function landedCards(data: SetsFile, round: RoundState): Landed[] {
  const byId = new Map(data.sets.map((set) => [set.id, set]));
  const landed: Landed[] = [];
  round.ids.forEach((id, n) => {
    const set = byId.get(id);
    const pick = round.picks[n];
    const card = set && CARDS.get(set.odd);
    if (!set || pick === null || !card) return;
    landed.push({ card, kept: { id: card.id, why: headline(data, set).oddPhrase, spotted: pick === set.odd, at: n } });
  });
  return landed.reverse(); // newest first
}

export function PlayStack({ data, round }: { data: SetsFile; round: RoundState }) {
  const deck = useDeck();
  const landed = useMemo(() => landedCards(data, round), [data, round]);
  const [chosen, setChosen] = useState<string | null>(null);
  const newest = landed[0]?.card.id;
  useEffect(() => { setChosen(null); }, [newest]); // a new card landing always shows on top
  const top = landed.find((entry) => entry.card.id === chosen) ?? landed[0];
  const behind = landed.filter((entry) => entry !== top);
  const spotted = landed.filter((entry) => entry.kept.spotted).length;
  return <aside className="od-play" aria-label="Your stack this round">
    <p className="od-play-head">
      <b>Your stack</b>
      <span>{`${formatNumber(landed.length)} of ${formatNumber(round.ids.length)} this round · ${formatNumber(spotted)} spotted`}</span>
      <span className="od-play-deck">{`${formatNumber(deck.length)} in your deck`}</span>
    </p>
    {!top ? <div className="od-play-empty">
      <span className="od-play-ghost" /><span className="od-play-ghost" /><span className="od-play-ghost" />
      <p>Answer the puzzle and its odd one lands here.</p>
    </div> : <>
      {/* Desktop: the pile. */}
      <div className="od-play-pile">
        {behind.slice().reverse().map((entry, n) => <button key={entry.card.id} type="button" className="od-play-edge"
          style={{ "--tilt": `${((n % 3) - 1) * .7}deg` } as React.CSSProperties}
          onClick={() => setChosen(entry.card.id)} aria-label={`Show ${entry.card.name}`}>
          <CardEdge card={entry.card} />
        </button>)}
        <DeckCard key={top.card.id} card={top.card} kept={top.kept} className={`od-play-top${top.card.id === newest && !chosen ? " is-new" : ""}`} />
      </div>
      {/* Phone: the hand. */}
      <div className="od-play-hand">
        {landed.slice().reverse().map((entry) => <button key={entry.card.id} type="button"
          className={`od-play-mini${entry === top ? " is-on" : ""}${entry.card.id === newest ? " is-new" : ""}`}
          style={{ "--sec": `var(--${entry.card.top.sec})` } as React.CSSProperties}
          onClick={() => setChosen(entry === top && chosen ? null : entry.card.id)} aria-label={`Show ${entry.card.name}`}>
          <span>{entry.card.name}</span>
        </button>)}
      </div>
      {chosen && <DeckCard key={`hand-${top.card.id}`} card={top.card} kept={top.kept} className="od-play-handcard" />}
    </>}
  </aside>;
}
