// Versions of the questions page's "Ready to test yourself?" banner for the mock page (TestBannerMockupPage.tsx),
// owner 2026-10-23: "the options should be in where the take the test should be… unclicked at the beginning… when
// they're all clicked, then take a test comes out." The words on the left are the banner's own, with the row of dots
// now under them; on the right the three settings start unchosen, and the button comes out once all three are chosen.
// Of the first four, the owner kept the sentence and asked for the other three condensed into one, laid out like the
// icon tiles, "the same length as it is normally… keep the icons and all of them in one go"; then "the same box design
// as the questions themes… take the test is in the middle", so the tiles became the theme shelves' hairline grid, tried
// with the button under it and in the banner's middle; then "having it pop under ready to test yourself", so the button
// comes out under the words, and no lines under the settings' names. Styles: test-banner-mockup.css.
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_LENGTH, LENGTHS } from "./test/engine";
import { AGES, LEVELS, ageOf, levelOf, minutesFor, writeSettings } from "./test/settings";
import { Pips } from "./test/SetupBars";

// The mock shows the banner as it reads with David chosen on the page.
const SUBJECT = { id: "david", title: "David" };
const MARKS = ["right", "right", "wrong", "right", "now", "", "", "", "", ""];

type Picks = Record<Key, number | string | null>;

function usePicks() {
  const [picks, setPicks] = useState<Picks>({ length: null, level: null, age: null });
  const pick = (key: Key, id: number | string) => setPicks((now) => ({ ...now, [key]: id }));
  return { picks, pick, done: picks.length !== null && picks.level !== null && picks.age !== null };
}

function testHref({ length, level, age }: Picks) {
  const out = new URLSearchParams({ theme: SUBJECT.id });
  if (length !== null && Number(length) !== DEFAULT_LENGTH) out.set("n", String(length));
  if (level !== null && age !== null) writeSettings(out, Number(level), String(age));
  return `/study/questions/test?${out}`;
}

/** The banner with its own words and the dots on the left and the version's settings on the right. The button opens
 * once all three are chosen; until then the same pill stands greyed, asking for the options (owner, 2026-10-23): under
 * the settings, or with `left`
 * under the words and the dots (on a phone, where the words sit above the settings, still under the settings). */
function Shell({ picks, done, left, children }: { picks: Picks; done: boolean; left?: boolean; children: ReactNode }) {
  const go = (place?: string) => <div className="tb-go" data-place={place}>
    {done ? <Link className="qp-test-go" to={testHref(picks)}>Take a test on {SUBJECT.title}<ArrowRight size={17} strokeWidth={1.6} aria-hidden /></Link>
      : <span className="qp-test-go tb-go-wait" aria-disabled="true">Choose your options to take the test</span>}
  </div>;
  return <section className="qp-test-banner tb-banner" data-left={left || undefined}>
    <div className="qp-test-copy">
      <p className="qp-eyebrow"><span></span>A test of your own</p>
      <h2>Ready to <em>test yourself?</em></h2>
      <p>Choose what to be tested on and answer one question at a time. The answers stay hidden until you give yours.</p>
      <ol className="qp-test-marks" aria-hidden>{MARKS.map((mark, i) => <li key={i} className={mark && `is-${mark}`} />)}</ol>
      {left && go("left")}
    </div>
    <div className="tb-action">{children}{go(left ? "phone" : undefined)}</div>
  </section>;
}

/** The three settings as plain lists, in the order they are asked. */
const SETTINGS = [
  { key: "length", label: "Questions", ask: "How many questions?", items: LENGTHS.map((n) => ({ id: n as number | string, label: String(n), note: minutesFor(n) })) },
  { key: "level", label: "How hard", ask: "How hard?", items: LEVELS.map((l) => ({ id: l.id as number | string, label: l.label, note: l.line })) },
  { key: "age", label: "For", ask: "Who is it for?", items: AGES.map((a) => ({ id: a.id as number | string, label: a.label, note: a.line })) },
] as const;
type Key = (typeof SETTINGS)[number]["key"];

/** The mark beside a choice: the number, the rising bars, or the age group's icon. */
function Mark({ setting, id, size }: { setting: Key; id: number | string; size: number }) {
  if (setting === "level") return <Pips level={Number(id)} />;
  if (setting === "age") { const { Icon } = ageOf(String(id)); return <Icon size={size} strokeWidth={1.6} aria-hidden />; }
  if (setting === "length") return <b>{id}</b>;
  return null;
}

/** The three settings in the theme shelves' hairline grid: the setting's name in the first column, then its three
 * boxes, each with its mark in a soft round tint, its name and a line, glowing faintly when pointed at or chosen. The
 * lines run under the boxes only, not under the names. */
function SettingsGrid({ picks, pick }: { picks: Picks; pick: (key: Key, id: number | string) => void }) {
  return <div className="tb-grid">{SETTINGS.map(({ key, label, items }) =>
    <div key={key} className="tb-grid-row" role="group" aria-label={label}>
      <span className="tb-grid-name">{label}{picks[key] !== null && <Check size={12} strokeWidth={2.2} aria-hidden />}</span>
      {items.map((item) => <button key={item.id} type="button" className="tb-cell" aria-pressed={picks[key] === item.id} onClick={() => pick(key, item.id)}>
        <i className="tb-cell-icon"><Mark setting={key} id={item.id} size={18} /></i>
        <span><strong>{key === "length" ? "questions" : item.label}</strong><small>{item.note}</small></span>
      </button>)}
    </div>)}</div>;
}

/** 1 · The theme boxes, the button coming out under the banner's words. */
export function GridBanner() {
  const { picks, pick, done } = usePicks();
  return <Shell picks={picks} done={done} left><SettingsGrid picks={picks} pick={pick} /></Shell>;
}

/** One blank in the sentence: empty and dashed until chosen, opening a short list of the choices. */
function Blank({ setting, placeholder, value, onChoose }: { setting: (typeof SETTINGS)[number]; placeholder: string; value: number | string | null; onChoose: (id: number | string) => void }) {
  const [open, setOpen] = useState(false);
  const current = setting.items.find((i) => i.id === value);
  return <span className="tb-blank" data-empty={current ? undefined : ""}>
    <button type="button" aria-label={setting.ask} aria-expanded={open} onClick={() => setOpen(!open)}>
      {current ? (setting.key === "length" ? current.label : current.label.toLowerCase()) : placeholder}<ChevronDown size={16} strokeWidth={1.6} aria-hidden /></button>
    {open && <span className="tb-blank-menu" role="menu">{setting.items.map((item) =>
      <button key={item.id} type="button" role="menuitemradio" aria-checked={item.id === value} onClick={() => { onChoose(item.id); setOpen(false); }}>
        <Mark setting={setting.key} id={item.id} size={15} />{item.label}<small>{item.note}</small></button>)}</span>}
  </span>;
}

/** 2 · The test said as one sentence with three blanks to fill. */
export function SentenceBanner() {
  const { picks, pick, done } = usePicks();
  const [length, level, age] = SETTINGS;
  return <Shell picks={picks} done={done}>
    <p className="tb-sentence">Ask me <Blank setting={length} placeholder="how many" value={picks.length} onChoose={(id) => pick("length", id)} />{" "}
      <Blank setting={level} placeholder="how hard" value={picks.level} onChoose={(id) => pick("level", id)} /> questions on <em>{SUBJECT.title}</em>,
      written for <Blank setting={age} placeholder="whom" value={picks.age} onChoose={(id) => pick("age", id)} />.</p>
    <small className="tb-sentence-note">{picks.level !== null ? levelOf(Number(picks.level)).line : " "}</small>
  </Shell>;
}
