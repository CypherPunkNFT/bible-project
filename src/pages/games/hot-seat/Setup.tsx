// Hot seat: the setup (design §6.1), in the site's layout. The players as a line-up of small cards, each dealt in as
// it is added, with a coloured pip for its age group; the game's settings folded under one row that says the current
// choices in words, so Start game sits on the first screen; a time estimate; and Start game once the questions have
// loaded. A saved session under 12 hours old is offered back first.
import { ArrowDown, ArrowUp, Play, Plus, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { formatList, plural } from "@/lib/site-format";
import { NAME_MAX } from "@/lib/live-quiz/names";
import { GAME_ART, GameArtImage } from "../art";
import { MoreOptions } from "../kit";
import { MAX_PLAYERS, ROUND_COUNTS, SECONDS, estimateMinutes, type Settings, type TwoChoicesFor } from "./game";
import { GROUPS, MIN_POOL, type Group, type Testament } from "./pool";

export interface RosterRow { name: string; group: Group }
export interface ResumeOffer { round: number; rounds: number; leaders: string[] }

export function Chips<T extends string | number | boolean>({ label, options, value, onPick }: {
  label: string; options: readonly { key: T; label: string }[]; value: T; onPick: (key: T) => void;
}) {
  return <fieldset className="hs-chips">
    <legend>{label}</legend>
    {options.map((o) => <button key={String(o.key)} type="button" aria-pressed={o.key === value} onClick={() => onPick(o.key)}>{o.label}</button>)}
  </fieldset>;
}

const TESTAMENTS: readonly { key: Testament; label: string }[] = [{ key: "", label: "Both" }, { key: "OT", label: "Old Testament" }, { key: "NT", label: "New Testament" }];
const TWO_CHOICES: readonly { key: TwoChoicesFor; label: string }[] = [{ key: "little", label: "Little ones" }, { key: "kids", label: "Little ones and kids" }, { key: "nobody", label: "Nobody" }];
const ON_OFF = [{ key: true, label: "On" }, { key: false, label: "Off" }] as const;

/** Seconds, testament, two choices and sound: the settings the menu can also change mid-game. */
export function GameSettings({ settings, onSettings }: { settings: Settings; onSettings: (change: Partial<Settings>) => void }) {
  return <>
    <Chips label="Seconds per turn" options={SECONDS.map((s) => ({ key: s, label: String(s) }))} value={settings.seconds} onPick={(seconds) => onSettings({ seconds })} />
    <Chips label="Testament" options={TESTAMENTS} value={settings.testament} onPick={(testament) => onSettings({ testament })} />
    <Chips label="Two choices for" options={TWO_CHOICES} value={settings.twoChoices} onPick={(twoChoices) => onSettings({ twoChoices })} />
    <Chips label="Sound" options={ON_OFF} value={settings.sound} onPick={(sound) => onSettings({ sound })} />
  </>;
}

/** The settings row's words: the current choices, each in its own element with a dot between. */
function SettingsSummary({ settings, rounds }: { settings: Settings; rounds: number }) {
  const testament = TESTAMENTS.find((t) => t.key === settings.testament)?.label ?? "Both";
  return <span className="hs-settings-summary">
    <span className="hs-settings-word">Settings</span>
    <span className="hs-settings-now">
      <span>{plural(settings.seconds, "{n} second", "{n} seconds")}</span>
      <span>{testament}</span>
      <span>{plural(rounds, "{n} round", "{n} rounds")}</span>
      <span>{settings.sound ? "Sound on" : "Sound off"}</span>
    </span>
  </span>;
}

interface Props {
  roster: RosterRow[];
  settings: Settings;
  rounds: number;
  /** Pool size per group under the chosen testament; null while the questions load. */
  sizes: Record<Group, number> | null;
  status: "loading" | "failed" | "ready";
  saving: boolean;
  resume: ResumeOffer | null;
  onRoster: (roster: RosterRow[]) => void;
  onSettings: (change: Partial<Settings>) => void;
  onRounds: (rounds: number) => void;
  onRetry: () => void;
  onCarryOn: () => void;
  onStartFresh: () => void;
  onStart: () => void;
  onHow: () => void;
}

export function Setup(props: Props) {
  const { roster, settings, rounds, sizes, status } = props;
  const tooFew = (g: Group) => sizes !== null && sizes[g] < MIN_POOL;
  const unavailable = GROUPS.filter((g) => tooFew(g.key));
  const change = (i: number, row: Partial<RosterRow>) => props.onRoster(roster.map((r, k) => (k === i ? { ...r, ...row } : r)));
  const move = (i: number, by: number) => {
    const next = [...roster];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    props.onRoster(next);
  };
  const blocked = roster.some((r) => tooFew(r.group));
  return <div className="hs-setup">
    {props.resume && <div className="hs-resume" role="region" aria-label="Saved game">
      <div>
        <strong>Tonight's game is saved</strong>
        <p className="hs-note">{`Round ${props.resume.round} of ${props.resume.rounds}`}</p>
        {props.resume.leaders.length > 0 && <p className="hs-note"><span className="hs-label">Leading</span> <span>{formatList(props.resume.leaders)}</span></p>}
      </div>
      <div className="hs-row">
        <button type="button" className="hs-primary" onClick={props.onCarryOn}>Carry on tonight's game</button>
        <button type="button" className="hs-secondary" onClick={props.onStartFresh}>Start fresh</button>
      </div>
    </div>}
    <div className="hs-hero">
      <div>
        <h1>Hot seat</h1>
        <p className="hs-lede">One player, sixty seconds, as many Bible questions as they can answer. Someone else reads from this phone.</p>
        <button type="button" className="hs-link" onClick={props.onHow}>How to play</button>
      </div>
      <GameArtImage art={GAME_ART.hotSeat} className="hs-hero-art" />
    </div>

    <section className="hs-players" aria-labelledby="hs-players-title">
      <h2 id="hs-players-title">Players</h2>
      <p className="hs-note">A name can be a team.</p>
      <ol className="hs-roster">{roster.map((row, i) => <li key={i} className={`hs-roster-row hs-player-card is-${row.group}`} style={{ "--hs-i": i } as CSSProperties}>
        <span className="hs-player-no" aria-hidden="true">{i + 1}</span>
        <input type="text" value={row.name} maxLength={NAME_MAX} placeholder={`Player ${i + 1}`} aria-label={`Name of player ${i + 1}`}
          onChange={(event) => change(i, { name: event.target.value })} />
        <select value={row.group} aria-label={`Age group of player ${i + 1}`} onChange={(event) => change(i, { group: event.target.value as Group })}>
          {GROUPS.map((g) => <option key={g.key} value={g.key} disabled={tooFew(g.key)}>{g.label}</option>)}
        </select>
        <span className="hs-row-tools">
          <button type="button" className="hs-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move player ${i + 1} up`}><ArrowUp size={16} aria-hidden="true" /></button>
          <button type="button" className="hs-icon" onClick={() => move(i, 1)} disabled={i === roster.length - 1} aria-label={`Move player ${i + 1} down`}><ArrowDown size={16} aria-hidden="true" /></button>
          <button type="button" className="hs-icon" onClick={() => props.onRoster(roster.filter((_, k) => k !== i))} disabled={roster.length === 1} aria-label={`Remove player ${i + 1}`}><Trash2 size={16} aria-hidden="true" /></button>
        </span>
      </li>)}</ol>
      <button type="button" className="hs-secondary" onClick={() => props.onRoster([...roster, { name: "", group: "adults" }])} disabled={roster.length >= MAX_PLAYERS}>
        <Plus size={16} aria-hidden="true" />Add player
      </button>
      {unavailable.length > 0 && <p className="hs-note"><span>Too few questions under this testament for:</span> <span>{formatList(unavailable.map((g) => g.label))}</span></p>}
      {roster.length === 1 && <p className="hs-note">One player can play, with someone else reading. Two or more is more fun.</p>}
    </section>

    {!props.saving && <p className="hs-note" role="status">This browser is not saving, so a reload will lose the scores.</p>}
    {status === "failed" ? <div className="hs-cant-load" role="alert">
      <p>The questions could not be loaded.</p>
      <button type="button" className="hs-secondary" onClick={props.onRetry}>Try again</button>
    </div> : <div className="hs-start">
      <button type="button" className="hs-primary hs-big" onClick={props.onStart} disabled={status !== "ready" || blocked}>
        <Play size={18} aria-hidden="true" />{status === "ready" ? "Start game" : "Loading questions…"}
      </button>
      <p className="hs-estimate">{plural(estimateMinutes(roster.length, rounds, settings.seconds), "About {n} minute", "About {n} minutes")}</p>
    </div>}

    <MoreOptions className="hs-settings" summary={<SettingsSummary settings={settings} rounds={rounds} />}>
      <section aria-label="Game settings">
        <GameSettings settings={settings} onSettings={props.onSettings} />
        <Chips label="Rounds" options={ROUND_COUNTS.map((n) => ({ key: n, label: String(n) }))} value={rounds} onPick={props.onRounds} />
        <dl className="hs-groups">{GROUPS.map((g) => <div key={g.key} className={`is-${g.key}`}><dt><span className="hs-pip" aria-hidden="true" />{g.label}</dt><dd>{g.note}</dd></div>)}</dl>
      </section>
    </MoreOptions>
  </div>;
}
