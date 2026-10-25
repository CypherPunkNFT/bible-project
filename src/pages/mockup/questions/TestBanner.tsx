// The banner between 02 and 03 that leads to the test page. It carries whatever is chosen on this page (a book from
// 01, a theme from 02, a topic or Testament from 03), so "Take a test on David" opens a test already set to David, and
// the two settings chosen in it: how hard, then how many questions, the lengths following the level (owner,
// 2026-10-23: Gentle, Steady and Deep here, and children's tests on a page of their own). Since 2026-10-23 it is version 1 of the
// test banner mock-up (/test_banner_mockup, owner: "place the version 1 on the page"): the settings in the theme
// shelves' boxes on the right, all unchosen, and under the words a pill asking for them that becomes the button once
// both are chosen. Styles: test-banner.css.
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { QuestionBank } from "@/lib/data";
import { writeFilters, type Filters } from "./model";
import { DEFAULT_LENGTH } from "./test/engine";
import { DEFAULT_AGE, DEFAULT_LEVEL, LEVELS, levelOf, minutesFor, writeSettings } from "./test/settings";
import { Pips } from "./test/Pips";
import type { Theme } from "./test/themes";
import "../test-setup.css";
import "./test-banner.css";

// The row of marks drawn beside the words: a test part-way through, right, wrong and still to come.
const MARKS = ["right", "right", "wrong", "right", "now", "", "", "", "", ""];

type Key = "level" | "length";
type Picks = Record<Key, number | string | null>;
interface Choice { id: number | string; label: string; note: string }

/** The two settings in the order they are asked, each choice with its note. How many is picked as short, middle or
 * long (0 to 2), and shows the counts of the level chosen, Steady's until one is. */
function settingsFor(level: number): { key: Key; label: string; items: Choice[] }[] {
  return [
    { key: "level", label: "How hard", items: LEVELS.map((l) => ({ id: l.id, label: l.label, note: l.line })) },
    { key: "length", label: "Questions", items: levelOf(level).lengths.map((n, slot) => ({ id: slot, label: String(n), note: minutesFor(n) })) },
  ];
}

interface Props { bank: QuestionBank; filters: Filters; theme: Theme | null; bookNames: Record<string, string> }

export function TestBanner({ bank, filters, theme, bookNames }: Props) {
  const topic = bank.topics.find((t) => t.id === filters.topic)?.title;
  const bookName = filters.book ? bookNames[filters.book] : null;
  const subject = theme && bookName ? `${theme.title} in ${bookName}` : theme?.title ?? bookName ?? topic ?? (filters.kind ? bank.kinds[filters.kind] : null);
  const [picks, setPicks] = useState<Picks>({ length: null, level: null });
  const done = picks.length !== null && picks.level !== null;
  const level = Number(picks.level ?? DEFAULT_LEVEL);
  const settings = settingsFor(level);
  const length = picks.length === null ? null : levelOf(level).lengths[Number(picks.length)];
  // The list's difficulty (?d=) is not carried: the banner's own "How hard" sets the test's level.
  const params = writeFilters({ ...filters, difficulty: "" });
  if (theme) params.set("theme", theme.id);
  if (done && length !== DEFAULT_LENGTH) params.set("n", String(length));
  if (done) writeSettings(params, level, DEFAULT_AGE);
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
      <div className="qp-test-grid">{settings.map(({ key, label, items }) =>
        <div key={key} className="qp-test-row" role="group" aria-label={label}>
          <span className="qp-test-name">{label}{picks[key] !== null && <Check size={12} strokeWidth={2.2} aria-hidden />}</span>
          {items.map((item) => <button key={item.id} type="button" className="qp-test-cell" aria-pressed={picks[key] === item.id}
            onClick={() => setPicks((now) => ({ ...now, [key]: item.id }))}>
            <i className="qp-test-cell-icon"><Mark setting={key} id={item.id} label={item.label} /></i>
            <span><strong>{key === "length" ? "questions" : item.label}</strong><small>{item.note}</small></span>
          </button>)}
        </div>)}</div>
      {go("phone")}
    </div>
  </section>;
}

/** The mark in a box: the number or the rising bars. */
function Mark({ setting, id, label }: { setting: Key; id: number | string; label: string }) {
  if (setting === "level") return <Pips level={Number(id)} />;
  return <b>{label}</b>;
}
