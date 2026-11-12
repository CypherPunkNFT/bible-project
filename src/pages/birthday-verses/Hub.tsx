// The hub, /birthday-verses (design 6.1): the date chooser, today's verse, how the verses were chosen, the whole year as
// twelve month blocks of links, and the way to more birthday verses. Loads no verse words: the notes are stored.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { CARD_PATH } from "@/lib/verse-card/links";
import { DateChooser } from "./DateChooser";
import { MONTH_SLUGS, PICKER_BIRTHDAY_PATH, datePath, monthDates, monthPath, todayOf } from "./dates";
import { dateName, monthName } from "./format";
import { birthdayPassage, passageReference } from "./verse";
import { ToolsBackLink } from "@/components/tools-back/ToolsBackLink";

export function Hub({ notice }: { notice?: string }) {
  const navigate = useNavigate();
  const [today] = useState(() => todayOf(new Date()));
  const [chosen, setChosen] = useState(today);
  return (
    <article className="bv-page mx-auto max-w-5xl px-4 sm:px-6">
      <ToolsBackLink />
      <h1>Birthday Bible Verses: A Verse for Every Day of the Year</h1>
      <p className="bv-intro">Choose a birthday to see its verse, then send it as a card or a message.</p>
      {notice && <p className="bv-notice" role="alert">{notice}</p>}
      <section className="bv-choose" aria-label="Choose a birthday">
        <DateChooser value={chosen} onChange={setChosen} />
        <button type="button" className="bv-button bv-button-main" onClick={() => navigate(datePath(chosen))}>Show the verse</button>
      </section>
      <TodayLink date={today} />
      <ChosenHow />
      <h2>The year at a glance</h2>
      <div className="bv-year">
        {MONTH_SLUGS.map((_, index) => <MonthBlock key={index} month={index + 1} />)}
      </div>
      <MoreForBirthdays />
    </article>
  );
}

function TodayLink({ date }: { date: string }) {
  const catalog = useCatalog();
  const passage = birthdayPassage(date);
  if (!passage) return null;
  return (
    <p className="bv-today">
      <Link to={datePath(date)}>{`Today, ${dateName(date)}`}</Link>
      <span className="bv-ref">{passageReference(catalog, passage)}</span>
      <span className="bv-note">{passage.note}</span>
    </p>
  );
}

/** The honest note of design 6.3, with the three kinds named. */
export function ChosenHow() {
  return (
    <section className="bv-how" aria-labelledby="bv-how-title">
      <h2 id="bv-how-title">How the verses were chosen</h2>
      <p>Each date has a verse whose chapter and verse match it (March 16 is John 3:16), or the day and month the other way round (July 31 is Psalm 31:7), and a few dates where no numbered verse fits a birthday card have one chosen for them instead.</p>
      <p>The Bible gives no verse to any date. These are chosen as gifts to read and pray for someone, not as signs.</p>
    </section>
  );
}

function MonthBlock({ month }: { month: number }) {
  const catalog = useCatalog();
  const name = monthName(month);
  return (
    <nav className="bv-month-block" aria-label={`${name} birthday verses`}>
      <h3><Link to={monthPath(month)}>{name}</Link></h3>
      <ol>
        {monthDates(month).map((date) => {
          const passage = birthdayPassage(date);
          const label = passage ? `${dateName(date)}, ${passageReference(catalog, passage)}` : dateName(date);
          return <li key={date}><Link to={datePath(date)} aria-label={label}>{Number(date.slice(3))}</Link></li>;
        })}
      </ol>
    </nav>
  );
}

export function MoreForBirthdays() {
  return (
    <section className="bv-more" aria-labelledby="bv-more-title">
      <h2 id="bv-more-title">More for birthdays</h2>
      <ul>
        <li><Link to={PICKER_BIRTHDAY_PATH}>More verses for a birthday</Link></li>
        <li><Link to={CARD_PATH}>Make a card of any verse</Link></li>
      </ul>
    </section>
  );
}
