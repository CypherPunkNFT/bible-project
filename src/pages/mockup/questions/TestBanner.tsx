// The banner between 02 and 03 that leads to the test page. It carries whatever is chosen on this page (a book from
// 01, a theme from 02, a topic or Testament from 03), so "Take a test on David" opens a test already set to David, and
// the three settings chosen in it: how many questions, how hard and who for. Since 2026-10-23 it is version 1 of the
// test banner mock-up (/test_banner_mockup, owner: "place the version 1 on the page"): the settings in the theme
// shelves' boxes on the right, all unchosen, and under the words a pill asking for them that becomes the button once
// all three are chosen. Styles: test-banner.css.
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { QuestionBank } from "@/lib/data";
import { writeFilters, type Filters } from "./model";
import { DEFAULT_LENGTH, LENGTHS } from "./test/engine";
import { AGES, LEVELS, ageOf, minutesFor, writeSettings } from "./test/settings";
import { Pips } from "./test/SetupBars";
import type { Theme } from "./test/themes";
import "../test-setup.css";
import "./test-banner.css";

// The row of marks drawn beside the words: a test part-way through, right, wrong and still to come.
const MARKS = ["right", "right", "wrong", "right", "now", "", "", "", "", ""];

/** The three settings in the order they are asked, each choice with its note. */
const SETTINGS = [
  { key: "length", label: "Questions", items: LENGTHS.map((n) => ({ id: n as number | string, label: String(n), note: minutesFor(n) })) },
  { key: "level", label: "How hard", items: LEVELS.map((l) => ({ id: l.id as number | string, label: l.label, note: l.line })) },
  { key: "age", label: "For", items: AGES.map((a) => ({ id: a.id as number | string, label: a.label, note: a.line })) },
] as const;
type Key = (typeof SETTINGS)[number]["key"];
type Picks = Record<Key, number | string | null>;

interface Props { bank: QuestionBank; filters: Filters; theme: Theme | null; bookNames: Record<string, string> }

export function TestBanner({ bank, filters, theme, bookNames }: Props) {
  const topic = bank.topics.find((t) => t.id === filters.topic)?.title;
  const bookName = filters.book ? bookNames[filters.book] : null;
  const subject = theme && bookName ? `${theme.title} in ${bookName}` : theme?.title ?? bookName ?? topic ?? (filters.kind ? bank.kinds[filters.kind] : null);
  const [picks, setPicks] = useState<Picks>({ length: null, level: null, age: null });
  const done = picks.length !== null && picks.level !== null && picks.age !== null;
  const params = writeFilters(filters);
  if (theme) params.set("theme", theme.id);
  if (done && Number(picks.length) !== DEFAULT_LENGTH) params.set("n", String(picks.length));
  if (done) writeSettings(params, Number(picks.level), String(picks.age));
  const query = params.toString();
  // The pill under the words; on a phone, where the words sit above the boxes, it stands under the boxes instead.
  const go = (place: "left" | "phone") => <div className="qp-test-go-slot" data-place={place}>
    {done ? <Link className="qp-test-go" to={`/study/questions/test${query ? `?${query}` : ""}`}>
      {subject ? <>Take a test on {subject}</> : "Take a test on the whole Bible"}<ArrowRight size={17} strokeWidth={1.6} aria-hidden /></Link>
      : <span className="qp-test-go qp-test-wait" aria-disabled="true">Choose your options to take the test</span>}
  </div>;
  return <section className="qp-test-banner" id="qp-test" aria-labelledby="qp-test-title">
    <div className="qp-test-copy">
      <p className="qp-eyebrow"><span></span>A test of your own</p>
      <h2 id="qp-test-title">Ready to <em>test yourself?</em></h2>
      <p>Choose what to be tested on and answer one question at a time. The answers stay hidden until you give yours.</p>
      <ol className="qp-test-marks" aria-hidden>{MARKS.map((mark, i) => <li key={i} className={mark && `is-${mark}`} />)}</ol>
      {go("left")}
    </div>
    <div className="qp-test-action">
      <div className="qp-test-grid">{SETTINGS.map(({ key, label, items }) =>
        <div key={key} className="qp-test-row" role="group" aria-label={label}>
          <span className="qp-test-name">{label}{picks[key] !== null && <Check size={12} strokeWidth={2.2} aria-hidden />}</span>
          {items.map((item) => <button key={item.id} type="button" className="qp-test-cell" aria-pressed={picks[key] === item.id}
            onClick={() => setPicks((now) => ({ ...now, [key]: item.id }))}>
            <i className="qp-test-cell-icon"><Mark setting={key} id={item.id} /></i>
            <span><strong>{key === "length" ? "questions" : item.label}</strong><small>{item.note}</small></span>
          </button>)}
        </div>)}</div>
      {go("phone")}
    </div>
  </section>;
}

/** The mark in a box: the number, the rising bars, or the age group's icon. */
function Mark({ setting, id }: { setting: Key; id: number | string }) {
  if (setting === "level") return <Pips level={Number(id)} />;
  if (setting === "age") { const { Icon } = ageOf(String(id)); return <Icon size={18} strokeWidth={1.6} aria-hidden />; }
  return <b>{id}</b>;
}
