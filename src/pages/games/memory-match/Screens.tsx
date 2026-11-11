// Memory card match: the start screen, "See the pairs first" and the can't-load screen (design section 10).
import { useEffect, useRef } from "react";
import { BOARD_PAIRS, DIFFICULTIES, DIFFICULTY_LABELS, isOffered, type Difficulty, type PairsFile } from "./deal";
import { formatNumber, plural } from "@/lib/site-format";
import { formatTime } from "./game";
import type { Best, Settings } from "./storage";

export interface Choice { deck: string; difficulty: Difficulty; players: number; names: string[] }

interface StartProps {
  data: PairsFile;
  choice: Choice;
  best: Best | undefined;
  settings: Settings;
  onChoice: (choice: Choice) => void;
  onSettings: (settings: Settings) => void;
  onDeal: (study: boolean) => void;
}

export function StartScreen({ data, choice, best, settings, onChoice, onSettings, onDeal }: StartProps) {
  const offered = isOffered(data, choice.deck, choice.difficulty);
  return <div className="mm-start">
    <h1>Memory card match</h1>
    <p className="mm-lede">Turn over two cards at a time. Pair each person with their story.</p>
    <fieldset className="mm-chips">
      <legend>Deck</legend>
      {data.decks.map((deck) => <button key={deck.key} type="button" aria-pressed={choice.deck === deck.key}
        onClick={() => onChoice({ ...choice, deck: deck.key,
          difficulty: isOffered(data, deck.key, choice.difficulty) ? choice.difficulty : "easy" })}>
        {deck.title}
      </button>)}
    </fieldset>
    <fieldset className="mm-chips">
      <legend>How hard</legend>
      {DIFFICULTIES.map((difficulty) => {
        const ok = isOffered(data, choice.deck, difficulty);
        return <button key={difficulty} type="button" aria-pressed={choice.difficulty === difficulty} disabled={!ok}
          title={ok ? undefined : "Not enough pairs yet"} onClick={() => onChoice({ ...choice, difficulty })}>
          {`${DIFFICULTY_LABELS[difficulty]} · ${plural(BOARD_PAIRS[difficulty] * 2, "{n} card", "{n} cards")}`}
          {!ok && <span className="sr-only"> (not enough pairs yet)</span>}
        </button>;
      })}
    </fieldset>
    <fieldset className="mm-chips">
      <legend>Players</legend>
      {[1, 2, 3, 4].map((n) => <button key={n} type="button" aria-pressed={choice.players === n}
        onClick={() => onChoice({ ...choice, players: n })}>
        {plural(n, "Just me", "{n}")}
      </button>)}
    </fieldset>
    {choice.players > 1 && <div className="mm-names">
      {Array.from({ length: choice.players }, (_, n) => <label key={n}>
        <span>{`Player ${formatNumber(n + 1)}`}</span>
        <input type="text" maxLength={20} value={choice.names[n] ?? ""} placeholder={`Player ${formatNumber(n + 1)}`}
          onChange={(event) => {
            const names = [...choice.names];
            names[n] = event.target.value;
            onChoice({ ...choice, names });
          }} />
      </label>)}
    </div>}
    <fieldset className="mm-chips">
      <legend>Turn non-pairs back</legend>
      <button type="button" aria-pressed={settings.turnBack === "auto"} onClick={() => onSettings({ ...settings, turnBack: "auto" })}>
        After a moment
      </button>
      <button type="button" aria-pressed={settings.turnBack === "tap"} onClick={() => onSettings({ ...settings, turnBack: "tap" })}>
        When I tap
      </button>
    </fieldset>
    <div className="mm-start-foot">
      <button type="button" className="mm-primary" disabled={!offered} onClick={() => onDeal(false)}>Deal the cards</button>
      <button type="button" className="mm-link" disabled={!offered} onClick={() => onDeal(true)}>See the pairs first</button>
      {best && choice.players === 1 && <span className="mm-best">
        {`Your best here: ${plural(best.moves, "{n} move", "{n} moves")} · ${formatTime(best.timeMs)} · ${plural(best.stars, "{n} star", "{n} stars")}`}
      </span>}
    </div>
  </div>;
}

interface StudyProps { data: PairsFile; pairIds: readonly string[]; onStart: () => void }

/** The board's pairs in a fresh order, with references; never where the cards are (design 9 and 10). */
export function StudyScreen({ data, pairIds, onStart }: StudyProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const byId = new Map(data.pairs.map((pair) => [pair.id, pair]));
  return <div className="mm-study">
    <h1 ref={heading} tabIndex={-1}>The pairs on this board</h1>
    <p className="mm-lede">Read them through, then find them on the board. Where the cards lie stays hidden.</p>
    <ul>
      {pairIds.map((id) => {
        const pair = byId.get(id)!;
        return <li key={id}><strong>{data.characters[pair.who].label}</strong> — {pair.story} · <span className="mm-ref">{pair.ref}</span></li>;
      })}
    </ul>
    <button type="button" className="mm-primary" onClick={onStart}>Start playing</button>
  </div>;
}

export function CantLoad({ onRetry }: { onRetry: () => void }) {
  return <div className="mm-start" role="alert">
    <h1>The cards didn't load</h1>
    <p className="mm-lede">Check the connection and try again.</p>
    <div className="mm-start-foot"><button type="button" className="mm-primary" onClick={onRetry}>Try again</button></div>
  </div>;
}
