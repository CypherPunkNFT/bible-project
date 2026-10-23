// The banner between 02 and 03 that leads to the test page. It carries whatever is chosen on this page (a book from
// 01, a theme from 02, a topic or Testament from 03), so "Take a test on David" opens a test already set to David, and
// the three settings chosen in it: how many questions, how hard and who for (owner, 2026-10-23: "icons for age… the
// questions, the how hard, the age group"). Styles: test-banner.css.
import { ArrowRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { QuestionBank } from "@/lib/data";
import { writeFilters, type Filters } from "./model";
import { DEFAULT_LENGTH, LENGTHS } from "./test/engine";
import { AGES, DEFAULT_AGE, DEFAULT_LEVEL, LEVELS, ageOf, levelOf, minutesFor, writeSettings } from "./test/settings";
import { Pips } from "./test/SetupBars";
import type { Theme } from "./test/themes";
import "../test-setup.css";
import "./test-banner.css";

// The row of marks drawn beside the words: a test part-way through, right, wrong and still to come.
const MARKS = ["right", "right", "wrong", "right", "now", "", "", "", "", ""];

interface Props { bank: QuestionBank; filters: Filters; theme: Theme | null; available: number; bookNames: Record<string, string> }

export function TestBanner({ bank, filters, theme, available, bookNames }: Props) {
  const topic = bank.topics.find((t) => t.id === filters.topic)?.title;
  const subject = theme?.title ?? (filters.book ? bookNames[filters.book] : topic ?? (filters.kind ? bank.kinds[filters.kind] : null));
  const [length, setLength] = useState<number>(DEFAULT_LENGTH);
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [age, setAge] = useState(DEFAULT_AGE);
  const params = writeFilters(filters);
  if (theme) params.set("theme", theme.id);
  if (length !== DEFAULT_LENGTH) params.set("n", String(length));
  writeSettings(params, level, age);
  const query = params.toString();
  return <section className="qp-test-banner" id="qp-test" aria-labelledby="qp-test-title">
    <div className="qp-test-copy">
      <p className="qp-eyebrow"><span></span>A test of your own</p>
      <h2 id="qp-test-title">Ready to <em>test yourself?</em></h2>
      <p>Choose what to be tested on and answer one question at a time. The answers stay hidden until you give yours.</p>
    </div>
    <div className="qp-test-action">
      <ol className="qp-test-marks" aria-hidden>{MARKS.map((mark, i) => <li key={i} className={mark && `is-${mark}`} />)}</ol>
      <Link className="qp-test-go" to={`/study/questions/test${query ? `?${query}` : ""}`}>
        {subject ? <>Take a test on {subject}</> : "Take the test"}<ArrowRight size={17} strokeWidth={1.6} aria-hidden />
      </Link>
      <small>{available.toLocaleString()} questions to draw from</small>
    </div>
    <div className="qp-test-settings">
      <Setting label="Questions" note={minutesFor(length)}>{LENGTHS.map((n) =>
        <Choice key={n} on={length === n} onClick={() => setLength(n)}>{n}</Choice>)}</Setting>
      <Setting label="How hard" note={levelOf(level).line}>{LEVELS.map((l) =>
        <Choice key={l.id} on={level === l.id} onClick={() => setLevel(l.id)}><Pips level={l.id} />{l.label}</Choice>)}</Setting>
      <Setting label="For" note={ageOf(age).line}>{AGES.map(({ id, label, Icon }) =>
        <Choice key={id} on={age === id} onClick={() => setAge(id)}><Icon size={15} strokeWidth={1.7} aria-hidden />{label}</Choice>)}</Setting>
    </div>
  </section>;
}

function Setting({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  const id = `qp-test-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return <div className="qp-test-setting"><span id={id}>{label}</span>
    <div className="qp-test-choices" role="group" aria-labelledby={id}>{children}</div><small>{note}</small></div>;
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={on} onClick={onClick}>{children}</button>;
}
