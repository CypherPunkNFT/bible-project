// Four versions of the questions page's "Ready to test yourself?" banner for the mock page (TestBannerMockupPage.tsx),
// owner 2026-10-23: "the options should be in where the take the test should be… unclicked at the beginning… when
// they're all clicked, then take a test comes out." The words on the left are the banner's own; on the right the three
// settings start unchosen, and the button slides out once all three are chosen. Styles: test-banner-mockup.css.
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_LENGTH, LENGTHS } from "./test/engine";
import { AGES, LEVELS, ageOf, levelOf, minutesFor, writeSettings } from "./test/settings";
import { Pips } from "./test/SetupBars";

// The mock shows the banner as it reads with David chosen on the page.
const SUBJECT = { id: "david", title: "David", available: 162 };
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

/** The banner with its own words on the left; the version's settings, then the button once all are chosen, on the right. */
function Shell({ picks, done, children }: { picks: Picks; done: boolean; children: ReactNode }) {
  return <section className="qp-test-banner tb-banner">
    <div className="qp-test-copy">
      <p className="qp-eyebrow"><span></span>A test of your own</p>
      <h2>Ready to <em>test yourself?</em></h2>
      <p>Choose what to be tested on and answer one question at a time. The answers stay hidden until you give yours.</p>
    </div>
    <div className="tb-action">
      <ol className="qp-test-marks" aria-hidden>{MARKS.map((mark, i) => <li key={i} className={mark && `is-${mark}`} />)}</ol>
      {children}
      <div className="tb-go" data-open={done || undefined}><div>
        <Link className="qp-test-go" to={testHref(picks)} tabIndex={done ? 0 : -1} aria-hidden={!done}>
          Take a test on {SUBJECT.title}<ArrowRight size={17} strokeWidth={1.6} aria-hidden /></Link>
        <small>{SUBJECT.available} questions to draw from</small>
      </div></div>
    </div>
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
  return null;
}

/** 1 · Three rows of buttons under their names, stacked where the button was. */
export function RowsBanner() {
  const { picks, pick, done } = usePicks();
  return <Shell picks={picks} done={done}>
    <div className="tb-rows">{SETTINGS.map(({ key, label, items }) => {
      const value = picks[key];
      const note = items.find((i) => i.id === value)?.note;
      return <div key={key} className="qp-test-setting">
        <span>{label}{value !== null && <Check size={12} strokeWidth={2.2} aria-hidden />}</span>
        <div className="qp-test-choices" role="group" aria-label={label}>{items.map((item) =>
          <button key={item.id} type="button" aria-pressed={value === item.id} onClick={() => pick(key, item.id)}>
            <Mark setting={key} id={item.id} size={15} />{item.label}</button>)}</div>
        <small>{note ?? " "}</small>
      </div>;
    })}</div>
  </Shell>;
}

/** 2 · One question at a time; each answer folds into a small chip, which opens it again. */
export function StepsBanner() {
  const { picks, pick, done } = usePicks();
  const [reopened, setReopened] = useState<Key | null>(null);
  const current = reopened ?? SETTINGS.find(({ key }) => picks[key] === null)?.key ?? null;
  const step = SETTINGS.findIndex(({ key }) => key === current);
  const chosen = SETTINGS.filter(({ key }) => picks[key] !== null && key !== current);
  return <Shell picks={picks} done={done}>
    {chosen.length > 0 && <div className="tb-chips">{chosen.map(({ key, items }) => {
      const item = items.find((i) => i.id === picks[key])!;
      return <button key={key} type="button" onClick={() => setReopened(key)}><Mark setting={key} id={item.id} size={14} />
        {key === "length" ? `${item.label} questions` : item.label}<Check size={13} strokeWidth={2.2} aria-hidden /></button>;
    })}</div>}
    {current && <div className="tb-step" key={current}>
      <span className="tb-step-n">{step + 1} of 3</span>
      <p className="tb-step-ask">{SETTINGS[step].ask}</p>
      <div className="tb-step-choices">{SETTINGS[step].items.map((item) =>
        <button key={item.id} type="button" aria-pressed={picks[current] === item.id} onClick={() => { pick(current, item.id); setReopened(null); }}>
          <Mark setting={current} id={item.id} size={16} /><strong>{item.label}</strong><small>{item.note}</small></button>)}</div>
    </div>}
  </Shell>;
}

/** 3 · Square tiles, each with its number, its bars or its age group's icon drawn large. */
export function TilesBanner() {
  const { picks, pick, done } = usePicks();
  return <Shell picks={picks} done={done}>
    <div className="tb-tiles">{SETTINGS.map(({ key, label, items }) =>
      <div key={key} className="tb-tile-row">
        <span>{label}{picks[key] !== null && <Check size={12} strokeWidth={2.2} aria-hidden />}</span>
        <div role="group" aria-label={label}>{items.map((item) =>
          <button key={item.id} type="button" className="tb-tile" data-setting={key} aria-pressed={picks[key] === item.id} onClick={() => pick(key, item.id)}>
            {key === "length" ? <b>{item.label}</b> : <i><Mark setting={key} id={item.id} size={26} /></i>}
            <strong>{key === "length" ? "questions" : item.label}</strong></button>)}</div>
      </div>)}</div>
  </Shell>;
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

/** 4 · The test said as one sentence with three blanks to fill. */
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
