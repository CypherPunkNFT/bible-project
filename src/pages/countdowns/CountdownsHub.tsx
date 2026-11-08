// /countdowns (design 4.4, 7.2): every occasion with what it is and, drawn in the browser, this year's dates.
import { Link } from "react-router-dom";
import { COUNTDOWNS_HEADING, COUNTDOWNS_INTRO, OCCASIONS, type Occasion } from "@/data/countdowns";
import { weekdayDate } from "./format";
import { countdownPath } from "./message";
import { SourceLine } from "./parts";
import { currentRun, stateOf, until } from "./season";
import { useToday } from "./useToday";

function When({ occasion, todayN }: { occasion: Occasion; todayN: number }) {
  if (occasion.target.kind === "chosen") return <span className="cd-hub-when">Choose your own date</span>;
  const run = currentRun(occasion, todayN, OCCASIONS);
  const state = stateOf(run, todayN);
  const first = weekdayDate(run.entries[0].date);
  const text = state === "coming-up" ? `Begins ${first}, ${run.target.year}`
    : state === "counting" ? `Under way: ${until(run.targetN - todayN, occasion.targetName)}`
    : state === "the-day" ? `Today is ${occasion.targetName}` : occasion.closing;
  return <span className="cd-hub-when">{text}</span>;
}

export function CountdownsHub() {
  const todayN = useToday();
  return (
    <article className="cd-page cd-hub mx-auto max-w-5xl px-4 sm:px-6">
      <h1>{COUNTDOWNS_HEADING}</h1>
      <p className="cd-intro">{COUNTDOWNS_INTRO}</p>
      <section aria-labelledby="cd-hub-title">
        <h2 id="cd-hub-title" className="sr-only">Choose a countdown</h2>
        <ul className="cd-hub-grid">
          {OCCASIONS.map((occasion) => (
            <li key={occasion.slug} className={`cd-style-${occasion.style}`}>
              <Link to={countdownPath(occasion.slug)} className="cd-hub-card">
                <h3>{occasion.name}</h3>
                <span>{occasion.summary}</span>
                <When occasion={occasion} todayN={todayN} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <p className="cd-quiet">Churches: each countdown has a "For your church" panel with one link for everyone, a QR code, a printable plan and bulletin insert, and a calendar file.</p>
      <SourceLine />
    </article>
  );
}
