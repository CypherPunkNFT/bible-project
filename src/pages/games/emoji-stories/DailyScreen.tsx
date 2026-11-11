// The Daily (design §8.1): one puzzle for everyone on a local date, three typed guesses or two with choices, each miss
// opening the next hint, and a share line that shows the puzzle, not the answer. The record is re-read from storage
// before every guess, so two tabs on the same day share one set of guesses. Redesigned from the visual audit: the
// guesses are tile rows on screen from the start, each guess turning its row red, amber or green with the verdict in
// words; the solved screen rises a band with the verdict, then the stats and the kit's Share (Copied / Copy this).
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { formatDate, formatNumber } from "@/lib/site-format";
import { FeedbackBand, ShareButton } from "../kit";
import { choicesFor } from "./deal";
import type { GameData } from "./data";
import { Choices, EmojiRow, Hints, TypeAnswer } from "./Puzzle";
import { Reveal } from "./Reveal";
import { VERDICT_TEXT } from "./rules";
import { shareText, verdictOf, type Verdict } from "./share";
import { addToStats, browserStore, currentStreak, maxGuesses, readDevice, type AnswerMode, type DailyRecord, type Device } from "./storage";
import type { Story } from "./types";

const CHOICE_SEED = 7919;
const BAND_TONE: Record<Verdict, "right" | "wrong" | "part"> = { right: "right", close: "part", wrong: "wrong" };

export function DailyPlay({ data, n, today, device, save, stored, defaultAnswer, focusHeading, onNewDay }: {
  data: GameData;
  n: number;
  today: number;
  device: Device;
  save: (device: Device) => void;
  /** False once the device has refused a write: the in-memory record is then the only true one. */
  stored: boolean;
  /** How a fresh Daily opens: Typing, or Choices on a translated site (§6.1). */
  defaultAnswer: AnswerMode;
  /** Move focus to the heading on arrival (after "Play the new puzzle"). */
  focusHeading: boolean;
  onNewDay: () => void;
}) {
  const [note, setNote] = useState<{ text: string; close: boolean }>({ text: "", close: false });
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (focusHeading) heading.current?.focus(); }, [focusHeading]);
  const id = n >= 1 ? data.daily.storyFor(n) : null;
  const story = id ? data.byId.get(id) : undefined;
  // A Daily already over when the page opened was restored: its reveal must not take focus or count anything again.
  const restored = useRef(device.daily?.n === n && device.daily.over).current;
  if (n < 1) return <p className="es-muted">{`Puzzle #1 starts on ${formatDate(data.daily.dateOf(1))}.`}</p>;
  if (!story) return <p className="es-muted">Today's puzzle could not be found. Try Practice instead.</p>;
  const ours = device.daily?.n === n ? device.daily : null;
  const mode = ours ? ours.mode : defaultAnswer;
  const fresh: DailyRecord = { n, mode, guesses: [], asked: 0, over: false, won: false };
  const record = ours ?? fresh;
  const wrong = record.guesses.filter((guess) => guess !== story.id).length;
  const opened = Math.min(3, wrong + record.asked);
  const verdictFor = (pick: string) => verdictOf(story, data.byId.get(pick)!);
  /** The record to change: re-read from storage so two tabs share one set of guesses; null when another tab has
   * already moved on to a newer puzzle, so this stale one never overwrites it. */
  const latest = (): Device | null => {
    const saved = stored ? readDevice(browserStore("localStorage"), data.known) : device;
    if ((saved.daily?.n ?? 0) > n) return null;
    return saved.daily?.n === n ? saved : { ...device, daily: ours };
  };
  const guess = (pick: string) => {
    const base = latest();
    if (!base) return setNote({ text: "A newer puzzle has been played in another tab. Play the new puzzle.", close: false });
    const current = base.daily ?? fresh;
    if (current.over) return save(base);
    if (current.guesses.includes(pick)) return setNote({ text: "Already tried: pick another story.", close: false });
    const guesses = [...current.guesses, pick];
    const won = pick === story.id;
    const next: DailyRecord = { ...current, guesses, won, over: won || guesses.length >= maxGuesses(current.mode) };
    const close = !won && verdictFor(pick) === "close";
    setNote({ text: won ? "" : close ? "Right person, different story." : "Not this one.", close });
    save({ ...base, daily: next, stats: addToStats(base.stats, next) });
  };
  const askHint = () => {
    const base = latest();
    if (!base) return;
    const current = base.daily ?? fresh;
    if (current.over || Math.min(3, current.guesses.filter((g) => g !== story.id).length + current.asked) >= 3) return;
    save({ ...base, daily: { ...current, asked: current.asked + 1 } });
  };
  const switchAnswer = (answer: AnswerMode) => {
    const base = latest();
    if (!base) return;
    const current = base.daily ?? fresh;
    if (current.guesses.length || current.over) return;
    save({ ...base, daily: { ...current, mode: answer } });
  };
  const last = record.guesses.length ? data.byId.get(record.guesses[record.guesses.length - 1]) : null;
  const verdict: Verdict = record.won ? "right" : last ? verdictOf(story, last) : "wrong";
  return (
    <section className="es-daily" aria-labelledby="es-daily-title">
      <h2 id="es-daily-title" ref={heading} tabIndex={-1} className="es-heading">{`Today's puzzle #${n}`}</h2>
      {today > n && <p className="es-banner">A new puzzle is ready. <button type="button" onClick={onNewDay}>Play the new puzzle</button></p>}
      <EmojiRow story={story} emoji={data.emoji} large words={opened >= 2 || record.over} />
      <Hints story={story} opened={opened} />
      {!record.over && (
        <>
          <AnswerSwitch mode={mode} locked={record.guesses.length > 0} onAnswer={switchAnswer} />
          {mode === "choices" ? (
            <Choices ids={choicesFor(story, data.stories, n * CHOICE_SEED)} byId={data.byId} onPick={guess} tried={record.guesses}
              close={record.guesses.filter((pick) => verdictFor(pick) === "close")} />
          ) : (
            <TypeAnswer index={data.index} onGuess={guess} tried={record.guesses} />
          )}
          <p className={`es-feedback${note.close ? " is-close" : ""}`} aria-live="polite">{note.text}</p>
        </>
      )}
      <GuessSlots record={record} byId={data.byId} verdictFor={verdictFor} />
      {!record.over && opened < 3 && <button type="button" className="es-secondary" onClick={askHint}>Hint (shows on your share)</button>}
      <FeedbackBand open={record.over} tone={BAND_TONE[verdict]} focusAction={false} className="es-band"
        verdict={<span className="es-band-word">{VERDICT_TEXT[verdict]}</span>} />
      {record.over && (
        <Reveal story={story} verdict={verdict} picked={record.won ? null : last} words={false} showVerdict={false} focus={!restored}>
          <DailyStats device={device} today={today} />
          <ShareButton text={shareText(n, story, record, data.byId)} game="Emoji stories" className="es-share" />
        </Reveal>
      )}
      {!stored && <p className="es-muted">Your scores and streak cannot be remembered on this device.</p>}
    </section>
  );
}

/** The Daily's guess rows (§11.2): one tile row per guess allowed, on screen from the start; a guess turns its row
 * red, amber or green with the verdict in words, the rows still to use stay empty. */
function GuessSlots({ record, byId, verdictFor }: { record: DailyRecord; byId: ReadonlyMap<string, Story>; verdictFor: (id: string) => Verdict }) {
  const slots = Array.from({ length: maxGuesses(record.mode) }, (_, index) => record.guesses[index] ?? null);
  const words: Record<Verdict, string> = { right: "Right", close: "Right person, different story", wrong: "Not this one" };
  return (
    <>
      {!record.over && <p className="es-progress">{`Guess ${record.guesses.length + 1} of ${maxGuesses(record.mode)}`}</p>}
      <ol className="es-slots" aria-label="Your guesses">
        {slots.map((pick, index) => pick ? (
          <li key={`${index}-${pick}`} className={`es-slot is-${verdictFor(pick)}`} style={{ "--es-i": index } as CSSProperties}>
            <span className="es-slot-number" aria-hidden="true">{formatNumber(index + 1)}</span>
            <span className="es-slot-title">{byId.get(pick)?.title}</span> <span className="es-slot-word">{words[verdictFor(pick)]}</span>
          </li>
        ) : (
          <li key={index} className={`es-slot is-empty${index === record.guesses.length && !record.over ? " is-next" : ""}`} aria-label="Not used yet">
            <span className="es-slot-number" aria-hidden="true">{formatNumber(index + 1)}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

export function AnswerSwitch({ mode, locked = false, onAnswer }: { mode: AnswerMode; locked?: boolean; onAnswer: (mode: AnswerMode) => void }) {
  return (
    <fieldset className="es-switch">
      <legend>Answer with</legend>
      <button type="button" aria-pressed={mode === "choices"} disabled={locked} onClick={() => onAnswer("choices")}>Choices</button>
      <button type="button" aria-pressed={mode === "typing"} disabled={locked} onClick={() => onAnswer("typing")}>Typing</button>
      {locked && <p className="es-muted">The way to answer is fixed once you have made a guess.</p>}
    </fieldset>
  );
}

function DailyStats({ device, today }: { device: Device; today: number }) {
  const { stats } = device;
  return (
    <dl className="es-stats">
      <div><dt>Played</dt><dd>{formatNumber(stats.played)}</dd></div>
      <div><dt>Solved</dt><dd>{formatNumber(stats.solved)}</dd></div>
      <div><dt>Streak</dt><dd>{formatNumber(currentStreak(stats, today))}</dd></div>
      <div><dt>Best streak</dt><dd>{formatNumber(stats.best)}</dd></div>
      <div><dt>In 1, 2, 3 guesses</dt><dd>{stats.spread.map((count) => formatNumber(count)).join(" · ")}</dd></div>
    </dl>
  );
}
