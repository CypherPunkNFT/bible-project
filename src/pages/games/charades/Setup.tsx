// Family charades: the start screen (design §7.1). Every choice is a row of chips; the deck chips too small for the age
// group are disabled with the reason. Start runs the Start tap (CharadesGame.tsx, §5.4).
import { Play } from "lucide-react";
import type { ReactNode } from "react";
import { GAME_ART, GameArtImage } from "../art";
import { AGE_GROUPS, DIFFICULTIES, deckOffered, usesDifficulty, type DeckKey, type Scene, type ScenesFile } from "./deck";
import { MAX_TEAM_NAME, ROUND_SECONDS, TEAM_COUNTS, TURN_COUNTS } from "./game";
import type { Controls, Mode, Settings } from "./storage";

export interface TeamSetup { on: boolean; names: string[]; turnsEach: number }

interface Props {
  file: ScenesFile;
  settings: Settings;
  teams: TeamSetup;
  /** Whether this browser knows orientation events at all; if not, the tilt option is hidden. */
  tiltKnown: boolean;
  best: number;
  saving: boolean;
  notice: string | null;
  starting: boolean;
  onSettings: (change: Partial<Settings>) => void;
  onTeams: (teams: TeamSetup) => void;
  onStart: () => void;
}

function Chips<T extends string | number>({ label, options, value, onPick, disabled }: {
  label: string; options: readonly { key: T; label: string; note?: string }[]; value: T; onPick: (key: T) => void; disabled?: (key: T) => boolean;
}) {
  return <fieldset className="ch-chips">
    <legend>{label}</legend>
    {options.map((o) => <button key={o.key} type="button" aria-pressed={o.key === value} disabled={disabled?.(o.key)}
      title={disabled?.(o.key) ? "Not enough scenes for this age yet" : undefined} onClick={() => onPick(o.key)}>
      {o.label}{disabled?.(o.key) && <span className="ch-chip-note">Not enough scenes for this age yet</span>}
    </button>)}
  </fieldset>;
}

const onOff = [{ key: "on", label: "On" }, { key: "off", label: "Off" }] as const;

export function Setup({ file, settings, teams, tiltKnown, best, saving, notice, starting, onSettings, onTeams, onStart }: Props) {
  const scenes: Scene[] = file.scenes;
  const { mode, ageGroup, deck } = settings;
  const decks: { key: DeckKey; label: string }[] = [{ key: "everything", label: "Everything" }, ...file.themes.map((t) => ({ key: t.key, label: t.title }))];
  const controls = tiltKnown ? settings.controls[mode] : "buttons";
  const setTeamCount = (count: number) => onTeams({ ...teams, names: Array.from({ length: count }, (_, i) => teams.names[i] ?? `Team ${i + 1}`) });
  return <div className="ch-setup">
    <div className="ch-hero">
      <div>
        <h1>Family charades</h1>
        <p className="ch-lede">Hold the phone to your forehead, everyone acts out the Bible scene, and you guess.</p>
      </div>
      <GameArtImage art={GAME_ART.charades} className="ch-hero-art" />
    </div>

    <fieldset className="ch-modes">
      <legend className="sr-only">How to play</legend>
      {([["guess", "Guess it", "Phone on your forehead. Everyone else acts, you guess."], ["act", "Act it", "Classic charades. Read the phone, act it out, the group guesses."]] as const)
        .map(([key, title, text]) => <button key={key} type="button" className="ch-mode" aria-pressed={mode === key} onClick={() => onSettings({ mode: key as Mode })}>
          <strong>{title}</strong><span>{text}</span>
        </button>)}
    </fieldset>

    <Chips label="Who's playing?" options={AGE_GROUPS} value={ageGroup} onPick={(key) => onSettings({ ageGroup: key, deck: deckOffered(scenes, key, deck) ? deck : "everything" })} />
    <Chips label="Deck" options={decks} value={deck} onPick={(key) => onSettings({ deck: key })} disabled={(key) => !deckOffered(scenes, ageGroup, key)} />
    {usesDifficulty(settings) && <Chips label="Difficulty" options={DIFFICULTIES} value={settings.difficulty} onPick={(key) => onSettings({ difficulty: key })} />}
    <Chips label="Round length" options={ROUND_SECONDS.map((s) => ({ key: s, label: `${s} s` }))} value={settings.seconds[ageGroup]}
      onPick={(key) => onSettings({ seconds: { ...settings.seconds, [ageGroup]: key } })} />
    {tiltKnown && <Chips label="Controls" options={[{ key: "tilt" as Controls, label: "Tilt and buttons" }, { key: "buttons" as Controls, label: "Buttons only" }]}
      value={controls} onPick={(key) => onSettings({ controls: { ...settings.controls, [mode]: key } })} />}
    <div className="ch-row">
      <Chips label="Sound" options={onOff} value={settings.sound ? "on" : "off"} onPick={(key) => onSettings({ sound: key === "on" })} />
      <Chips label="Pictures" options={onOff} value={settings.pictures[ageGroup] ? "on" : "off"}
        onPick={(key) => onSettings({ pictures: { ...settings.pictures, [ageGroup]: key === "on" } })} />
      <Chips label="Teams" options={onOff} value={teams.on ? "on" : "off"} onPick={(key) => onTeams({ ...teams, on: key === "on" })} />
    </div>
    {teams.on && <TeamFields teams={teams} onTeams={onTeams} onCount={setTeamCount} />}

    <details className="ch-how">
      <summary>How to play</summary>
      <HowTo mode={mode} />
    </details>

    {notice && <p className="ch-notice" role="status">{notice}</p>}
    <div className="ch-start">
      <button type="button" className="ch-primary ch-go" onClick={onStart} disabled={starting}><Play size={18} aria-hidden="true" />Start</button>
      <p className="ch-best">{saving ? `Best in ${settings.seconds[ageGroup]} seconds: ${best}` : "Best scores are not saved on this device"}</p>
    </div>
  </div>;
}

function TeamFields({ teams, onTeams, onCount }: { teams: TeamSetup; onTeams: (t: TeamSetup) => void; onCount: (n: number) => void }) {
  return <div className="ch-teams">
    <Chips label="How many teams" options={TEAM_COUNTS.map((n) => ({ key: n, label: String(n) }))} value={teams.names.length} onPick={onCount} />
    <Chips label="Turns each" options={TURN_COUNTS.map((n) => ({ key: n, label: String(n) }))} value={teams.turnsEach} onPick={(n) => onTeams({ ...teams, turnsEach: n })} />
    <div className="ch-team-names">
      {teams.names.map((name, i) => <label key={i}>
        <span>{`Team ${i + 1} name`}</span>
        <input type="text" value={name} maxLength={MAX_TEAM_NAME} autoComplete="off"
          onChange={(e) => onTeams({ ...teams, names: teams.names.map((n, j) => (j === i ? e.target.value : n)) })} />
      </label>)}
    </div>
  </div>;
}

function HowTo({ mode }: { mode: Mode }): ReactNode {
  return <div className="ch-how-body">
    <svg className="ch-tilt-drawing" viewBox="0 0 220 70" role="img" aria-label="Tip the phone down for correct, up to pass">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="30" y="10" width="22" height="40" rx="4" transform="rotate(35 41 30)" />
        <path d="M24 56 q14 10 30 0" /><path d="M50 60 l4 -4 l1 6" />
        <rect x="168" y="10" width="22" height="40" rx="4" transform="rotate(-35 179 30)" />
        <path d="M166 6 q14 -6 30 4" /><path d="M192 4 l4 6 l-6 1" />
      </g>
      <text x="40" y="68" textAnchor="middle" fontSize="10" fill="currentColor">Down: got it</text>
      <text x="180" y="68" textAnchor="middle" fontSize="10" fill="currentColor">Up: pass</text>
    </svg>
    <ol>
      {mode === "guess" ? <>
        <li>The guesser holds the phone to their forehead, screen facing out.</li>
        <li>Everyone else acts out the scene. No talking!</li>
        <li>Got it? Tip the phone down. Stuck? Tip it up to pass.</li>
      </> : <>
        <li>The actor reads the scene on the phone and keeps it secret.</li>
        <li>Act it out, no talking, while everyone guesses.</li>
        <li>Tap Got it when someone guesses it, or Pass to skip.</li>
      </>}
      <li>Passes are free. One point for every scene guessed.</li>
      <li>When the time is up, see every scene with its Bible passage.</li>
    </ol>
    <p><strong>What counts:</strong> on Easy and for Little ones, a name or a thing that picks out this scene counts, like
      Zacchaeus, Goliath or the whale. For people with many scenes (Jesus, Moses, Noah, David, Joseph, Elijah, Peter,
      Paul) add what happens, like Jesus and the storm. On Medium and Hard, say who and what happens. Any wording
      counts: whale for the great fish, wise men for the Magi.</p>
  </div>;
}
