// The start screen (design §10.1), laid out like the other games' (owner, 2026-11-13: "nice and standardized like the
// others"): the game's drawing beside the title; where the verses come from as picture tiles like Memory card match's,
// the whole Bible, a testament or a group of books; then one line of Mode, Difficulty, Play and How to play. When progress can be saved, My verses is a small ring (verses saved, how many memorised) and the day
// streak a flame badge; a round in progress is a card you tap to resume.
import { formatNumber } from "@/lib/site-format";
import { GAME_ART, GameArtImage } from "../art";
import { StreakFlame } from "../kit";
import { evenRows } from "../memory-match/even-rows";
import { Tile } from "../memory-match/TileIcons";
import { answerStyle, type Settings } from "./model";
import { LEGENDS, LEVELS, MODES, SOURCES } from "./text";

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

function Choice<T extends string>({ legend, options, value, onChange }: { legend: string; options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <fieldset className="vc-chips">
    <legend>{legend}</legend>
    {options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </fieldset>;
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
  const { settings, counts } = props;
  const set = (change: Partial<Settings>) => props.onSettings({ ...settings, ...change });
  const mainIsPlay = !props.resume && counts.due === 0;
  const level = LEVELS.find((item) => item.value === settings.level) ?? LEVELS[0];
  return <div className="vc-start">
    <div className="vc-start-head">
      <GameArtImage art={GAME_ART.verseCompletion} className="vc-art" />
      <div>
        <h1>Verse completion</h1>
        <p className="vc-lede">See the start of a verse and finish it. Play for fun, or keep verses to learn by heart.</p>
      </div>
    </div>
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
    <fieldset className="mm-tiles vc-from" style={evenRows(SOURCES.length)}>
      <legend>{LEGENDS.from.label}</legend>
      {SOURCES.map((item) => <Tile key={item.value} icon={item.icon} name={item.label} subtitle={item.note}
        pressed={settings.testament === item.value} onClick={() => set({ testament: item.value })} />)}
    </fieldset>
    <div className="vc-start-line">
      <Choice legend={LEGENDS.mode.label} options={MODES} value={answerStyle(settings)}
        onChange={(mode) => set(mode === "pick" ? { answer: "pick" } : { answer: "type", style: mode })} />
      <Choice legend={LEGENDS.difficulty.label} options={LEVELS} value={settings.level} onChange={(value) => set({ level: value })} />
      <div className="vc-actions">
        <button type="button" className={mainIsPlay ? "vc-primary is-big" : "vc-secondary"} onClick={props.onPlay}>Play</button>
        <button type="button" className="vc-link" onClick={props.onHelp}>How to play</button>
      </div>
    </div>
    <p className="vc-note">{level.text}</p>
  </div>;
}
