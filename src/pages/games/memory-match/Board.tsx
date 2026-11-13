// Memory card match: the board in play (design sections 7, 10, 11 and 12; redesign from docs/visual-audits/memory-match.md).
// The track (pips, moves, stars in hand, streak, timer, or the players' chips), the shelf where found pairs land, the
// grid with one tab stop and arrow-key movement by the dealt columns, a polite live region, and New cards / Quit. The
// rules live in game.ts and change at once on every tap; everything timed here (a pair settling, then flying to the
// shelf; a hand-over banner) only decorates a state already committed, and is 0 ms under reduced motion.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { ConfirmDialog, HandOver, motionMs, prefersReducedMotion, teamTone } from "../kit";
import { HOLD_MS, typedBacks, type PairsFile } from "./deal";
import { Card, type CardFace } from "./Card";
import { capitalise, cardText, clockRead, clockStart, clockStop, flip, foundCount, hasStarted, isFinished,
  isHolding, isSolo, pairCount, spoken, turnBack, type Clock, type GameState } from "./game";
import { Shelf, type ShelfPair } from "./Shelf";
import type { Settings } from "./storage";
import { Track } from "./Track";
import type { Version } from "./versions";

/** The second card's turn (CSS 420ms): taps during it are ignored (design 16). */
export const FLIP_MS = 420;
/** A card turning back keeps its words this long, so they never vanish mid-turn (design 11). */
export const CLOSE_MS = 420;
/** A found pair shows both faces and the stamp this long after the turn lands, then lifts off to the shelf. */
export const SETTLE_MS = 650;
/** The flight to the shelf (CSS). */
export const FLY_MS = 550;
/** How long the hand-over banner stays when the turn passes. */
export const HANDOVER_MS = 1600;

interface BoardProps {
  data: PairsFile;
  version: Version;
  game: GameState;
  settings: Settings;
  onChange: (game: GameState) => void;
  onSettings: (settings: Settings) => void;
  onFinish: (game: GameState) => void;
  onRestart: () => void;
  onQuit: () => void;
}

/** The newest pair, still on the board: showing its faces (settle), then flying up to its shelf slot. */
interface Fresh { pair: string; phase: "settle" | "fly" }

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || document.visibilityState !== "hidden");
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

/** Timers that only decorate; all cleared when the board unmounts. */
function useDecorationTimers() {
  const timers = useRef<number[]>([]);
  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; }, []);
  return useCallback((run: () => void, ms: number) => {
    const id = window.setTimeout(() => { timers.current = timers.current.filter((t) => t !== id); run(); }, ms);
    timers.current.push(id);
  }, []);
}

export function Board({ data, version, game, settings, onChange, onSettings, onFinish, onRestart, onQuit }: BoardProps) {
  const visible = usePageVisible();
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const solo = isSolo(game);
  const rows = game.cards.length / game.columns;
  const pairsById = useMemo(() => new Map(data.pairs.map((pair) => [pair.id, pair])), [data]);
  const toneOf = useMemo(() => new Map([...new Set(game.cards.map((c) => c.pair))].map((id, n) => [id, n])), [game.cards]);
  const clock = useRef<Clock>({ bankedMs: game.elapsedMs, since: null });
  const lockUntil = useRef(0);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const slotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const later = useDecorationTimers();
  const [focusIndex, setFocusIndex] = useState(0);
  const [closing, setClosing] = useState<number[]>([]);
  const [fresh, setFresh] = useState<Fresh | null>(null);
  const [streak, setStreak] = useState(0);
  const [handover, setHandover] = useState<number | null>(null);
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
    later(() => setClosing((current) => current.filter((n) => !cards.includes(n))), CLOSE_MS);
  }, [later]);

  const doTurnBack = useCallback(() => {
    if (!isHolding(game)) return;
    closeCards(game.up);
    commit(turnBack(game));
  }, [game, closeCards, commit]);

  // A non-pair turns back after the difficulty's delay, unless the player chose "when I tap"; a tap anywhere on the
  // board turns it back sooner. Hidden pages hold it, and on return it gets its full delay again (design 16).
  useEffect(() => {
    if (!isHolding(game) || settings.turnBack === "tap" || !visible) return;
    const timer = window.setTimeout(doTurnBack, HOLD_MS[game.difficulty]);
    return () => window.clearTimeout(timer);
  }, [game, settings.turnBack, visible, doTurnBack]);

  /** The pair just found settles, lifts off and lands on the shelf: decoration over a state already committed. */
  const takePair = useCallback((pair: string) => {
    setFresh({ pair, phase: "settle" });
    later(() => setFresh((current) => (current?.pair === pair ? { pair, phase: "fly" } : current)), motionMs(FLIP_MS + SETTLE_MS));
    later(() => setFresh((current) => (current?.pair === pair ? null : current)), motionMs(FLIP_MS + SETTLE_MS + FLY_MS));
  }, [later]);

  // The flight: measured once as it starts, from each card's place to the pair's slot on the shelf.
  useLayoutEffect(() => {
    if (fresh?.phase !== "fly") return;
    const slot = slotRefs.current[game.found.indexOf(fresh.pair)];
    const target = slot?.getBoundingClientRect();
    if (!target || !target.width) return;
    game.cards.forEach((card, index) => {
      const element = cardRefs.current[index];
      if (card.pair !== fresh.pair || !element) return;
      const from = element.getBoundingClientRect();
      if (!from.width) return;
      element.style.setProperty("--fly-x", `${Math.round(target.left + target.width / 2 - (from.left + from.width / 2))}px`);
      element.style.setProperty("--fly-y", `${Math.round(target.top + target.height / 2 - (from.top + from.height / 2))}px`);
      element.style.setProperty("--fly-s", `${Math.min(1, target.width / from.width).toFixed(3)}`);
    });
  }, [fresh, game.cards, game.found]);

  const tap = useCallback((index: number) => {
    if (Date.now() < lockUntil.current) return;
    const wasHolding = isHolding(game) ? game.up : [];
    if (!hasStarted(game)) clock.current = clockStart(clock.current, Date.now());
    const { state, event } = flip(game, index);
    if (event.type === "ignored") {
      // A tap on a card already up, or on an empty slot, while a non-pair shows: turn it back now (the audit's item 2).
      if (wasHolding.length && (wasHolding.includes(index) || game.matched[index] !== null)) doTurnBack();
      return;
    }
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
        setStreak((s) => s + 1);
        if (!event.finished) takePair(event.pair);
      } else {
        setMessage(`${said}. Not a pair.${solo ? "" : ` ${state.players[state.turn]}'s turn.`}`);
        setStreak(0);
        if (state.turn !== game.turn) {
          setHandover(state.turn);
          later(() => setHandover(null), motionMs(HANDOVER_MS));
        }
      }
    }
    if (event.type === "pair" && event.finished) {
      clock.current = clockStop(clock.current, Date.now());
      onFinish({ ...state, elapsedMs: Math.round(clock.current.bankedMs) });
    } else {
      commit(state);
    }
  }, [game, data, pairsById, solo, closeCards, commit, onFinish, doTurnBack, takePair, later]);

  /** A tap on the board between the cards turns a showing non-pair back. */
  const tapBoard = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) doTurnBack();
  };

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

  const faceOf = (index: number): CardFace => {
    if (game.matched[index] !== null) return fresh?.pair === game.cards[index].pair ? "matched" : "taken";
    return game.up.includes(index) ? "up" : closing.includes(index) ? "closing" : "down";
  };
  const partnerOf = (index: number) => {
    const other = game.cards.findIndex((card, n) => n !== index && card.pair === game.cards[index].pair);
    return cardText(data, game.cards[other]);
  };
  const typed = typedBacks(game.difficulty);
  const holding = isHolding(game);
  const elapsed = clockRead(clock.current, now);
  const shelfPairs: ShelfPair[] = game.found.map((id) => ({
    pair: pairsById.get(id)!, tone: toneOf.get(id) ?? 0, arriving: fresh?.pair === id,
    player: solo ? null : game.matched[game.cards.findIndex((card) => card.pair === id)],
  }));

  return <section className={`mm-play is-${game.difficulty} is-${version.key}`} aria-label="Memory card match board">
    <Track game={game} toneOf={toneOf} settings={settings} elapsedMs={elapsed} streak={streak} onSettings={onSettings} />
    <Shelf data={data} pairs={shelfPairs} total={pairCount(game)} players={game.players.length}
      slotRef={(place, el) => { slotRefs.current[place] = el; }} />
    <div className="mm-stage">
      <div role="group" lang="en" aria-label={`Cards, ${game.columns} columns by ${rows} rows`}
        className={`mm-grid${reduced ? " is-reduced" : ""}${holding ? " is-holding" : ""}`}
        style={{ "--mm-cols": game.columns, "--mm-rows": rows } as CSSProperties} onClick={tapBoard}>
        {game.cards.map((card, index) => {
          const face = faceOf(index);
          const text = face === "down" ? null : cardText(data, card);
          return <Card key={index} ref={(el) => { cardRefs.current[index] = el; }} card={card} version={version} face={face} text={text}
            partner={face === "matched" || face === "taken" ? partnerOf(index) : null} typed={typed}
            missed={holding && game.up.includes(index)} flying={fresh?.phase === "fly" && fresh.pair === card.pair}
            row={Math.floor(index / game.columns) + 1} column={(index % game.columns) + 1} index={index} tone={toneOf.get(card.pair) ?? 0}
            focusable={index === focusIndex} onFlip={() => tap(index)} onKeyDown={(event) => move(event, index)}
            onFocus={() => setFocusIndex(index)} />;
        })}
      </div>
      {handover !== null && <HandOver className="mm-handover" name={game.players[handover]} tone={teamTone(handover)} />}
    </div>
    <p className="sr-only" aria-live="polite">{message}</p>
    <div className="mm-actions">
      <button type="button" className="mm-secondary" onClick={onRestart}>New cards</button>
      <button type="button" className="mm-secondary" onClick={() => setConfirmQuit(true)}>Quit</button>
    </div>
    <ConfirmDialog open={confirmQuit} title="Leave this board?" confirmLabel="Yes, quit" cancelLabel="Keep playing"
      onConfirm={() => { setConfirmQuit(false); onQuit(); }} onCancel={() => setConfirmQuit(false)} />
  </section>;
}
