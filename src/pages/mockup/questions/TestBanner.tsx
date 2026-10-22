// The banner between 01 and 02 that leads to the test page. It carries whatever is chosen on this page (a book from
// 01, a kind, topic or Testament from 02), so "Take a test on Genesis" opens a test already set to Genesis.
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { QuestionBank } from "@/lib/data";
import { writeFilters, type Filters } from "./model";

// The row of marks drawn beside the words: a test part-way through, right, wrong and still to come.
const MARKS = ["right", "right", "wrong", "right", "now", "", "", "", "", ""];

interface Props { bank: QuestionBank; filters: Filters; available: number; bookNames: Record<string, string> }

export function TestBanner({ bank, filters, available, bookNames }: Props) {
  const topic = bank.topics.find((t) => t.id === filters.topic)?.title;
  const subject = filters.book ? bookNames[filters.book] : topic ?? (filters.kind ? bank.kinds[filters.kind] : null);
  const query = writeFilters(filters).toString();
  return <section className="qp-test-banner" aria-labelledby="qp-test-title">
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
  </section>;
}
