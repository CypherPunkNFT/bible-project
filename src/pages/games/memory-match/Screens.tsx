// Memory card match: the start screen, "See the pairs first" and the can't-load screen (design section 10; redesign
// from docs/visual-audits/memory-match.md, item 7). The start shows a fan of three face-down cards beside the title with
// one turning over on a slow loop, three chip rows, and the long tail of settings under a fold so Deal sits on the
// first phone screen. The best for the current choice shows as stars.
import { Star } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { MoreOptions } from "../kit";
import { CardBack } from "./CardArt";
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

/** Three face-down cards fanned beside the title; the front one turns over and back on a slow loop (CSS). */
function CardFan() {
  return <span className="mm-fan" aria-hidden="true">
    <span className="mm-fan__card is-story"><span className="mm-fan__face mm-fan__back"><CardBack kind="story" /></span></span>
    <span className="mm-fan__card is-who"><span className="mm-fan__face mm-fan__back"><CardBack kind="who" /></span></span>
    <span className="mm-fan__card is-turning">
      <span className="mm-fan__inner">
        <span className="mm-fan__face mm-fan__back"><CardBack kind="who" /></span>
        <span className="mm-fan__face mm-fan__front">Daniel</span>
      </span>
    </span>
  </span>;
}

export function StartScreen({ data, choice, best, settings, onChoice, onSettings, onDeal }: StartProps) {
  const offered = isOffered(data, choice.deck, choice.difficulty);
  return <div className="mm-start">
    <div className="mm-start__head">
      <div>
        <h1>Memory card match</h1>
        <p className="mm-lede">Turn over two cards at a time. Pair each person with their story.</p>
      </div>
      <CardFan />
    </div>
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
    <div className="mm-start-foot">
      <button type="button" className="mm-primary" disabled={!offered} onClick={() => onDeal(false)}>Deal the cards</button>
      <button type="button" className="mm-link" disabled={!offered} onClick={() => onDeal(true)}>See the pairs first</button>
    </div>
    {best && choice.players === 1 && <p className="mm-best">
      <span className="mm-best__stars" aria-hidden="true">{[1, 2, 3].map((n) => <Star key={n} size={14} className={n <= best.stars ? "is-on" : undefined} />)}</span>
      <span>{`Your best here: ${plural(best.moves, "{n} move", "{n} moves")} · ${formatTime(best.timeMs)} · ${plural(best.stars, "{n} star", "{n} stars")}`}</span>
    </p>}
    <MoreOptions className="mm-options" summary="More options">
      <fieldset className="mm-chips">
        <legend>Turn non-pairs back</legend>
        <button type="button" aria-pressed={settings.turnBack === "auto"} onClick={() => onSettings({ ...settings, turnBack: "auto" })}>
          After a moment
        </button>
        <button type="button" aria-pressed={settings.turnBack === "tap"} onClick={() => onSettings({ ...settings, turnBack: "tap" })}>
          When I tap
        </button>
      </fieldset>
      <p className="mm-note">A tap anywhere on the board turns a non-pair back sooner.</p>
      <fieldset className="mm-chips">
        <legend>Timer</legend>
        <button type="button" aria-pressed={!settings.timerHidden} onClick={() => onSettings({ ...settings, timerHidden: false })}>Shown</button>
        <button type="button" aria-pressed={settings.timerHidden} onClick={() => onSettings({ ...settings, timerHidden: true })}>Hidden</button>
      </fieldset>
    </MoreOptions>
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
      {pairIds.map((id, n) => {
        const pair = byId.get(id)!;
        return <li key={id} style={{ "--i": n } as CSSProperties}>
          <span className="mm-study__who">{data.characters[pair.who].label}</span>
          <span className="mm-study__story">{pair.story}</span>
          <span className="mm-ref">{pair.ref}</span>
        </li>;
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
