// Memory card match on a team phone (docs/features/team-play/design.md, section 4): a copy of the big screen's grid,
// live only on this team's turn. A tap is sent to the big screen, which applies it; the card shows as "sent" until the
// next view arrives (the laptop answers every tap with a view, Review 9).
import { useEffect, useState, type CSSProperties } from "react";
import { teamTone } from "../kit";
import type { PhoneScreenProps } from "../team-play/TeamJoinPage";
import { SOFT_HYPHEN } from "./game";
import type { MemoryView } from "./team";
import "./team-phone.css";

const isMemoryView = (view: unknown): view is MemoryView => typeof view === "object" && view !== null && (view as MemoryView).game === "memory-match";

export default function MemoryTeamPhone({ view, team, send }: PhoneScreenProps) {
  const [sent, setSent] = useState<number | null>(null);
  useEffect(() => setSent(null), [view]);
  if (!isMemoryView(view)) return <p className="tp-big">Watch the big screen.</p>;
  const me = Number(team.slice(1)) - 1;
  if (view.phase === "lobby") return <p className="tp-big">You're in! The leader will start the game soon.</p>;
  if (view.phase === "study") return <p className="tp-big">Study the pairs on the big screen.</p>;
  const scores = <ul className="mmp-scores" aria-label="Pairs found">
    {view.names.map((name, n) => <li key={n} style={{ "--_team": teamTone(n) } as CSSProperties} data-turn={view.turn === `t${n + 1}`}>
      <span dir="auto">{name}</span> <b>{view.scores[n]}</b>
    </li>)}
  </ul>;
  if (view.phase === "done") return <div className="mmp"><p className="tp-big">{view.result}</p>{scores}</div>;
  const mine = view.turn === team;
  const turnName = view.turn ? view.names[Number(view.turn.slice(1)) - 1] : "";
  return <div className="mmp">
    <p className={`mmp-turn${mine ? " is-mine" : ""}`} role="status">{mine ? "Your turn: tap two cards" : `${turnName} is choosing`}</p>
    <div className="mmp-grid" style={{ "--mmp-cols": view.columns } as CSSProperties}>
      {view.cards.map((card, index) => {
        const live = mine && card.s === "d" && sent === null;
        const tone = card.s === "f" && card.by !== undefined ? ({ "--_team": teamTone(card.by) } as CSSProperties) : undefined;
        return <button key={index} type="button" className="mmp-card" data-s={card.s} data-sent={sent === index || undefined} style={tone}
          disabled={!live} aria-label={card.text ? `Card ${index + 1}: ${card.text.split(SOFT_HYPHEN).join("")}` : `Card ${index + 1}, face down`}
          onClick={() => { setSent(index); send({ flip: index, round: view.round }); }}>
          {card.text ? <span className="mmp-text" lang="en">{card.text}</span> : <span className="mmp-num">{index + 1}</span>}
        </button>;
      })}
    </div>
    {scores}
    <p className="tp-hint">{`You are ${view.names[me] ?? "a team"}. The cards turn on the big screen too.`}</p>
  </div>;
}
