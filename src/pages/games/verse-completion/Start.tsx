// The start screen (design §10.1): the streak and My verses when progress can be saved, Review when anything is due,
// then the answer mode, difficulty and testament, Play and How to play. Settings are remembered.
import { Flame } from "lucide-react";
import type { Settings } from "./model";
import { ANSWERS, LEGENDS, LEVELS, STYLES, TESTAMENTS } from "./text";

interface StartProps {
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

function Choice<T extends string>({ legend, options, value, onChange }: { legend: string; options: readonly { value: T; label: string; text?: string }[]; value: T; onChange: (value: T) => void }) {
  return <fieldset className="vc-chips">
    <legend>{legend}</legend>
    {options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
      {option.label}{option.text && <span className="vc-chip-text">{option.text}</span>}
    </button>)}
  </fieldset>;
}

export function Start(props: StartProps) {
  const { settings, counts } = props;
  const set = (change: Partial<Settings>) => props.onSettings({ ...settings, ...change });
  return <div className="vc-start">
    <h1>Verse completion</h1>
    <p className="vc-lede">See the start of a verse and finish it. Play for fun, or keep verses to learn by heart.</p>
    {props.saving ? <div className="vc-progress">
      {props.streak > 0 && <p className="vc-streak"><Flame size={16} aria-hidden="true" />{`Day streak: ${props.streak}`}</p>}
      <button type="button" className="vc-link" onClick={props.onMyVerses}>
        {`My verses: ${counts.verses} · due: ${counts.due} · memorised: ${counts.memorised}`}
      </button>
    </div> : <p className="vc-note">Your progress can't be saved in this browser.</p>}
    {props.notice && <p className="vc-note" role="alert">{props.notice}</p>}
    <div className="vc-actions">
      {props.resume && <button type="button" className="vc-primary" onClick={props.onResume}>{`Resume round (card ${props.resume.at} of ${props.resume.total})`}</button>}
      {counts.due > 0 && <button type="button" className={props.resume ? "vc-secondary" : "vc-primary"} onClick={props.onReview}>{`Review (${counts.due} due)`}</button>}
    </div>
    <Choice legend={LEGENDS.answer.label} options={ANSWERS} value={settings.answer} onChange={(answer) => set({ answer })} />
    {settings.answer === "type" && <Choice legend={LEGENDS.typing.label} options={STYLES} value={settings.style} onChange={(style) => set({ style })} />}
    <Choice legend={LEGENDS.difficulty.label} options={LEVELS} value={settings.level} onChange={(level) => set({ level })} />
    <Choice legend={LEGENDS.from.label} options={TESTAMENTS} value={settings.testament} onChange={(testament) => set({ testament })} />
    <div className="vc-actions">
      <button type="button" className={props.resume || counts.due > 0 ? "vc-secondary" : "vc-primary"} onClick={props.onPlay}>Play</button>
      <button type="button" className="vc-link" onClick={props.onHelp}>How to play</button>
    </div>
  </div>;
}
