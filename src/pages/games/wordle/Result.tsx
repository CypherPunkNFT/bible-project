// The result card (design §9.3), in place of the keyboard once the day's game is over: the answer, the verse it comes
// from in the BSB with the word marked, who the person is, the share button, a short summary and the countdown.
import { Share2 } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Verse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { bookByNum, formatRange, splitId } from "@/lib/refs";
import { formatNumber } from "@/lib/site-format";
import { loadPersonDetail } from "@/lib/study";
import type { AnswerEntry } from "./daily";
import { msUntilMidnight } from "./daily";
import { StatFigures } from "./Panels";
import { shareResult } from "./share";
import { currentStreak, type WordleRecord } from "./storage";
import { WIN_LINES } from "./text";
import { splitOnWord } from "./verse-match";

interface ResultProps {
  n: number;
  answer: string;
  entry: AnswerEntry;
  tries: number;
  won: boolean;
  shareText: () => string;
  record: WordleRecord;
  now: Date;
  /** The next puzzle number when the day has turned since this one opened, else null. */
  next: number | null;
  onNext: () => void;
  onStats: () => void;
}

export function Result({ n, answer, entry, tries, won, shareText, record, now, next, onNext, onStats }: ResultProps) {
  const percent = record.played ? Math.round((record.won / record.played) * 100) : 0;
  return <section className="bw-result" aria-labelledby="bw-result-title">
    {won ? <p className="bw-win">{WIN_LINES[tries - 1]?.label}</p> : <p className="bw-win">The word was</p>}
    <h2 id="bw-result-title" className="bw-answer">{answer.toUpperCase()}</h2>
    <VerseCard answer={answer} entry={entry} />
    <ShareButton text={shareText} />
    <StatFigures record={record} percent={percent} streak={currentStreak(record, n)} />
    <button type="button" className="bw-link" onClick={onStats}>See all statistics</button>
    {next !== null
      ? <button type="button" className="bw-button bw-primary" onClick={onNext}>{`Play #${formatNumber(next)}`}</button>
      : <Countdown now={now} />}
  </section>;
}

function VerseCard({ answer, entry }: { answer: string; entry: AnswerEntry }) {
  const catalog = useCatalog();
  const { num, chapter, verse } = splitId(entry.v);
  const code = bookByNum(catalog, num)?.code ?? "GEN";
  const marked = (text: string) => splitOnWord(text, answer).map((piece, i) => (piece.match ? <mark key={i}>{piece.text}</mark> : <Fragment key={i}>{piece.text}</Fragment>));
  return <figure className="bw-verse">
    <blockquote><Verse id={entry.v} bible="bsb" render={marked} /></blockquote>
    <figcaption>
      <cite>{formatRange(catalog, entry.v, entry.v)}</cite>
      <Link to={`/read/bsb/${code}/${chapter}?v=${verse}`}>Read in context</Link>
    </figcaption>
    {entry.p && <PersonLine slug={entry.p} id={entry.pid ?? entry.p} name={answer[0].toUpperCase() + answer.slice(1)} />}
  </figure>;
}

/** Who the person is, in the site's language where a translation exists. If the record cannot load, only the link stays. */
function PersonLine({ slug, id, name }: { slug: string; id: string; name: string }) {
  const [line, setLine] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadPersonDetail(id).then((detail) => { if (live) setLine(detail.b || null); })
      .catch((error: unknown) => console.warn(`Bible Wordle: the record of ${id} could not be loaded:`, error));
    return () => { live = false; };
  }, [id]);
  return <p className="bw-person">
    {line && <span>{line}</span>}
    <Link to={`/people/${slug}`}>{`More about ${name}`}</Link>
  </p>;
}

/** Share, copy, or show the text to copy when neither works. */
function ShareButton({ text }: { text: () => string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const [shown, setShown] = useState("");
  const share = async () => {
    const value = text();
    setShown(value);
    const outcome = await shareResult(value);
    setState(outcome === "copied" ? "copied" : outcome === "manual" ? "manual" : "idle");
  };
  return <div className="bw-share">
    <button type="button" className="bw-button bw-primary" onClick={() => { void share(); }}><Share2 size={16} aria-hidden="true" /><span>Share</span></button>
    <span role="status" className="bw-toast">{state === "copied" ? "Copied" : ""}</span>
    {state === "manual" && <label className="bw-copy">
      <span>Copying is blocked in this browser. Select the text and copy it.</span>
      <textarea readOnly value={shown} rows={8} autoFocus onFocus={(event) => event.currentTarget.select()} />
    </label>}
  </div>;
}

/** "Next puzzle in 05:12:33", from the clock every second, so a tab that was asleep is right. */
function Countdown({ now }: { now: Date }) {
  const left = Math.max(0, Math.floor(msUntilMidnight(now) / 1000));
  const clock = [Math.floor(left / 3600), Math.floor(left / 60) % 60, left % 60].map((part) => formatNumber(part, { minimumIntegerDigits: 2 })).join(":");
  return <p className="bw-countdown">{`Next puzzle in ${clock}`}</p>;
}
