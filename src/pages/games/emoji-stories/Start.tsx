// The start screen (design §11.1, redesigned from the visual audit): the owner's example drawn as a live puzzle on
// tiles with its answer as a settled card, then Today's puzzle, Practice and Show a room with their buttons on the
// first phone screen, the settings (difficulty, stories from, the way to answer) behind one fold, and how to play.
import { AnswerCard, MoreOptions } from "../kit";
import { AnswerSwitch } from "./DailyScreen";
import type { GameData } from "./data";
import { DIFFICULTIES, TESTAMENTS, filterKey, isOffered, type Difficulty, type Filter, type TestamentFilter } from "./deal";
import { msUntilMidnight } from "./daily";
import { EmojiRow } from "./Puzzle";
import { currentStreak, type AnswerMode, type Device } from "./storage";

const EXAMPLE = "noah-flood";
const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: "Easy", mixed: "Mixed", hard: "Hard" };
const TESTAMENT_LABELS: Record<TestamentFilter, string> = { both: "Both", old: "Old Testament", new: "New Testament" };
const ANSWER_LABELS: Record<AnswerMode, string> = { choices: "Choices", typing: "Typing" };

function TodayCard({ device, today, onDaily }: { device: Device; today: number; onDaily: () => void }) {
  const record = device.daily?.n === today ? device.daily : null;
  const hours = Math.ceil(msUntilMidnight(new Date()) / 3_600_000);
  return (
    <article className="es-card">
      <h2>{`Today's puzzle #${Math.max(1, today)}`}</h2>
      {record?.over ? (
        <p>{record.won ? `Solved in ${record.guesses.length}. Come back tomorrow, in about ${hours} hours.` : `Not solved today. A new one comes in about ${hours} hours.`}</p>
      ) : (
        <p>One story for everyone today. Three guesses, or two with choices.</p>
      )}
      <p className="es-muted">{`Streak: ${currentStreak(device.stats, today)}`}</p>
      <button type="button" className="es-primary" onClick={onDaily}>{record?.over ? "See today's answer" : "Play today's puzzle"}</button>
    </article>
  );
}

export function Start({ data, device, today, filter, answer, stored, onFilter, onAnswer, onDaily, onPractice, onRoom }: {
  data: GameData;
  device: Device;
  today: number;
  filter: Filter;
  answer: AnswerMode;
  stored: boolean;
  onFilter: (filter: Filter) => void;
  onAnswer: (mode: AnswerMode) => void;
  onDaily: () => void;
  onPractice: () => void;
  onRoom: () => void;
}) {
  const example = data.byId.get(EXAMPLE);
  const offered = isOffered(data.stories, filter);
  const best = device.best[filterKey(filter)];
  return (
    <div className="es-start">
      <h1 className="es-title">Emoji stories</h1>
      <p className="es-lede">A Bible story told in emoji: name the story.</p>
      {example && (
        <div className="es-example">
          <EmojiRow story={example} emoji={data.emoji} />
          <AnswerCard interactive={false} state="right" className="es-choice es-example-answer">
            <span className="es-choice-title">{example.title}</span>
          </AnswerCard>
        </div>
      )}
      <div className="es-cards">
        <TodayCard device={device} today={today} onDaily={onDaily} />
        <article className="es-card">
          <h2>Practice</h2>
          <p>Rounds of ten puzzles. Three points for each one you get without a hint.</p>
          {best !== undefined && <p className="es-muted">{`Best with these settings: ${best} of 30`}</p>}
          {!offered && <p className="es-muted">Not enough stories with these settings. Change them below.</p>}
          <button type="button" className="es-primary" disabled={!offered} onClick={onPractice}>Start practice</button>
        </article>
        <article className="es-card">
          <h2>Show a room</h2>
          <p>For a family or a youth group with one screen: the emoji appear one at a time and everyone shouts the story.</p>
          <button type="button" className="es-primary" disabled={!offered} onClick={onRoom}>Start a room round</button>
        </article>
      </div>
      <MoreOptions className="es-settings" defaultOpen={!offered}
        summary={<><span>Settings</span><span className="es-settings-now" aria-hidden="true">{[DIFFICULTY_LABELS[filter.difficulty], TESTAMENT_LABELS[filter.testament], ANSWER_LABELS[answer]].join(" · ")}</span></>}>
        <fieldset className="es-chips">
          <legend>Difficulty</legend>
          {DIFFICULTIES.map((difficulty) => (
            <button key={difficulty} type="button" aria-pressed={filter.difficulty === difficulty} onClick={() => onFilter({ ...filter, difficulty })}>
              {DIFFICULTY_LABELS[difficulty]}
            </button>
          ))}
        </fieldset>
        <fieldset className="es-chips">
          <legend>Stories from</legend>
          {TESTAMENTS.map((testament) => (
            <button key={testament} type="button" aria-pressed={filter.testament === testament} disabled={!isOffered(data.stories, { ...filter, testament })} onClick={() => onFilter({ ...filter, testament })}>
              {TESTAMENT_LABELS[testament]}
            </button>
          ))}
        </fieldset>
        <AnswerSwitch mode={answer} onAnswer={onAnswer} />
      </MoreOptions>
      {!stored && <p className="es-muted">Your scores and streak cannot be remembered on this device.</p>}
      <details className="es-how">
        <summary>How to play</summary>
        <p>Each row of emoji tells one Bible story, in the order the story tells it. Every picture stands for something in the passage itself.</p>
        <p>Answer by choosing one of four titles, or by typing: pick a story from the suggestions, so spelling never counts against you.</p>
        <p>Hints show where the story is in the Bible, what each picture means, and who is in it. Every answer ends with the passage to read.</p>
      </details>
    </div>
  );
}
