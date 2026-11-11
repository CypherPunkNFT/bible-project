// Bible twenty questions, reverse mode: the suspect board (the audit's item 3, after Guess Who?). With hints on, the
// people still possible are a grid of small name cards under their count; each answer turns the cards it rules out
// face down and shrinks them away, and the next names fill in. The count changes at once; the turning is decoration,
// and under reduced motion the cards are simply gone. The sums are board.ts.
import { useEffect, useState } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { FlipCard, motionMs } from "../kit";
import { BOARD_CARDS, boardCards, dropOut, type BoardCard } from "./board";
import type { Engine } from "./engine";

const LEAVE_MS = 700;

export function SuspectBoard({ engine, people, size = BOARD_CARDS }: { engine: Engine; people: readonly number[]; size?: number }) {
  const [cards, setCards] = useState<BoardCard[]>(() => boardCards([], people, true, size));
  useEffect(() => {
    const hold = motionMs(LEAVE_MS);
    setCards((now) => boardCards(now, people, hold > 0, size));
    if (hold === 0) return;
    const timer = setTimeout(() => setCards(dropOut), hold);
    return () => clearTimeout(timer);
  }, [people, size]);
  const more = people.length - size;
  return <section className="tq-board" aria-label="People still possible">
    <p className="tq-board-count">{`People still possible: ${formatNumber(people.length)}`}</p>
    <ul className="tq-suspects">
      {cards.map((card, i) => {
        const person = engine.data.people[card.person];
        return <li key={person.id} className={`tq-suspect${card.out ? " is-out" : ""}`} aria-hidden={card.out || undefined}>
          <FlipCard flipped={card.out} index={i % 10} axis="y" front={<span className="tq-suspect-name">{person.label}</span>} back={<span className="tq-suspect-back" />} />
        </li>;
      })}
    </ul>
    {more > 0 && <p className="tq-board-more">{plural(more, "and {n} more", "and {n} more")}</p>}
  </section>;
}
