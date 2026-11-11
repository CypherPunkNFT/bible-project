// Bible twenty questions, guess mode: the player thinks of someone and the site asks (design §8, §11.2–11.4). Every
// screen is worked out from the saved turns, so a reload resumes exactly. The anonymous report (§10.3) is held while
// the result screen is open and sent when the player leaves it, so "Actually, that wasn't my person" can still take a
// win back without a false report. The look: the thinking head reacts to every answer, the question slides in, the
// guess arrives as a card after a beat, and the ending fills the trail gold with one burst (the audit's items 1, 2, 5, 6).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatNumber } from "@/lib/site-format";
import { Confetti, ResultPanel, useCountUp } from "../kit";
import { EXTRA_TURNS, TURNS, nextStep, questionsAnswered, type Answer, type Engine, type Softened } from "./engine";
import { Lesson, YourAnswers } from "./Lesson";
import { PersonSummary, QuitButton, Trail } from "./parts";
import { PersonSearch, type Pick as Choice } from "./PersonSearch";
import { buildReport, sendReport, type Report } from "./report";
import { moodAfter, useEvidence } from "./shared";
import type { GuessGame } from "./storage";
import { Thinker, type Mood } from "./Thinker";

interface Props {
  engine: Engine;
  game: GuessGame;
  softened: Softened;
  onUpdate: (game: GuessGame) => void;
  onSoften: (personId: string, tagId: string) => void;
  onPlayAgain: () => void;
  onSwap: () => void;
  onQuit: () => void;
}

/** Holds one report until the player leaves the screen: a button, a link, the page closing or the game closing. */
function useReportOnLeave() {
  const held = useRef<Report | null>(null);
  const flush = useCallback(() => {
    if (held.current) sendReport(held.current);
    held.current = null;
  }, []);
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); flush(); };
  }, [flush]);
  return { held, flush };
}

export function GuessMode(props: Props) {
  const { engine, game } = props;
  const report = useReportOnLeave();
  const leave = (then: () => void) => () => { report.flush(); then(); };
  if (game.over === "won") return <Won {...props} report={report} leave={leave} />;
  if (game.over === "lost") return <Lost {...props} report={report} leave={leave} />;
  return <Play engine={engine} game={game} softened={props.softened} onUpdate={props.onUpdate} onQuit={props.onQuit} />;
}

type Leave = (then: () => void) => () => void;
type Held = ReturnType<typeof useReportOnLeave>;

const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || !!target.closest("input, textarea, select"));
const isControl = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest("button, a, summary");

const KEY_OF: Record<Answer, string> = { y: "Y", n: "N", d: "D" };
const WORD_OF: Record<Answer, string> = { y: "Yes", n: "No", d: "Don't know" };

function Play({ engine, game, softened, onUpdate, onQuit }: Pick<Props, "engine" | "game" | "softened" | "onUpdate" | "onQuit">) {
  const { turns } = game;
  const step = useMemo(() => nextStep(engine, turns, game.seed, game.limit, softened), [engine, turns, game.seed, game.limit, softened]);
  const [quitting, setQuitting] = useState(false);
  const [pressed, setPressed] = useState<{ answer: Answer; at: number } | null>(null);
  const answer = useCallback((a: Answer) => {
    if (step.kind !== "ask") return;
    setPressed({ answer: a, at: turns.length });
    onUpdate({ ...game, turns: [...turns, { kind: "q", tag: step.tag, answer: a }] });
  }, [game, turns, step, onUpdate]);
  const guessReply = useCallback((right: boolean) => {
    if (step.kind !== "guess") return;
    onUpdate({ ...game, turns: [...turns, { kind: "g", person: step.person, right }], over: right ? "won" : null });
  }, [game, turns, step, onUpdate]);
  const undo = useCallback(() => { if (turns.length) onUpdate({ ...game, turns: turns.slice(0, -1) }); }, [game, turns, onUpdate]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (quitting || event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      if (step.kind === "ask" && (key === "y" || key === "n" || key === "d")) answer(key);
      else if (step.kind === "guess" && (key === "y" || (key === "enter" && !isControl(event.target)))) guessReply(true);
      else if (step.kind === "guess" && key === "n") guessReply(false);
      else if (key === "u") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, answer, guessReply, undo, quitting]);

  const last = turns[turns.length - 1];
  const asked = questionsAnswered(turns);
  const mood: Mood = step.kind === "guess" ? "guess" : step.kind === "out" ? "beaten" : moodAfter(last, asked);
  const streak = turns.length >= 6 && turns.slice(-6).every((t) => t.kind === "q" && t.answer === "d");
  const justPressed = pressed && pressed.at === turns.length - 1 ? pressed : null;
  return <div className="tq-play">
    <Trail kinds={turns.map((t) => t.kind)} limit={game.limit} thinking={step.kind === "guess"} />
    <div className={`tq-stage is-${step.kind}`} aria-live="polite">
      <Thinker mood={mood} beat={turns.length} />
      {step.kind === "ask" && <div className="tq-words" key={turns.length}>
        <h1 className="tq-question">{engine.data.tags[step.tag].q}</h1>
        {streak && <p className="tq-hint">That's all right: try a few yes or no answers if you can.</p>}
        {!streak && asked >= 15 && <p className="tq-hint">Thinking hard…</p>}
      </div>}
      {step.kind === "guess" && <div className="tq-words" key="guess">
        <p className="tq-ask tq-ready">I think I know…</p>
        <div className="tq-guess-card">
          <p className="tq-ask">Are you thinking of…</p>
          <h1 className="tq-guess-name">{engine.data.people[step.person].label}?</h1>
          <p className="tq-hint">{engine.data.people[step.person].b}</p>
          <div className="tq-guess-buttons">
            <button type="button" className="tq-primary" onClick={() => guessReply(true)}>Yes, that's them!</button>
            <button type="button" className="tq-secondary" onClick={() => guessReply(false)}>No</button>
          </div>
        </div>
      </div>}
      {step.kind === "out" && <div className="tq-words" key="out">
        <h1 className="tq-question">{game.limit === TURNS ? "I'm out of questions." : "I'm out of turns."}</h1>
        <p className="tq-hint">{game.limit === TURNS ? `I can keep going for ${formatNumber(EXTRA_TURNS)} more, or you can tell me who it was.` : "Tell me who it was, and I'll learn from it."}</p>
      </div>}
    </div>
    <div className="tq-buttons">
      {step.kind === "ask" && (["y", "n", "d"] as const).map((a) => <button key={a} type="button" className={`tq-answer is-${a}`} onClick={() => answer(a)}>
        <span>{WORD_OF[a]}</span>
        <kbd className="tq-key" aria-hidden="true">{KEY_OF[a]}</kbd>
        {justPressed?.answer === a && <span key={justPressed.at} className="tq-hit" aria-hidden="true" />}
      </button>)}
      {step.kind === "out" && <>
        {game.limit === TURNS && <button type="button" className="tq-answer" onClick={() => onUpdate({ ...game, limit: TURNS + EXTRA_TURNS })}>{`Keep going: ${formatNumber(EXTRA_TURNS)} more`}</button>}
        <button type="button" className="tq-answer is-soft" onClick={() => onUpdate({ ...game, over: "lost" })}>I give up, tell me who you were thinking of</button>
      </>}
    </div>
    <div className="tq-foot">
      <button type="button" className="tq-quiet" disabled={!turns.length} onClick={undo}>Undo</button>
      <QuitButton onQuit={onQuit} onOpen={setQuitting} />
    </div>
  </div>;
}

type ResultProps = Props & { report: Held; leave: Leave };

function Won({ engine, game, onUpdate, onPlayAgain, onSwap, report, leave }: ResultProps) {
  const refs = useEvidence(engine.data.version);
  const last = game.turns[game.turns.length - 1];
  const person = last?.kind === "g" ? last.person : -1;
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useCountUp(game.turns.length, 900, 1);
  useEffect(() => {
    report.held.current = person >= 0 ? buildReport(engine, game.turns, engine.data.people[person].id, true, [], "won") : null;
    heading.current?.focus();
  }, [engine, game.turns, person, report]);
  if (person < 0) return null;
  const takeBack = () => { // "Actually, that wasn't my person": reopen as if they had said No, with nothing reported
    report.held.current = null;
    onUpdate({ ...game, turns: [...game.turns.slice(0, -1), { kind: "g", person, right: false }], over: null });
  };
  return <div className="tq-result tq-won">
    <ResultPanel
      trail={<Trail kinds={game.turns.map((t) => t.kind)} limit={game.limit} won />}
      actions={<>
        <button type="button" className="tq-primary" onClick={leave(onPlayAgain)}>Play again</button>
        <button type="button" className="tq-secondary" onClick={leave(onSwap)}>Swap: you ask the questions</button>
      </>}
      reading={<>
        <PersonSummary person={engine.data.people[person]} onLeave={report.flush} />
        <YourAnswers engine={engine} person={person} turns={game.turns} refs={refs} />
        <button type="button" className="tq-quiet" onClick={takeBack}>Actually, that wasn't my person</button>
      </>}>
      <div className="tq-result-art"><Thinker mood="yes" beat={0} /><Confetti when count={30} /></div>
      <h1 ref={heading} tabIndex={-1}>
        <span aria-hidden="true">{`Got it in ${formatNumber(shown)}!`}</span>
        <span className="sr-only">{`Got it in ${formatNumber(game.turns.length)}!`}</span>
      </h1>
      <p className="tq-result-name">{engine.data.people[person].label}</p>
    </ResultPanel>
  </div>;
}

function Lost({ engine, game, onSoften, onPlayAgain, onSwap, report, leave }: ResultProps) {
  const refs = useEvidence(engine.data.version);
  const [pick, setPick] = useState<Choice | null>(null);
  const [disputed, setDisputed] = useState<string[]>([]);
  const [accepted, setAccepted] = useState<string[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [pick]);
  useEffect(() => { // the report follows the player's choices and goes when they leave this screen
    const who = pick?.kind === "pool" ? engine.data.people[pick.person].id : pick?.kind === "other" ? pick.id : null;
    report.held.current = who ? buildReport(engine, game.turns, who, pick!.kind === "pool", disputed, "lost") : null;
  }, [engine, game.turns, pick, disputed, report]);

  const dispute = (tagId: string) => {
    if (pick?.kind !== "pool") return;
    setDisputed((d) => (d.includes(tagId) ? d : [...d, tagId]));
    onSoften(engine.data.people[pick.person].id, tagId);
  };
  const actions = <div className="tq-actions">
    <button type="button" className="tq-primary" onClick={leave(onPlayAgain)}>Play again</button>
    <button type="button" className="tq-secondary" onClick={leave(onSwap)}>Swap: you ask the questions</button>
  </div>;

  if (!pick) return <div className="tq-result tq-lost">
    <div className="tq-result-art"><Thinker mood="beaten" beat={0} /><Confetti when count={30} /></div>
    <h1 ref={heading} tabIndex={-1}>You win! Who were you thinking of?</h1>
    <PersonSearch engine={engine} label="Their name" wider onPick={setPick} />
  </div>;
  if (pick.kind === "none") return <div className="tq-result">
    <h1 ref={heading} tabIndex={-1}>No problem.</h1>
    <p className="tq-lede">This game only knows real people from the Bible, not angels or people in parables. Thanks for playing.</p>
    {actions}
  </div>;
  if (pick.kind === "other") return <div className="tq-result">
    <h1 ref={heading} tabIndex={-1}>{`${pick.label} is a good one.`}</h1>
    <p className="tq-lede">{`${pick.label} isn't in the game yet. Your game has been noted, and people chosen often are added later.`}</p>
    {actions}
  </div>;
  const person = engine.data.people[pick.person];
  return <div className="tq-result">
    <h1 ref={heading} tabIndex={-1}>{`It was ${person.label}.`}</h1>
    <PersonSummary person={person} onLeave={report.flush} />
    <Lesson engine={engine} person={pick.person} turns={game.turns} refs={refs} disputed={disputed} accepted={accepted}
      onAccept={(id) => setAccepted((a) => [...a, id])} onDispute={dispute} />
    {actions}
  </div>;
}
