// The leader's first screen (design.md 5.1, 3.3): what the quiz covers, with the live count of matching questions, the
// room's settings, and Create room. The questions are drawn here, in the leader's browser, and sent with the create
// request; the room never sees the bank.
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { QuestionBank } from "@/lib/data";
import { COUNTS, DEFAULT_COUNT, DEFAULT_FILTERS, MIN_GAME, drawGame, type Level, type PickFilters } from "@/lib/live-quiz/pick";
import { DEFAULT_SETTINGS, TIMERS, type RoomSettings, type Timer } from "@/lib/live-quiz/protocol";
import { plural } from "@/lib/site-format";
import { MoreOptions } from "../kit";
import { Mark } from "./parts";
import { THEMES } from "@/pages/questions/test/themes";
import { createRoom, poolFor } from "./leader";
import type { SavedHost } from "./saved";

const KIND_CHOICES = [{ id: "trivia", label: "Bible quiz" }, { id: "lesson", label: "Sunday school" }, { id: "catechism", label: "Catechism" }];
const LEVEL_CHOICES: { id: Level; label: string }[] = [{ id: "easy", label: "Easy" }, { id: "medium", label: "Medium" }, { id: "hard", label: "Hard" }, { id: "mixed", label: "Mixed" }];

export function Choices<T extends string | number | boolean>({ name, value, options, onChange }: { name: string; value: T; options: { id: T; label: string }[]; onChange: (value: T) => void }) {
  return <div className="lq-choices">
    {options.map((option) => <label key={String(option.id)} className="lq-choice">
      <input type="radio" name={name} checked={value === option.id} onChange={() => onChange(option.id)} /><span>{option.label}</span>
    </label>)}
  </div>;
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => <fieldset className="lq-field"><legend>{label}</legend>{children}</fieldset>;

/** The room's own settings: everything but the questions, so they can change in the lobby too. */
export function SettingsFields({ settings, onChange }: { settings: RoomSettings; onChange: (settings: RoomSettings) => void }) {
  const set = <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) => onChange({ ...settings, [key]: value });
  return <>
    <Field label="Time per question">
      <Choices name="timer" value={settings.timer} options={TIMERS.map((t) => ({ id: t, label: `${t} seconds` }))} onChange={(t: Timer) => set("timer", t)} />
    </Field>
    <Field label="Scoring">
      <Choices name="scoring" value={settings.scoring} options={[{ id: "speed", label: "Speed counts (500–1000)" }, { id: "accuracy", label: "Accuracy only (1000 a right answer)" }]} onChange={(v) => set("scoring", v)} />
    </Field>
    <Field label="Names">
      <Choices name="names" value={settings.names} options={[{ id: "typed", label: "Players type a name" }, { id: "picker", label: "Name picker only" }]} onChange={(v) => set("names", v)} />
    </Field>
    <Field label="Question text on phones">
      <Choices name="phone-text" value={settings.phoneText} options={[{ id: true, label: "Show it" }, { id: false, label: "Only on the big screen" }]} onChange={(v) => set("phoneText", v)} />
    </Field>
    <Field label="Auto-advance">
      <Choices name="auto" value={settings.autoAdvance} options={[{ id: false, label: "Off: I press Next" }, { id: true, label: "On: move on by itself" }]} onChange={(v) => set("autoAdvance", v)} />
    </Field>
  </>;
}

export function Setup({ bank, onCreated }: { bank: QuestionBank; onCreated: (host: SavedHost) => void }) {
  const [filters, setFilters] = useState<PickFilters>(DEFAULT_FILTERS);
  const [themeId, setThemeId] = useState("");
  const [count, setCount] = useState<number>(DEFAULT_COUNT);
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pool = useMemo(() => poolFor(bank, filters, themeId), [bank, filters, themeId]);
  const playable = Math.min(count, pool.length);
  const books = bank.books.filter((b) => !filters.testament || b.testament === filters.testament);

  const update = (patch: Partial<PickFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const setChildren = (children: boolean) => {
    update({ children });
    // For children, more time and no typed names are suggested; the leader can still change both.
    if (children) setSettings((s) => ({ ...s, timer: 30, names: "picker" }));
  };
  const toggleKind = (id: string) => update({ kinds: filters.kinds.includes(id) ? filters.kinds.filter((k) => k !== id) : [...filters.kinds, id] });

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const room = await createRoom({ questions: drawGame(pool, playable, filters), settings });
      onCreated({ ...room, savedAt: Date.now(), filters, count, theme: themeId });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setBusy(false);
    }
  };

  return <div className="lq-setup">
    <div className="lq-fields">
      <Field label="Questions">
        <Choices name="count" value={count} options={COUNTS.map((n) => ({ id: n, label: String(n) }))} onChange={setCount} />
      </Field>
      <Field label="Kinds">
        <div className="lq-choices">
          {KIND_CHOICES.map((kind) => <label key={kind.id} className="lq-choice">
            <input type="checkbox" checked={filters.kinds.includes(kind.id)} onChange={() => toggleKind(kind.id)} /><span>{kind.label}</span>
          </label>)}
        </div>
      </Field>
      <Field label="Level"><Choices name="level" value={filters.level} options={LEVEL_CHOICES} onChange={(level) => update({ level })} /></Field>
      <Field label="For children (6–11)">
        <Choices name="children" value={filters.children} options={[{ id: false, label: "Off" }, { id: true, label: "On: children's questions and wording" }]} onChange={setChildren} />
      </Field>
      <MoreOptions className="lq-more">
        <div className="lq-fields">
          <Field label="Theme, testament or book">
            <div className="lq-choices">
              <select className="lq-select" aria-label="Theme" value={themeId} onChange={(e) => setThemeId(e.target.value)}>
                <option value="">Any theme</option>
                {THEMES.map((theme) => <option key={theme.id} value={theme.id}>{theme.title}</option>)}
              </select>
              <select className="lq-select" aria-label="Testament" value={filters.testament} onChange={(e) => update({ testament: e.target.value as PickFilters["testament"], book: "" })}>
                <option value="">Both testaments</option><option value="OT">Old Testament</option><option value="NT">New Testament</option>
              </select>
              <select className="lq-select" aria-label="Book" value={filters.book} onChange={(e) => update({ book: e.target.value })}>
                <option value="">Any book</option>
                {books.map((book) => <option key={book.code} value={book.code}>{book.name}</option>)}
              </select>
            </div>
          </Field>
          <SettingsFields settings={settings} onChange={setSettings} />
        </div>
      </MoreOptions>
    </div>
    <aside className="lq-summary" aria-live="polite">
      <Sample />
      <strong>{plural(pool.length, "{n} question", "{n} questions")}</strong>
      <span className="lq-note">match these choices.</span>
      {pool.length < count && pool.length >= MIN_GAME && <p className="lq-warn">{`Only ${pool.length} questions match: play ${pool.length}, or widen the choices.`}</p>}
      {pool.length < MIN_GAME && <p className="lq-warn">A game needs at least three questions. Widen the choices.</p>}
      <button type="button" className="lq-button" disabled={busy || pool.length < MIN_GAME} onClick={() => void create()}>
        {busy ? "Creating…" : "Create room"}
      </button>
      {error && <p className="lq-error" role="alert">{error}</p>}
    </aside>
  </div>;
}

/** A small picture of the game itself above Create room: a screen with four answer tiles and phones held up to vote,
 * the tiles breathing in turn so the page has one living detail. */
function Sample() {
  return <div className="lq-sample" aria-hidden="true">
    <div className="lq-sample-screen">
      <span className="lq-sample-q" />
      <div className="lq-sample-grid">{[0, 1, 2, 3].map((i) => <span key={i} className="lq-option lq-sample-tile" data-i={i} style={{ "--lq-i": i } as CSSProperties}><Mark index={i} /></span>)}</div>
    </div>
    <div className="lq-sample-phones">{[0, 1, 2].map((i) => <span key={i} className="lq-sample-phone" data-i={i} style={{ "--lq-i": i } as CSSProperties} />)}</div>
  </div>;
}
