// Bible twenty questions, reverse mode ("You ask", design §9, §11.5): the site holds a secret person and answers from
// its notes with slip marks undone. Each question or guess costs a turn. Hints, off by default, count the people the
// answers still allow (a windowed list, the site's long-list rule) and show how evenly each question would split
// them. Nothing is reported from this mode.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { useRowWindow } from "@/lib/useRowWindow";
import { TURNS, reverseAnswer, simulate, stillPossible, type Engine } from "./engine";
import { Dots, PersonSummary, VerseNote } from "./parts";
import { PersonSearch } from "./PersonSearch";
import { QuestionPicker } from "./QuestionPicker";
import { REVERSE_WORDS, useEvidence, type EvidenceRefs } from "./shared";
import type { ReverseGame } from "./storage";

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
  const asked = useMemo(() => game.moves.flatMap((m) => (m.kind === "q" ? [m.tag] : [])), [game.moves]);
  const guesses = useMemo(() => game.moves.flatMap((m) => (m.kind === "g" ? [m.person] : [])), [game.moves]);
  const answers = useMemo(() => new Map(asked.map((t) => [t, reverseAnswer(engine, game.secret, t)])), [engine, game.secret, asked]);
  const possible = useMemo(() => (hints ? stillPossible(engine, asked, game.secret, guesses) : null), [hints, engine, asked, game.secret, guesses]);

  const move = useCallback((next: ReverseGame["moves"][number]) => {
    const moves = [...game.moves, next];
    const right = next.kind === "g" && next.person === game.secret;
    onUpdate({ ...game, moves, over: right ? "won" : moves.length >= TURNS ? "lost" : null });
  }, [game, onUpdate]);

  if (game.over) return <ReverseResult engine={engine} game={game} onPlayAgain={onPlayAgain} onSwap={onSwap} />;
  const last = game.moves[game.moves.length - 1];
  return <div className="tq-play tq-reverse">
    <h1 className="tq-reverse-title">Who am I thinking of?</h1>
    <Dots kinds={game.moves.map((m) => m.kind)} limit={TURNS} />
    <p className="sr-only" aria-live="polite">{last?.kind === "q" ? `${engine.data.tags[last.tag].q} ${REVERSE_WORDS[answers.get(last.tag)!]}.`
      : last?.kind === "g" ? `No, it isn't ${engine.data.people[last.person].label}.` : ""}</p>
    <div className="tq-actions">
      <button type="button" className="tq-primary" onClick={() => setGuessing(true)} disabled={guessing}>Make a guess</button>
      <label className="tq-switch"><input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} /> Show hints</label>
    </div>
    {guessing && <PersonSearch engine={engine} label="Who is it?" onCancel={() => setGuessing(false)}
      onPick={(pick) => { setGuessing(false); if (pick.kind === "pool") move({ kind: "g", person: pick.person }); }} />}
    {possible && <Possible engine={engine} people={possible} />}
    <div className="tq-columns">
      <Log engine={engine} game={game} refs={refs} />
      <QuestionPicker engine={engine} answers={answers} possible={possible} disabled={guessing} onAsk={(tag) => move({ kind: "q", tag })} />
    </div>
    <div className="tq-foot"><QuitLink onQuit={onQuit} /></div>
  </div>;
}

function QuitLink({ onQuit }: { onQuit: () => void }) {
  const [asking, setAsking] = useState(false);
  return asking ? <span className="tq-confirm">Quit this game?
    <button type="button" className="tq-quiet" onClick={onQuit}>Yes, quit</button>
    <button type="button" className="tq-quiet" onClick={() => setAsking(false)}>Keep playing</button>
  </span> : <button type="button" className="tq-quiet" onClick={() => setAsking(true)}>Quit</button>;
}

/** The running log, newest first. A Yes or No backed by a verse has a "Why?" that shows it. */
function Log({ engine, game, refs }: { engine: Engine; game: ReverseGame; refs: EvidenceRefs | null }) {
  const secret = engine.data.people[game.secret];
  return <ol className="tq-log" aria-label="Answers so far" reversed>
    {[...game.moves].reverse().map((m, i) => {
      if (m.kind === "g") return <li key={game.moves.length - i} className="is-guess">{`No, it isn't ${engine.data.people[m.person].label}.`}</li>;
      const answer = reverseAnswer(engine, game.secret, m.tag), tag = engine.data.tags[m.tag];
      const verse = answer === "yes" || answer === "no" ? refs?.[secret.id]?.[tag.id] : undefined;
      return <li key={game.moves.length - i} className={i === 0 ? "is-new" : ""}>
        {tag.q} — <strong>{REVERSE_WORDS[answer]}</strong>.
        {verse !== undefined && <details className="tq-why"><summary>Why?</summary><VerseNote verse={verse} /></details>}
      </li>;
    })}
    {!game.moves.length && <li className="tq-empty">{`Pick a question below. Each question or guess uses one of your ${formatNumber(TURNS)} turns.`}</li>}
  </ol>;
}

/** "People still possible", with the names in a windowed list behind a toggle. */
function Possible({ engine, people }: { engine: Engine; people: readonly number[] }) {
  const [open, setOpen] = useState(false);
  return <div className="tq-possible">
    <button type="button" className="tq-quiet" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
      {`People still possible: ${formatNumber(people.length)}`}
    </button>
    {open && <PeopleRows engine={engine} people={people} />}
  </div>;
}

function PeopleRows({ engine, people }: { engine: Engine; people: readonly number[] }) {
  const [container, setContainer] = useState<HTMLUListElement | null>(null);
  const keys = useMemo(() => people.map((p) => engine.data.people[p].id), [engine, people]);
  const index = useMemo(() => new Map(keys.map((k, i) => [k, i])), [keys]);
  const rowKey = useCallback((row: number) => keys[row], [keys]);
  const rowOfAnchor = useCallback((key: string) => index.get(key), [index]);
  const { start, end, before, after } = useRowWindow({ rowCount: keys.length, rowKey, anchorKey: rowKey, rowOfAnchor, estimate: 44, gap: 0,
    scroller: "window", container, dataVersion: keys.join(",") });
  const drawn = Array.from({ length: Math.max(0, end - start + 1) }, (_, k) => start + k).filter((i) => i < keys.length);
  return <ul ref={setContainer} className="tq-rows" style={{ paddingTop: before, paddingBottom: after }}>
    {drawn.map((i) => {
      const person = engine.data.people[people[i]];
      return <li key={keys[i]} data-row={i} aria-posinset={i + 1} aria-setsize={keys.length}>
        <span className="tq-result-name">{person.label}</span> <span className="tq-result-brief">{person.b}</span>
      </li>;
    })}
  </ul>;
}

function ReverseResult({ engine, game, onPlayAgain, onSwap }: Pick<Props, "engine" | "game" | "onPlayAgain" | "onSwap">) {
  const person = engine.data.people[game.secret];
  const heading = useRef<HTMLHeadingElement>(null);
  const siteTurns = useMemo(() => simulate(engine, game.secret, game.seed), [engine, game.secret, game.seed]);
  useEffect(() => { heading.current?.focus(); }, []);
  return <div className="tq-result">
    <h1 ref={heading} tabIndex={-1}>{game.over === "won" ? `Yes! It was ${person.label}. You got it in ${game.moves.length}.` : `Out of turns. It was ${person.label}.`}</h1>
    <PersonSummary person={person} />
    <p className="tq-lede">{siteTurns === null ? "This one is hard: the site couldn't find them in 20 turns either."
      : plural(siteTurns, "The site would have needed about {n} turn.", "The site would have needed about {n} turns.")}</p>
    <div className="tq-actions">
      <button type="button" className="tq-primary" onClick={onPlayAgain}>Play again</button>
      <button type="button" className="tq-secondary" onClick={onSwap}>Swap: I think, you guess</button>
    </div>
  </div>;
}
