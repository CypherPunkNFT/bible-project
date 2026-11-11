// Bible twenty questions, reverse mode ("You ask", design §9, §11.5): the site holds a secret person and answers from
// its notes with slip marks undone. Each question or guess costs a turn. Hints, off by default, show the people the
// answers still allow as a suspect board (SuspectBoard.tsx) and how evenly each question would split them. The log is
// an exchange, question over answer, newest at the top; on a phone the newest answer also lands in a band pinned to
// the bottom of the screen, under the thumb, so it is never above the list (the audit's items 3 and 4). Nothing is
// reported from this mode.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { Confetti, FeedbackBand, ResultPanel } from "../kit";
import { TURNS, reverseAnswer, simulate, stillPossible, type Engine, type ReverseAnswer } from "./engine";
import { PersonSummary, QuitButton, Trail, VerseNote } from "./parts";
import { PersonSearch } from "./PersonSearch";
import { QuestionPicker } from "./QuestionPicker";
import { REVERSE_WORDS, useEvidence, type EvidenceRefs } from "./shared";
import type { Move, ReverseGame } from "./storage";
import { BOARD_CARDS, PHONE_CARDS } from "./board";
import { SuspectBoard } from "./SuspectBoard";
import { Thinker } from "./Thinker";

interface Props {
  engine: Engine;
  game: ReverseGame;
  onUpdate: (game: ReverseGame) => void;
  onPlayAgain: () => void;
  onSwap: () => void;
  onQuit: () => void;
}

export function ReverseMode({ engine, game, onUpdate, onPlayAgain, onSwap, onQuit }: Props) {
  const refs = useEvidence(engine.data.version);
  const [guessing, setGuessing] = useState(false);
  const [hints, setHints] = useState(false);
  const narrow = useMediaQuery("(max-width: 639px)");
  const asked = useMemo(() => game.moves.flatMap((m) => (m.kind === "q" ? [m.tag] : [])), [game.moves]);
  const guesses = useMemo(() => game.moves.flatMap((m) => (m.kind === "g" ? [m.person] : [])), [game.moves]);
  const answers = useMemo(() => new Map(asked.map((t) => [t, reverseAnswer(engine, game.secret, t)])), [engine, game.secret, asked]);
  const possible = useMemo(() => (hints ? stillPossible(engine, asked, game.secret, guesses) : null), [hints, engine, asked, game.secret, guesses]);

  const move = useCallback((next: Move) => {
    const moves = [...game.moves, next];
    const right = next.kind === "g" && next.person === game.secret;
    onUpdate({ ...game, moves, over: right ? "won" : moves.length >= TURNS ? "lost" : null });
  }, [game, onUpdate]);

  if (game.over) return <ReverseResult engine={engine} game={game} onPlayAgain={onPlayAgain} onSwap={onSwap} />;
  const last = game.moves[game.moves.length - 1];
  return <div className="tq-play tq-reverse">
    <div className="tq-reverse-head">
      <Thinker mood={!last ? "idle" : last.kind === "g" ? "no" : answers.get(last.tag) === "yes" ? "yes" : answers.get(last.tag) === "no" ? "no" : "dunno"} beat={game.moves.length} className="tq-thinker--small" />
      <h1 className="tq-reverse-title">Who am I thinking of?</h1>
    </div>
    <Trail kinds={game.moves.map((m) => m.kind)} limit={TURNS} className="tq-reverse-trail" />
    {!narrow && <p className="sr-only" aria-live="polite">{last ? <Said engine={engine} move={last} answers={answers} /> : null}</p>}
    <div className="tq-actions">
      <button type="button" className="tq-primary" onClick={() => setGuessing(true)} disabled={guessing}>Make a guess</button>
      <label className="tq-switch"><input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} /> Show hints</label>
    </div>
    {guessing && <PersonSearch engine={engine} label="Who is it?" onCancel={() => setGuessing(false)}
      onPick={(pick) => { setGuessing(false); if (pick.kind === "pool") move({ kind: "g", person: pick.person }); }} />}
    {possible && <SuspectBoard engine={engine} people={possible} size={narrow ? PHONE_CARDS : BOARD_CARDS} />}
    <div className="tq-columns">
      <QuestionPicker engine={engine} answers={answers} possible={possible} disabled={guessing} onAsk={(tag) => move({ kind: "q", tag })} />
      <Log engine={engine} game={game} refs={refs} answers={answers} />
    </div>
    {narrow && <FeedbackBand open={!!last} pinned="narrow" focusAction={false} className="tq-band"
      tone={last?.kind === "g" ? "wrong" : last && answers.get(last.tag) === "yes" ? "right" : null}
      verdict={last ? <Said engine={engine} move={last} answers={answers} /> : null}>
      {last?.kind === "q" && <Why engine={engine} game={game} refs={refs} tag={last.tag} answer={answers.get(last.tag)!} />}
    </FeedbackBand>}
    <div className="tq-foot"><QuitButton onQuit={onQuit} /></div>
  </div>;
}

/** One move as words: the question and its answer, or the guess that was wrong (the name in its own element). */
function Said({ engine, move, answers }: { engine: Engine; move: Move; answers: ReadonlyMap<number, ReverseAnswer> }) {
  if (move.kind === "g") return <><span>No, it isn't</span> <s>{engine.data.people[move.person].label}</s></>;
  return <><span className="tq-said-q">{engine.data.tags[move.tag].q}</span> <strong className="tq-said-a">{REVERSE_WORDS[answers.get(move.tag)!]}</strong></>;
}

/** The verse behind a Yes or No, folded under "Why?". */
function Why({ engine, game, refs, tag, answer }: { engine: Engine; game: ReverseGame; refs: EvidenceRefs | null; tag: number; answer: ReverseAnswer }) {
  const verse = answer === "yes" || answer === "no" ? refs?.[engine.data.people[game.secret].id]?.[engine.data.tags[tag].id] : undefined;
  if (verse === undefined) return null;
  return <details className="tq-why"><summary>Why?</summary><VerseNote verse={verse} /></details>;
}

/** The running exchange, newest first: the question in a quiet voice, the answer in the game's colour under it. */
function Log({ engine, game, refs, answers }: { engine: Engine; game: ReverseGame; refs: EvidenceRefs | null; answers: ReadonlyMap<number, ReverseAnswer> }) {
  return <ol className="tq-log" aria-label="Answers so far" reversed>
    {[...game.moves].reverse().map((m, i) => {
      const key = game.moves.length - i;
      if (m.kind === "g") return <li key={key} className={`tq-log-row is-guess${i === 0 ? " is-new" : ""}`}>
        <p className="tq-log-q">You guessed</p>
        <p className="tq-log-a"><span>No, it isn't</span> <s>{engine.data.people[m.person].label}</s></p>
      </li>;
      const answer = answers.get(m.tag)!;
      return <li key={key} className={`tq-log-row is-${answer}${i === 0 ? " is-new" : ""}`}>
        <p className="tq-log-q">{engine.data.tags[m.tag].q}</p>
        <p className="tq-log-a"><strong>{REVERSE_WORDS[answer]}</strong></p>
        <Why engine={engine} game={game} refs={refs} tag={m.tag} answer={answer} />
      </li>;
    })}
    {!game.moves.length && <li className="tq-empty">{`Pick a question. Each question or guess uses one of your ${formatNumber(TURNS)} turns.`}</li>}
  </ol>;
}

function ReverseResult({ engine, game, onPlayAgain, onSwap }: Pick<Props, "engine" | "game" | "onPlayAgain" | "onSwap">) {
  const person = engine.data.people[game.secret];
  const heading = useRef<HTMLHeadingElement>(null);
  const siteTurns = useMemo(() => simulate(engine, game.secret, game.seed), [engine, game.secret, game.seed]);
  const won = game.over === "won";
  useEffect(() => { heading.current?.focus(); }, []);
  const siteKinds: ("q" | "g")[] = siteTurns === null ? [] : [...Array.from({ length: siteTurns - 1 }, () => "q" as const), "g"];
  return <div className={`tq-result ${won ? "tq-won" : "tq-lost-reverse"}`}>
    <ResultPanel
      trail={<div className="tq-compare">
        <div className="tq-compare-row"><span className="tq-compare-who">You</span><Trail kinds={game.moves.map((m) => m.kind)} limit={TURNS} won={won} /></div>
        {siteTurns !== null && <div className="tq-compare-row"><span className="tq-compare-who">The site</span><Trail kinds={siteKinds} limit={TURNS} won /></div>}
      </div>}
      actions={<>
        <button type="button" className="tq-primary" onClick={onPlayAgain}>Play again</button>
        <button type="button" className="tq-secondary" onClick={onSwap}>Swap: I think, you guess</button>
      </>}
      reading={<PersonSummary person={person} />}>
      <div className="tq-result-art"><Thinker mood={won ? "beaten" : "guess"} beat={0} />{won && <Confetti when count={30} />}</div>
      <h1 ref={heading} tabIndex={-1}>{won ? `Yes! It was ${person.label}. You got it in ${formatNumber(game.moves.length)}.` : `Out of turns. It was ${person.label}.`}</h1>
      <p className="tq-lede">{siteTurns === null ? "This one is hard: the site couldn't find them in 20 turns either."
        : plural(siteTurns, "The site would have needed about {n} turn.", "The site would have needed about {n} turns.")}</p>
    </ResultPanel>
  </div>;
}
