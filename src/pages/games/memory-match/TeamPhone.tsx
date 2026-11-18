// Memory card match on a team phone (docs/features/team-play/design.md, sections 4 and 10): the big screen's board with
// the same cards (Card.tsx, its art and styles), live only on this team's turn. A tap is sent to the big screen, which
// applies it; the card shows as "sent" until the next view arrives (the laptop answers every tap with a view, Review 9).
// A non-pair turns back with its words kept for the turn (CLOSE_MS); found pairs leave an empty slot, as on the board.
// A phone card is too narrow for its words (six columns on Medium and Hard), so the turned cards are read above the
// board, numbered 1 and 2 in the order they were tapped, with the same number on the card itself.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { prefersReducedMotion, teamTone } from "../kit";
import type { PhoneScreenProps } from "../team-play/TeamJoinPage";
import { Card, type CardFace } from "./Card";
import { CLOSE_MS } from "./Board";
import { typedBacks } from "./deal";
import type { Card as DealtCard } from "./deal";
import type { MemoryView, PhoneCard } from "./team";
import { versionOf } from "./versions";
import "./memory-match.css";
import "./team-phone.css";

const isMemoryView = (view: unknown): view is MemoryView => typeof view === "object" && view !== null && (view as MemoryView).game === "memory-match";

/** Every face-down card without a kind (Hard) is drawn as this one, so none differs from another (design 10.5). */
const PLACEHOLDER_KIND = "who";

/** How long the words of a non-pair, or of a pair just found, stay above the board once the cards leave. */
const HOLD_MS = 1600;
const NONE_CLOSING = new Map<number, PhoneCard>();

/** A state that `show` sets and that clears itself `ms` later; a newer `show` replaces it, a re-render never cancels it. */
function useHeld<T>(ms: number): [T | null, (value: T) => void] {
  const [held, setHeld] = useState<T | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const show = useRef((value: T) => {
    setHeld(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHeld(null), ms);
  }).current;
  return [held, show];
}

interface Turned { index: number; k: DealtCard["kind"]; text: string }
interface Panel { items: Turned[]; state: "open" | "miss" | "pair"; by?: number }

/** What the panel above the board shows, and which cards just turned back (their faces keep turning for CLOSE_MS). */
function useTurned(view: MemoryView): { panel: Panel; closing: Map<number, PhoneCard> } {
  const order = useRef<number[]>([]);
  const last = useRef<{ view: MemoryView; order: number[] } | null>(null);
  const [held, hold] = useHeld<Panel>(HOLD_MS);
  const [closing, close] = useHeld<Map<number, PhoneCard>>(CLOSE_MS);
  const ups = view.cards.flatMap((card, index) => card.s === "u" ? [index] : []);
  // Tap order: the cards already up keep their place, a new one goes last.
  order.current = [...order.current.filter((index) => ups.includes(index)), ...ups.filter((index) => !order.current.includes(index))];
  const now = order.current;
  useEffect(() => {
    const before = last.current;
    last.current = { view, order: now };
    if (!before || before.view.round !== view.round) return;
    const rank = (index: number) => { const at = before.order.indexOf(index); return at < 0 ? 99 : at; };
    const changed = (test: (was: PhoneCard, is: PhoneCard) => boolean) =>
      view.cards.flatMap((card, index) => test(before.view.cards[index], card) ? [index] : []).sort((a, b) => rank(a) - rank(b));
    const found = changed((was, is) => is.s === "f" && was?.s !== "f");
    const shut = changed((was, is) => is.s === "d" && was?.s === "u");
    if (found.length) hold({ items: turned(view.cards, found), state: "pair", by: view.cards[found[0]].by });
    if (shut.length) {
      hold({ items: turned(before.view.cards, shut), state: "miss" });
      close(new Map(shut.map((index) => [index, before.view.cards[index]])));
    }
  }, [view, now, hold, close]);
  const panel: Panel = now.length
    ? { items: turned(view.cards, now), state: now.length === 2 ? "miss" : "open" }
    : held ?? { items: [], state: "open" };
  return { panel, closing: closing ?? NONE_CLOSING };
}

function turned(cards: PhoneCard[], list: number[]): Turned[] {
  return list.flatMap((index) => { const card = cards[index]; return card?.k && card.text ? [{ index, k: card.k, text: card.text }] : []; });
}

/** The turned cards' words, read large above the board: slot 1 and slot 2, empty and dashed when no card is turned. */
function TurnedPanel({ panel, version }: { panel: Panel; version: ReturnType<typeof versionOf> }) {
  const style = panel.by === undefined ? undefined : { "--_team": teamTone(panel.by) } as CSSProperties;
  return <ol className={`mmp-turned is-${panel.state}`} style={style} aria-hidden="true">
    {[0, 1].map((n) => {
      const item = panel.items[n];
      const side = item && version.sides[item.k];
      return <li key={n} className={side ? `art-${side.art}` : "is-empty"}>
        <b className="mmp-turned__mark">{n + 1}</b>
        {side && <><span className="mmp-turned__kind">{side.label}</span><span className="mmp-turned__text">{item.text}</span></>}
      </li>;
    })}
  </ol>;
}

function Scores({ view }: { view: MemoryView }) {
  return <ul className="mmp-scores" aria-label="Pairs found">
    {view.names.map((name, n) => <li key={n} style={{ "--_team": teamTone(n) } as CSSProperties} data-turn={view.turn === `t${n + 1}`}>
      <span dir="auto">{name}</span> <b>{view.scores[n]}</b>
    </li>)}
  </ul>;
}

interface GridProps { view: MemoryView; mine: boolean; sent: number | null; onTap: (index: number) => void }

function Grid({ view, mine, sent, onTap }: GridProps) {
  const { panel, closing } = useTurned(view);
  const version = versionOf(view.version);
  const typed = typedBacks(view.difficulty);
  const ups = view.cards.filter((card) => card.s === "u").length;
  const reduced = prefersReducedMotion();
  const marks = new Map(panel.items.map((item, n) => [item.index, n + 1]));
  return <div className={`mm-play is-${view.difficulty} is-${view.version}${view.columns >= 6 ? " is-tight" : ""}`}>
    <TurnedPanel panel={panel} version={version} />
    <div role="group" aria-label={`Cards, ${view.columns} columns by ${view.cards.length / view.columns} rows`}
      className={`mm-grid${reduced ? " is-reduced" : ""}`}
      style={{ "--mm-cols": view.columns, "--mm-rows": view.cards.length / view.columns } as CSSProperties}>
      {view.cards.map((card, index) => {
        const turning = closing.get(index);
        const face: CardFace = card.s === "f" ? "taken" : card.s === "u" ? "up" : turning ? "closing" : "down";
        const live = mine && card.s === "d" && sent === null;
        return <Card key={index} kind={card.k ?? turning?.k ?? PLACEHOLDER_KIND} version={version} face={face}
          text={card.text ?? turning?.text ?? null} partner={card.partner ?? null} typed={typed} missed={card.s === "u" && ups === 2}
          flying={false} row={Math.floor(index / view.columns) + 1} column={(index % view.columns) + 1} index={index} tone={0}
          focusable mark={card.s === "f" ? undefined : marks.get(index)} hold={sent === index ? "sent" : live || card.s !== "d" ? undefined : "wait"}
          onFlip={() => { if (live) onTap(index); }} onKeyDown={() => undefined} onFocus={() => undefined} />;
      })}
    </div>
  </div>;
}

export default function MemoryTeamPhone({ view, team, send }: PhoneScreenProps) {
  const [sent, setSent] = useState<number | null>(null);
  useEffect(() => setSent(null), [view]);
  if (!isMemoryView(view)) return <p className="tp-big">Watch the big screen.</p>;
  const me = Number(team.slice(1)) - 1;
  if (view.phase === "lobby") return <p className="tp-big">You're in! The leader will start the game soon.</p>;
  if (view.phase === "study") return <p className="tp-big">Study the pairs on the big screen.</p>;
  if (view.phase === "done") return <div className="mmp"><p className="tp-big">{view.result}</p><Scores view={view} /></div>;
  const mine = view.turn === team;
  const turnName = view.turn ? view.names[Number(view.turn.slice(1)) - 1] : "";
  return <div className="mmp mm-page">
    <p className={`mmp-turn${mine ? " is-mine" : ""}`} role="status">{mine ? "Your turn: tap two cards" : `${turnName} is choosing`}</p>
    <Grid key={view.round} view={view} mine={mine} sent={sent}
      onTap={(index) => { setSent(index); send({ flip: index, round: view.round }); }} />
    <Scores view={view} />
    <p className="tp-hint">{`You are ${view.names[me] ?? "a team"}. The cards turn on the big screen too.`}</p>
  </div>;
}
