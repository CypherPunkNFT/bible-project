// A date page, /birthday-verses/march-16 (design 6.3, 6.4, 6.5): the heading, the lead line, the verse read from the
// Berean, where its number comes from, the verses around it, the card, the message, and the dates around it. When the
// chapter cannot be read the page keeps its heading, reference, note and links, without a card it could not draw.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CardSharePanel } from "@/components/verse-card/CardSharePanel";
import type { LifeEventPassage } from "@/data/life-events/types";
import { useCatalog } from "@/lib/catalog";
import { CHOSEN_BIBLE } from "@/lib/last-read";
import { readerPath } from "@/lib/verse-card/links";
import { closeNoteGaps } from "@/lib/verse-card/spec";
import type { Catalog } from "@/lib/types";
import { chapterVerses, joinVerses } from "@/pages/verse-cards/load";
import { toCardSpec } from "./card";
import { HUB_PATH, PICKER_BIRTHDAY_PATH, birthdayUrl, datePath, monthOf, monthPath, neighbours } from "./dates";
import { dateName, monthName } from "./format";
import { MessageBox } from "./MessageBox";
import { HONEST_LINE, birthdayPassage, dateHeading, kindLine, leadLine, passageRef, passageReference } from "./verse";

type Words = { status: "loading" } | { status: "error" } | { status: "ready"; text: string; before?: string; after?: string };

/** The passage's words and the verses on either side, from the one chapter file. */
function useWords(catalog: Catalog, passage: LifeEventPassage, attempt: number): Words {
  const [words, setWords] = useState<Words>({ status: "loading" });
  useEffect(() => {
    const ref = passageRef(passage);
    let current = true;
    setWords({ status: "loading" });
    chapterVerses(catalog, ref.book, ref.chapter)
      .then((verses) => {
        if (!current) return;
        if (!verses?.has(ref.first)) throw new Error(`the Berean has no verse ${ref.book}/${ref.chapter}:${ref.first}`);
        const side = (verse: number) => { const text = verses.get(verse); return text ? closeNoteGaps(text) : undefined; };
        setWords({ status: "ready", text: joinVerses(verses, ref.first, ref.last), before: side(ref.first - 1), after: side(ref.last + 1) });
      })
      .catch((error: unknown) => { console.error(`birthday verses: the verse for ${passage.from} could not be loaded`, error); if (current) setWords({ status: "error" }); });
    return () => { current = false; };
  }, [catalog, passage, attempt]);
  return words;
}

export function DatePage({ date }: { date: string }) {
  const catalog = useCatalog();
  const passage = birthdayPassage(date);
  if (!passage) throw new Error(`birthday verses: no verse is stored for ${date}`);
  return <DateView key={date} catalog={catalog} date={date} passage={passage} />;
}

function DateView({ catalog, date, passage }: { catalog: Catalog; date: string; passage: LifeEventPassage }) {
  const [attempt, setAttempt] = useState(0);
  const words = useWords(catalog, passage, attempt);
  const ref = passageRef(passage);
  const reference = passageReference(catalog, passage);
  const chapter = reference.replace(/:.*$/, "");
  const name = dateName(date);
  const text = words.status === "ready" ? words.text : "";
  return (
    <article className="bv-page bv-date mx-auto max-w-5xl px-4 sm:px-6">
      <nav className="bv-crumbs" aria-label="Breadcrumb">
        <Link to={HUB_PATH}>Birthday verses</Link> › <Link to={monthPath(monthOf(date))}>{monthName(monthOf(date))}</Link> › <span>{name}</span>
      </nav>
      <h1>{dateHeading(date)}</h1>
      <p className="bv-lead">{leadLine(date, reference, passage.note)}</p>
      {words.status === "loading" && <p className="bv-wait">Opening the Berean Standard Bible…</p>}
      {words.status === "error" && <p className="bv-notice" role="alert">
        The verse could not be loaded. <Link to={readerPath(ref)} state={CHOSEN_BIBLE}>{`Read ${reference} in the reader.`}</Link>{" "}
        <button type="button" className="bv-link" onClick={() => setAttempt((count) => count + 1)}>Try again</button>
      </p>}
      {words.status === "ready" && <div className="bv-verse">
        <blockquote className="scripture" lang="en" translate="no">{words.text}</blockquote>
        <Link to={readerPath(ref)} state={CHOSEN_BIBLE} className="bv-verse-ref">{reference}</Link>
      </div>}
      <div className="bv-why">
        <p>{kindLine(date, passage)}</p>
        <p>{HONEST_LINE}</p>
        {passage.context && <p className="bv-context">{passage.context}</p>}
        <LeapDayLine date={date} />
      </div>
      {words.status === "ready" && (words.before || words.after) && <section className="bv-place" aria-labelledby="bv-place-title">
        <h2 id="bv-place-title">In its place</h2>
        {words.before && <blockquote className="scripture bv-side" lang="en" translate="no">{words.before}</blockquote>}
        <p className="bv-side-mark">{reference}</p>
        {words.after && <blockquote className="scripture bv-side" lang="en" translate="no">{words.after}</blockquote>}
        <Link to={readerPath(ref)} state={CHOSEN_BIBLE}>{`Read ${chapter}`}</Link>
      </section>}
      {words.status === "ready" && <section className="bv-card" aria-labelledby="bv-card-title">
        <h2 id="bv-card-title">Make a birthday card</h2>
        <CardSharePanel spec={toCardSpec(date, { text: words.text, reference, book: ref.book })} allowLine />
        <p className="bv-privacy">Cards are drawn on your device. Nothing you type is sent or saved.</p>
      </section>}
      <section className="bv-send" aria-labelledby="bv-send-title">
        <h2 id="bv-send-title">Send a birthday message</h2>
        <MessageBox key={text} verse={{ text, reference, url: birthdayUrl(date) }} />
      </section>
      <Around date={date} />
      <p className="bv-source">Scripture quotations are from the Berean Standard Bible, which is in the public domain.</p>
    </article>
  );
}

/** 29 February's links to the days many celebrate it on, and theirs back to it (design 6.4). */
function LeapDayLine({ date }: { date: string }) {
  if (date === "02-29") {
    return <p>Born on February 29? Many celebrate on <Link to={datePath("02-28")}>February 28</Link> or <Link to={datePath("03-01")}>March 1</Link> in other years; here are those verses too.</p>;
  }
  if (date === "02-28" || date === "03-01") return <p>Born on February 29? <Link to={datePath("02-29")}>Its verse is here.</Link></p>;
  return null;
}

function Around({ date }: { date: string }) {
  const catalog = useCatalog();
  const { previous, next } = neighbours(date);
  const labelOf = (other: string) => {
    const passage = birthdayPassage(other);
    return passage ? `${dateName(other)}: ${passageReference(catalog, passage)}` : dateName(other);
  };
  return (
    <nav className="bv-around" aria-labelledby="bv-around-title">
      <h2 id="bv-around-title">Around this date</h2>
      <Link to={datePath(previous)}>{`Previous: ${labelOf(previous)}`}</Link>
      <Link to={datePath(next)}>{`Next: ${labelOf(next)}`}</Link>
      <Link to={monthPath(monthOf(date))}>{`All ${monthName(monthOf(date))} birthday verses`}</Link>
      <Link to={PICKER_BIRTHDAY_PATH}>More verses for a birthday</Link>
    </nav>
  );
}
