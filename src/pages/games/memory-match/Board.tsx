// Memory card match: the board in play (design sections 7, 10, 11 and 12). The bar (moves, timer, pairs found or each
// player's pairs), the grid with one tab stop and arrow-key movement by the dealt columns, a polite live region, and
// the "Pairs found" list under the grid. Timers here match the CSS durations; the rules themselves live in game.ts.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { HOLD_MS, typedBacks, type PairsFile } from "./deal";
import { Card, type CardFace } from "./Card";
import { capitalise, cardText, clockRead, clockStart, clockStop, flip, foundCount, formatTime, hasStarted, isFinished,
  isHolding, isSolo, pairCount, scores, spoken, turnBack, type Clock, type GameState } from "./game";
import type { Settings } from "./storage";

/** The second card's flip (CSS 300ms): taps during it are ignored (design 16). */
export const FLIP_MS = 300;
/** A card turning back keeps its words this long, so they never vanish mid-turn (design 11). */
export const CLOSE_MS = 250;

interface BoardProps {
  data: PairsFile;
  game: GameState;
  settings: Settings;
  onChange: (game: GameState) => void;
  onSettings: (settings: Settings) => void;
  onFinish: (game: GameState) => void;
  onRestart: () => void;
  onQuit: () => void;
}

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || document.visibilityState !== "hidden");
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

function useReducedMotion(): boolean {
  return useMemo(() => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
}

export function Board({ data, game, settings, onChange, onSettings, onFinish, onRestart, onQuit }: BoardProps) {
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const solo = isSolo(game);
  const rows = game.cards.length / game.columns;
  const pairsById = useMemo(() => new Map(data.pairs.map((pair) => [pair.id, pair])), [data]);
  const toneOf = useMemo(() => new Map([...new Set(game.cards.map((c) => c.pair))].map((id, n) => [id, n])), [game.cards]);
  const clock = useRef<Clock>({ bankedMs: game.elapsedMs, since: null });
  const lockUntil = useRef(0);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const [closing, setClosing] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [confirmQuit, setConfirmQuit] = useState(false);

  // The clock runs from the first card to the last pair, and pauses while the page is hidden (design 7.1).
  const running = visible && hasStarted(game) && !isFinished(game) && !game.studying;
  useEffect(() => {
    clock.current = running ? clockStart(clock.current, Date.now()) : clockStop(clock.current, Date.now());
    if (!running) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [running]);

  const commit = useCallback((next: GameState) => onChange({ ...next, elapsedMs: Math.round(clockRead(clock.current, Date.now())) }), [onChange]);

  const closeCards = useCallback((cards: number[]) => {
    setClosing(cards);
    window.setTimeout(() => setClosing((current) => current.filter((n) => !cards.includes(n))), CLOSE_MS);
  }, []);

  const doTurnBack = useCallback(() => {
    if (!isHolding(game)) return;
    closeCards(game.up);
    commit(turnBack(game));
  }, [game, closeCards, commit]);

  // A non-pair turns back after the difficulty's delay, unless the player chose "when I tap". Hidden pages hold it, and
  // on return it gets its full delay again (design 16).
  useEffect(() => {
    if (!isHolding(game) || settings.turnBack === "tap" || !visible) return;
    const timer = window.setTimeout(doTurnBack, HOLD_MS[game.difficulty]);
    return () => window.clearTimeout(timer);
  }, [game, settings.turnBack, visible, doTurnBack]);

  const tap = useCallback((index: number) => {
    if (Date.now() < lockUntil.current) return;
    const wasHolding = isHolding(game) ? game.up : [];
    if (!hasStarted(game)) clock.current = clockStart(clock.current, Date.now());
    const { state, event } = flip(game, index);
    if (event.type === "ignored") return;
    if (wasHolding.length) closeCards(wasHolding);
    const said = capitalise(spoken(cardText(data, state.cards[index])));
    if (event.type === "first") {
      setMessage(`${said}.`);
    } else {
      lockUntil.current = Date.now() + FLIP_MS;
      if (event.type === "pair") {
        const pair = pairsById.get(event.pair)!;
        const both = `${spoken(data.characters[pair.who].label)} and ${spoken(pair.story)}`;
        const tail = event.finished ? (solo ? ` All pairs found in ${state.moves} moves.` : " All pairs found.")
          : ` ${foundCount(state)} of ${pairCount(state)} pairs found.`;
        setMessage(`${said}. A pair: ${both}.${tail}`);
      } else {
        setMessage(`${said}. Not a pair.${solo ? "" : ` ${state.players[state.turn]}'s turn.`}`);
      }
    }
    if (event.type === "pair" && event.finished) {
      clock.current = clockStop(clock.current, Date.now());
      onFinish({ ...state, elapsedMs: Math.round(clock.current.bankedMs) });
    } else {
      commit(state);
    }
  }, [game, data, pairsById, solo, closeCards, commit, onFinish]);

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "Enter" || event.key === " ") { // handled here, so a repeat or the browser's own click is harmless
      event.preventDefault();
      if (!event.repeat) tap(index);
      return;
    }
    const last = game.cards.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: Math.min(last, index + 1), ArrowLeft: Math.max(0, index - 1),
      ArrowDown: index + game.columns <= last ? index + game.columns : index,
      ArrowUp: index - game.columns >= 0 ? index - game.columns : index, Home: 0, End: last,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    setFocusIndex(targets[event.key]);
    cardRefs.current[targets[event.key]]?.focus();
  };

  const faceOf = (index: number): CardFace =>
    game.matched[index] !== null ? "matched" : game.up.includes(index) ? "up" : closing.includes(index) ? "closing" : "down";
  const partnerOf = (index: number) => {
    const other = game.cards.findIndex((card, n) => n !== index && card.pair === game.cards[index].pair);
    return cardText(data, game.cards[other]);
  };
  const typed = typedBacks(game.difficulty);
  const totals = scores(game);
  const elapsed = clockRead(clock.current, now);
  const foundPairs = game.found.map((id) => pairsById.get(id)!);

  return <section className={`mm-play is-${game.difficulty}`} aria-label="Memory card match board">
    <div className="mm-bar">
      {solo ? <>
        <span>{plural(game.moves, "{n} move", "{n} moves")}</span>
        {settings.timerHidden ? null : <span className="mm-timer" aria-label={`Time ${formatTime(elapsed)}`}>{formatTime(elapsed)}</span>}
        <button type="button" className="mm-link" onClick={() => onSettings({ ...settings, timerHidden: !settings.timerHidden })}>
          {settings.timerHidden ? "Show timer" : "Hide timer"}
        </button>
        <span>{`Pairs found ${formatNumber(foundCount(game))} of ${formatNumber(pairCount(game))}`}</span>
      </> : <>
        <span className="mm-turn">{`${game.players[game.turn]}'s turn`}</span>
        <ul className="mm-scores" aria-label="Pairs per player">
          {game.players.map((name, n) => <li key={name + n} className={n === game.turn ? "is-turn" : undefined}>
            {name}: <strong>{totals[n]}</strong>
          </li>)}
        </ul>
      </>}
    </div>
    <div role="group" lang="en" aria-label={`Cards, ${game.columns} columns by ${rows} rows`}
      className={`mm-grid${reduced ? " is-reduced" : ""}`}
      style={{ "--mm-cols": game.columns, "--mm-rows": rows } as CSSProperties}>
      {game.cards.map((card, index) => {
        const face = faceOf(index);
        const text = face === "down" ? null : cardText(data, card);
        return <Card key={index} ref={(el) => { cardRefs.current[index] = el; }} card={card} face={face} text={text}
          partner={face === "matched" ? partnerOf(index) : null} typed={typed}
          row={Math.floor(index / game.columns) + 1} column={(index % game.columns) + 1} tone={toneOf.get(card.pair) ?? 0}
          focusable={index === focusIndex} onFlip={() => tap(index)} onKeyDown={(event) => move(event, index)}
          onFocus={() => setFocusIndex(index)} />;
      })}
    </div>
    <p className="sr-only" aria-live="polite">{message}</p>
    {isHolding(game) && settings.turnBack === "tap" && <button type="button" className="mm-secondary mm-turn-back" onClick={doTurnBack}>
      Turn them back
    </button>}
    <div className="mm-found">
      <h2>Pairs found</h2>
      {foundPairs.length ? <ul>
        {foundPairs.map((pair) => <li key={pair.id}>
          <strong>{data.characters[pair.who].label}</strong> — {pair.story} · <span className="mm-ref">{pair.ref}</span>
        </li>)}
      </ul> : <p className="mm-note">None yet.</p>}
    </div>
    <div className="mm-actions">
      <button type="button" className="mm-secondary" onClick={onRestart}>New cards</button>
      {confirmQuit ? <span className="mm-confirm">Leave this board?
        <button type="button" className="mm-secondary" onClick={onQuit}>Yes, quit</button>
        <button type="button" className="mm-secondary" onClick={() => setConfirmQuit(false)}>Keep playing</button>
      </span> : <button type="button" className="mm-secondary" onClick={() => setConfirmQuit(true)}>Quit</button>}
    </div>
  </section>;
}
