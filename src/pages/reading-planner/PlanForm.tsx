// The planner's three questions (design 1): what to read, how to plan it (by a finish date or at a pace), and which days
// and how fast. Every change goes straight back to the page, which rebuilds the plan as the visitor goes.
import { useMemo, useState } from "react";
import { dateFormat, plural } from "@/lib/site-format";
import { MAX_PACE, SPEEDS, WORDS_PER_PAGE, type PaceUnit, type PlanSettings, type Speed } from "./planner";

export interface PlannerBook { code: string; num: number; name: string }

type Scope = "bible" | "old" | "new" | "choose";

/** Each speed's name, under `label` so the translation collector reads one-word names too. */
const SPEED_TEXT: Record<Speed, { label: string }> = { 150: { label: "Slow and careful" }, 200: { label: "Unhurried" }, 250: { label: "Steady" }, 300: { label: "Quick" } };
const UNIT_TEXT: Record<PaceUnit, string> = { chapters: "Chapters a day", minutes: "Minutes a day", pages: "Pages a day" };
/** Day number 3 (4 January 1970) was a Sunday: the week from it names the weekdays in the site's language. */
const SUNDAY = 3;
const DAY_MS = 86_400_000;

const sameBooks = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((code) => b.includes(code));

interface PlanFormProps {
  settings: PlanSettings;
  books: readonly PlannerBook[];
  /** The pace box as typed, so a half-typed number is not overwritten. */
  paceText: string;
  onPaceText: (text: string) => void;
  onChange: (settings: PlanSettings) => void;
}

export function PlanForm({ settings, books, paceText, onPaceText, onChange }: PlanFormProps) {
  const groups = useMemo(() => ({
    old: books.filter((book) => book.num <= 39).map((book) => book.code),
    new: books.filter((book) => book.num >= 40).map((book) => book.code),
    bible: books.map((book) => book.code),
  }), [books]);
  const matching: Scope = sameBooks(settings.books, groups.bible) ? "bible" : sameBooks(settings.books, groups.old) ? "old"
    : sameBooks(settings.books, groups.new) ? "new" : "choose";
  const [choosing, setChoosing] = useState(matching === "choose");
  const scope: Scope = choosing ? "choose" : matching;
  const weekdayNames = useMemo(() => {
    const format = dateFormat({ weekday: "short", timeZone: "UTC" });
    return Array.from({ length: 7 }, (_, day) => format.format(new Date((SUNDAY + day) * DAY_MS)));
  }, []);
  const set = (change: Partial<PlanSettings>) => onChange({ ...settings, ...change });
  const chooseScope = (next: Scope) => {
    setChoosing(next === "choose");
    if (next !== "choose") set({ books: groups[next] });
  };
  const toggleBook = (code: string) => set({ books: settings.books.includes(code) ? settings.books.filter((c) => c !== code) : [...settings.books, code] });
  const toggleWeekday = (day: number) =>
    set({ weekdays: settings.weekdays.includes(day) ? settings.weekdays.filter((d) => d !== day) : [...settings.weekdays, day].sort((a, b) => a - b) });

  return (
    <form className="rp-form" onSubmit={(event) => event.preventDefault()}>
      <fieldset className="rp-step">
        <legend>What to read</legend>
        <div className="rp-choices" role="radiogroup" aria-label="What to read">
          {([["bible", "The whole Bible"], ["old", "Old Testament"], ["new", "New Testament"], ["choose", "Choose books"]] as const).map(([key, text]) => (
            <label key={key} className={`rp-choice${scope === key ? " is-on" : ""}`}>
              <input type="radio" name="rp-scope" checked={scope === key} onChange={() => chooseScope(key)} />{text}
            </label>
          ))}
        </div>
        {scope === "choose" && (["old", "new"] as const).map((testament) => (
          <div key={testament} className="rp-books">
            <div className="rp-books-head">
              <h3>{testament === "old" ? "Old Testament" : "New Testament"}</h3>
              <button type="button" className="rp-link" onClick={() => set({ books: [...new Set([...settings.books, ...groups[testament]])] })}>Select all</button>
              <button type="button" className="rp-link" onClick={() => set({ books: settings.books.filter((code) => !groups[testament].includes(code)) })}>Clear</button>
            </div>
            <ul className="rp-book-grid">
              {books.filter((book) => groups[testament].includes(book.code)).map((book) => (
                <li key={book.code}>
                  <label className="rp-book"><input type="checkbox" checked={settings.books.includes(book.code)} onChange={() => toggleBook(book.code)} />{book.name}</label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </fieldset>

      <fieldset className="rp-step">
        <legend>How to plan it</legend>
        <div className="rp-choices" role="radiogroup" aria-label="How to plan it">
          <label className={`rp-choice${settings.mode === "finish" ? " is-on" : ""}`}>
            <input type="radio" name="rp-mode" checked={settings.mode === "finish"} onChange={() => set({ mode: "finish" })} />Finish by a date
          </label>
          <label className={`rp-choice${settings.mode === "pace" ? " is-on" : ""}`}>
            <input type="radio" name="rp-mode" checked={settings.mode === "pace"} onChange={() => set({ mode: "pace" })} />Read at my own pace
          </label>
        </div>
        <div className="rp-fields">
          <label className="rp-field"><span>Start</span>
            <input type="date" value={settings.start} min="1900-01-01" max="2200-12-31" onChange={(event) => set({ start: event.target.value })} />
          </label>
          {settings.mode === "finish" ? (
            <label className="rp-field"><span>Finish</span>
              <input type="date" value={settings.finish} min={settings.start} max="2200-12-31" onChange={(event) => set({ finish: event.target.value })} />
            </label>
          ) : <>
            <label className="rp-field"><span>Pace</span>
              <input type="number" inputMode="numeric" min={1} max={MAX_PACE} step={1} value={paceText} onChange={(event) => onPaceText(event.target.value)} />
            </label>
            <label className="rp-field"><span>Measured in</span>
              <select value={settings.unit} onChange={(event) => set({ unit: event.target.value as PaceUnit })}>
                {(Object.keys(UNIT_TEXT) as PaceUnit[]).map((unit) => <option key={unit} value={unit}>{UNIT_TEXT[unit]}</option>)}
              </select>
            </label>
          </>}
        </div>
        {settings.mode === "pace" && settings.unit === "pages" && (
          <p className="rp-note">{plural(WORDS_PER_PAGE, "A page here is about {n} word, an estimate of one page of a printed Bible.", "A page here is about {n} words, an estimate of one page of a printed Bible.")}</p>
        )}
      </fieldset>

      <fieldset className="rp-step rp-step-quiet">
        <legend>Reading days and speed</legend>
        <div className="rp-weekdays" role="group" aria-label="Days of the week you read">
          {weekdayNames.map((name, day) => (
            <label key={day} className={`rp-weekday${settings.weekdays.includes(day) ? " is-on" : ""}`}>
              <input type="checkbox" checked={settings.weekdays.includes(day)} onChange={() => toggleWeekday(day)} />{name}
            </label>
          ))}
        </div>
        <label className="rp-field rp-speed"><span>Reading speed</span>
          <select value={settings.speed} onChange={(event) => set({ speed: Number(event.target.value) as Speed })}>
            {SPEEDS.map((speed) => <option key={speed} value={speed}>{SPEED_TEXT[speed].label}</option>)}
          </select>
        </label>
        <p className="rp-note">{plural(settings.speed, "About {n} word a minute.", "About {n} words a minute.")} {settings.mode === "pace" && settings.unit === "minutes"
          ? "Your speed changes how many days the plan takes." : "Your speed changes only the times shown."}</p>
      </fieldset>
    </form>
  );
}
