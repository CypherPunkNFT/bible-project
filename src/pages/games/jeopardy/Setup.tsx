// Bible Jeopardy's setup (design 9.1): teams, board and rules on one page, then Build board. A board link replaces the
// Board section with one line (7.2). Settings are remembered for next time by the page (storage.ts).
import { Dices } from "lucide-react";
import type { ReactNode } from "react";
import { friendlyName } from "@/lib/live-quiz/names";
import { formatNumber, plural } from "@/lib/site-format";
import { CategoryPicker } from "./CategoryPicker";
import type { Category } from "./categories";
import { teamNameProblem } from "./display";
import { COLUMN_COUNTS, MAX_TEAMS, MIN_TEAMS, TIMERS, type Settings } from "./model";

export interface SetupProps {
  settings: Settings;
  onSettings: (settings: Settings) => void;
  categories: Category[];
  /** Each category's question count with these settings; null while the bank loads. */
  counts: Map<string, number> | null;
  chosen: string[] | null;
  onChosen: (chosen: string[] | null) => void;
  fromLink: string | null;
  onDiscardLink: () => void;
  saving: boolean;
  seenCount: number;
  onForgetSeen: () => void;
  blocked: string | null;
  onBuild: () => void;
  onHelp: () => void;
}


function Choice<T extends string | number>({ label, value, options, onChange, disabled }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void; disabled?: boolean }) {
  return <fieldset className="jp-choice" disabled={disabled}>
    <legend>{label}</legend>
    <div>{options.map((option) => <label key={String(option.value)} className={option.value === value ? "is-on" : ""}>
      <input type="radio" name={label} checked={option.value === value} onChange={() => onChange(option.value)} />{option.label}
    </label>)}</div>
  </fieldset>;
}

function Toggle({ checked, onChange, children, note }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; note?: ReactNode }) {
  return <label className="jp-toggle">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span><strong>{children}</strong>{note && <small>{note}</small>}</span>
  </label>;
}

function minutes(columns: number) {
  const length = { 3: 20, 4: 25, 5: 35, 6: 40 }[columns] ?? 35;
  return `About ${formatNumber(length)} minutes, plus about 5 for the Final.`;
}

function Teams({ settings, set }: { settings: Settings; set: (over: Partial<Settings>) => void }) {
  const names = settings.teamNames;
  const resize = (count: number) => set({ teamNames: Array.from({ length: count }, (_, i) => names[i] ?? `Team ${i + 1}`) });
  const rename = (index: number, name: string) => set({ teamNames: names.map((old, i) => (i === index ? name : old)) });
  return <section className="jp-section" aria-labelledby="jp-teams">
    <h2 id="jp-teams">Teams</h2>
    <div className="jp-stepper" role="group" aria-label="How many teams">
      <button type="button" disabled={names.length <= MIN_TEAMS} onClick={() => resize(names.length - 1)} aria-label="One team fewer">−</button>
      <output aria-live="polite">{plural(names.length, "{n} team", "{n} teams")}</output>
      <button type="button" disabled={names.length >= MAX_TEAMS} onClick={() => resize(names.length + 1)} aria-label="One more team">+</button>
    </div>
    <ol className="jp-team-names">{names.map((name, index) => {
      const problem = teamNameProblem(names, index);
      return <li key={index} className={`jp-tone-${index}`}>
        <span className="jp-team-number" aria-hidden>{formatNumber(index + 1)}</span>
        <input type="text" value={name} maxLength={24} aria-label={`Name of team ${index + 1}`} aria-invalid={problem !== null} onChange={(event) => rename(index, event.target.value)} />
        <button type="button" className="jp-icon" onClick={() => rename(index, friendlyName())} aria-label={`A friendly name for team ${index + 1}`} title="A friendly name"><Dices size={18} aria-hidden /></button>
        {problem && <p className="jp-error">{problem}</p>}
      </li>;
    })}</ol>
    <Choice label="Who starts" value={settings.randomStart ? "random" : "first"} onChange={(value) => set({ randomStart: value === "random" })}
      options={[{ value: "first", label: "Team 1" }, { value: "random", label: "Random" }]} />
  </section>;
}

function BoardSection(props: SetupProps & { set: (over: Partial<Settings>) => void }) {
  const { settings, set, chosen, onChosen, categories, counts } = props;
  if (props.fromLink) {
    return <section className="jp-section" aria-labelledby="jp-board">
      <h2 id="jp-board">Board</h2>
      <p className="jp-link-line">{props.fromLink}</p>
      <button type="button" className="jp-quiet" onClick={props.onDiscardLink}>Discard</button>
    </section>;
  }
  return <section className="jp-section" aria-labelledby="jp-board">
    <h2 id="jp-board">Board</h2>
    <Choice label="Categories" value={chosen ? "choose" : "surprise"} onChange={(value) => onChosen(value === "choose" ? [] : null)}
      options={[{ value: "surprise", label: "Surprise me" }, { value: "choose", label: "Choose categories" }]} />
    {chosen && <CategoryPicker categories={categories} counts={counts} chosen={chosen} limit={settings.columns} onChange={onChosen} />}
    <Choice label="Columns" value={settings.columns} onChange={(columns) => set({ columns })} options={COLUMN_COUNTS.map((value) => ({ value, label: formatNumber(value) }))} />
    <p className="jp-hint">{minutes(settings.columns)}</p>
    <Choice label="Difficulty" value={settings.children ? "gentle" : settings.difficulty} disabled={settings.children} onChange={(difficulty) => set({ difficulty })}
      options={[{ value: "gentle", label: "Gentle" }, { value: "standard", label: "Standard" }, { value: "challenging", label: "Challenging" }]} />
    <Toggle checked={settings.children} onChange={(children) => set({ children, choices: children ? true : settings.choices })}
      note="Children's questions in their own wording, Gentle difficulty, with the four choices.">For children</Toggle>
    <Toggle checked={settings.choices} onChange={(choices) => set({ choices })} note="Off: the clue alone, and the host judges the spoken answer.">Show the four choices</Toggle>
    <Choice label="Testament" value={settings.testament} onChange={(testament) => set({ testament })}
      options={[{ value: "", label: "Both" }, { value: "OT", label: "Old" }, { value: "NT", label: "New" }]} />
    <Toggle checked={settings.catechism} onChange={(catechism) => set({ catechism })} note="Catechism answers follow one church tradition.">Include catechism questions</Toggle>
  </section>;
}

function Rules({ settings, set }: { settings: Settings; set: (over: Partial<Settings>) => void }) {
  return <section className="jp-section" aria-labelledby="jp-rules">
    <h2 id="jp-rules">Rules</h2>
    <Choice label="Who answers" value={settings.answering} onChange={(answering) => set({ answering })}
      options={[{ value: "turns", label: "Take turns" }, { value: "buzz", label: "Buzz in" }]} />
    <p className="jp-hint">{settings.answering === "turns"
      ? "Each team chooses in turn and answers first; if it is wrong, another team may steal."
      : "Any team may answer; the host picks whoever was first. A right answer chooses the next tile."}</p>
    <Toggle checked={settings.penalty} onChange={(penalty) => set({ penalty })} note="On, like the TV show. Off is kinder for children.">Wrong answers lose points</Toggle>
    <Toggle checked={settings.dailyDouble} onChange={(dailyDouble) => set({ dailyDouble })} note="One hidden tile where the team bets its points. A wrong answer loses the bet, even with the setting above off.">Daily Double</Toggle>
    <Toggle checked={settings.final} onChange={(final) => set({ final })} note="Every team bets on one last question.">Final question</Toggle>
    <Choice label="Timer" value={settings.timer} onChange={(timer) => set({ timer })}
      options={TIMERS.map((value) => ({ value, label: value === 0 ? "Off" : `${formatNumber(value)} s` }))} />
  </section>;
}

export function Setup(props: SetupProps) {
  const { settings, onSettings } = props;
  const set = (over: Partial<Settings>) => onSettings({ ...settings, ...over });
  return <div className="jp-setup">
    <header className="jp-setup-head">
      <h1>Bible Jeopardy</h1>
      <p>Category boards from the question bank, for a projector or TV. Name the teams, deal a board, and play.</p>
      <button type="button" className="jp-quiet" onClick={props.onHelp}>How to play</button>
    </header>
    {!props.saving && <p className="jp-note">This browser will not keep the game, so it will not survive a reload.</p>}
    <Teams settings={settings} set={set} />
    <BoardSection {...props} set={set} />
    <Rules settings={settings} set={set} />
    <div className="jp-actions">
      <button type="button" className="jp-primary" disabled={props.blocked !== null} onClick={props.onBuild}>Build board</button>
      {props.blocked && <p className="jp-hint" role="status">{props.blocked}</p>}
      {props.seenCount > 0 && <button type="button" className="jp-quiet" onClick={props.onForgetSeen}>Forget played questions</button>}
    </div>
  </div>;
}
