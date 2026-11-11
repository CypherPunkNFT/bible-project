// The start screen (design §10.1) as a lobby: the game shown before it is played. The three levels are cards, each
// carrying a famous verse (loaded from the pool, so it is the Bible's own wording) with its hidden words as gaps: a
// few for Easy, half for Medium, nearly all for Hard. Pick and Type are one two-way switch, with Whole words and First
// letters under Type, and Verses from as chips. When progress can be saved, My verses is a small ring (verses saved,
// how many memorised) and the day streak a flame badge; a round in progress is a card you tap to resume.
import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/site-format";
import type { Catalog } from "@/lib/types";
import { Gap } from "./Card";
import { StreakFlame } from "../kit";
import { passageText } from "./load";
import type { Level, Passage, Settings } from "./model";
import { ANSWERS, LEGENDS, LEVELS, STYLES, TESTAMENTS } from "./text";
import { words, type Word } from "./words";

interface StartProps {
  catalog: Catalog;
  /** The famous verse the level cards show, when the pool has it. */
  sample: Passage | undefined;
  settings: Settings;
  saving: boolean;
  streak: number;
  counts: { verses: number; due: number; memorised: number };
  resume: { at: number; total: number } | null;
  notice: string;
  onSettings: (settings: Settings) => void;
  onPlay: () => void;
  onReview: () => void;
  onResume: () => void;
  onMyVerses: () => void;
  onHelp: () => void;
}

function Choice<T extends string>({ legend, options, value, onChange }: { legend: string; options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <fieldset className="vc-chips">
    <legend>{legend}</legend>
    {options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </fieldset>;
}

/** Gaps of fixed widths, for a level card whose verse has not loaded. */
const PLACEHOLDER: readonly Pick<Word, "key">[] = ["that", "everyone", "who", "believes", "in", "him", "shall", "not", "perish", "but", "have", "eternal", "life"].map((key) => ({ key }));

/** The sample verse on a level card: the opening in small type, then a gap for each hidden word. */
function Sample({ list, split }: { list: readonly Word[] | null; split: number }) {
  if (!list) return <span className="vc-sample" aria-hidden="true">{PLACEHOLDER.map((word, i) => <Gap key={i} word={word} />)}</span>;
  return <span className="vc-sample" aria-hidden="true">
    <span className="vc-sample-open">{(split > 7 ? "…" : "") + list.slice(Math.max(0, split - 7), split).map((word) => word.text).join("")}</span>
    {list.slice(split).map((word, i) => <Gap key={i} word={word} />)}
  </span>;
}

/** The My verses ring: how many are saved, and how far round the ring the memorised ones reach. */
function VersesRing({ counts, onOpen }: { counts: StartProps["counts"]; onOpen: () => void }) {
  const share = counts.verses ? counts.memorised / counts.verses : 0;
  const length = 2 * Math.PI * 20;
  return <button type="button" className="vc-ring" onClick={onOpen}>
    <span className="vc-ring-dial" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="56" height="56">
        <circle className="is-track" cx="24" cy="24" r="20" />
        <circle className="is-fill" cx="24" cy="24" r="20" strokeDasharray={`${length}`} strokeDashoffset={`${length * (1 - share)}`} />
      </svg>
      <span className="vc-ring-count">{formatNumber(counts.verses)}</span>
    </span>
    <span className="vc-ring-words">
      <span className="vc-ring-title">My verses</span>
      <span className="vc-ring-line">{`Memorised: ${counts.memorised}`}</span>
      {counts.due > 0 && <span className="vc-ring-line is-due">{`Due: ${counts.due}`}</span>}
    </span>
  </button>;
}

export function Start(props: StartProps) {
  const { settings, counts, sample } = props;
  const set = (change: Partial<Settings>) => props.onSettings({ ...settings, ...change });
  const [list, setList] = useState<Word[] | null>(null);
  useEffect(() => {
    if (!sample) return;
    let live = true;
    passageText(props.catalog, sample).then((text) => { if (live) setList(words(text)); }).catch((error) => {
      console.warn(`Verse completion: the sample verse ${sample.id} could not load:`, error);
    });
    return () => { live = false; };
  }, [props.catalog, sample]);
  const splitFor = (level: Level) => sample?.split[level] ?? (level === "easy" ? 10 : level === "medium" ? 6 : 2);
  const mainIsPlay = !props.resume && counts.due === 0;
  return <div className="vc-start">
    <h1>Verse completion</h1>
    <p className="vc-lede">See the start of a verse and finish it. Play for fun, or keep verses to learn by heart.</p>
    {props.saving ? <div className="vc-badges">
      <VersesRing counts={counts} onOpen={props.onMyVerses} />
      {props.streak > 0 && <span className="vc-streak">
        <StreakFlame count={props.streak} litFrom={1} label={`Day streak: ${props.streak}`} />
        <span className="vc-streak-words" aria-hidden="true">Day streak</span>
      </span>}
    </div> : <p className="vc-note">Your progress can't be saved in this browser.</p>}
    {props.notice && <p className="vc-note" role="alert">{props.notice}</p>}
    {(props.resume || counts.due > 0) && <div className="vc-actions">
      {props.resume && <button type="button" className="vc-resume" onClick={props.onResume}>
        <span className="vc-resume-title">Resume round</span>
        <span className="vc-resume-line">{`Card ${props.resume.at} of ${props.resume.total}`}</span>
      </button>}
      {counts.due > 0 && <button type="button" className={props.resume ? "vc-secondary" : "vc-primary"} onClick={props.onReview}>{`Review (${counts.due} due)`}</button>}
    </div>}
    <div className="vc-switch" role="group" aria-label={LEGENDS.mode.label}>
      {ANSWERS.map((option) => <button key={option.value} type="button" aria-pressed={settings.answer === option.value} onClick={() => set({ answer: option.value })}>{option.label}</button>)}
    </div>
    {settings.answer === "type" && <Choice legend={LEGENDS.typing.label} options={STYLES} value={settings.style} onChange={(style) => set({ style })} />}
    <fieldset className="vc-levels">
      <legend>{LEGENDS.difficulty.label}</legend>
      {LEVELS.map((level, i) => <button key={level.value} type="button" className="vc-level" aria-pressed={settings.level === level.value} style={{ animationDelay: `${i * 70}ms` }} onClick={() => set({ level: level.value })}>
        <span className="vc-level-name">{level.label}</span>
        <span className="vc-level-text">{level.text}</span>
        <Sample list={list} split={splitFor(level.value)} />
      </button>)}
    </fieldset>
    <Choice legend={LEGENDS.from.label} options={TESTAMENTS} value={settings.testament} onChange={(testament) => set({ testament })} />
    <div className="vc-actions">
      <button type="button" className={mainIsPlay ? "vc-primary is-big" : "vc-secondary"} onClick={props.onPlay}>Play</button>
      <button type="button" className="vc-link" onClick={props.onHelp}>How to play</button>
    </div>
  </div>;
}
