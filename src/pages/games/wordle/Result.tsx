// The result panel (design §9.3), rising where the keyboard was once the day's game is over (a sheet over the lower
// half of a phone screen): the cheer or "The word was", the answer in five green tiles, the verse it comes from in the
// BSB with the word marked, who the person is, a preview of the share grid above the Share button, the streak and the
// figures, and the countdown. Close returns to the board; the Show result button under the board brings it back.
import { X } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Verse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { bookByNum, formatRange, splitId } from "@/lib/refs";
import { formatNumber, plural } from "@/lib/site-format";
import { loadPersonDetail } from "@/lib/study";
import { Confetti, ResultPanel, ShareButton, StreakFlame } from "../kit";
import type { AnswerEntry } from "./daily";
import { msUntilMidnight } from "./daily";
import type { Mark } from "./evaluate";
import { StatFigures } from "./Panels";
import type { WordleRecord } from "./storage";
import { WIN_LINES } from "./text";
import { splitOnWord } from "./verse-match";

interface ResultProps {
  answer: string;
  entry: AnswerEntry;
  /** The played rows' marks, the same rows the share text is made of. */
  rows: readonly (readonly Mark[])[];
  won: boolean;
  shareText: string;
  record: WordleRecord;
  streak: number;
  /** A win this sitting: one short burst over the answer. */
  celebrate: boolean;
  /** Move focus into the panel when it appears (not at a plain reload). */
  focus: boolean;
  now: Date;
  /** The next puzzle number when the day has turned since this one opened, else null. */
  next: number | null;
  onNext: () => void;
  onStats: () => void;
  onClose: () => void;
}

export function Result({ answer, entry, rows, won, shareText, record, streak, celebrate, focus, now, next, onNext, onStats, onClose }: ResultProps) {
  const percent = record.played ? Math.round((record.won / record.played) * 100) : 0;
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (focus) close.current?.focus(); }, [focus]);
  return <section className="bw-result" role="dialog" aria-modal="false" aria-labelledby="bw-result-title">
    <button ref={close} type="button" className="bw-icon bw-result-close" onClick={onClose} aria-label="Close"><X size={18} aria-hidden="true" /></button>
    <ResultPanel
      trail={<Grid rows={rows} />}
      actions={<ShareButton text={shareText} preview={false} game="Bible Wordle" className="bw-share" />}
      reading={<>
        <StatFigures record={record} percent={percent} streak={streak} />
        <button type="button" className="bw-link" onClick={onStats}>See all statistics</button>
        {next !== null
          ? <button type="button" className="bw-button bw-primary" onClick={onNext}>{`Play #${formatNumber(next)}`}</button>
          : <Countdown now={now} />}
      </>}>
      {won ? <p className="bw-cheer">{WIN_LINES[rows.length - 1]?.label}</p> : <p className="bw-win">The word was</p>}
      <h2 id="bw-result-title" className="bw-answer">
        <span className="sr-only">{answer.toUpperCase()}</span>
        <span className="bw-answer-tiles" aria-hidden="true">
          {[...answer].map((letter, i) => <span key={i} className="bw-answer-tile" style={{ "--kit-i": i } as CSSProperties}>{letter.toUpperCase()}</span>)}
          <Confetti when={celebrate && won} count={20} reach={110} />
        </span>
      </h2>
      {streak >= 2 && <StreakFlame className="bw-result-flame" count={streak} label={plural(streak, "{n} day in a row", "{n} days in a row")} />}
      <VerseCard answer={answer} entry={entry} />
    </ResultPanel>
  </section>;
}

/** The share grid as coloured squares, exactly the rows the share text carries; no letters, so nothing is given away. */
function Grid({ rows }: { rows: readonly (readonly Mark[])[] }) {
  return <div className="bw-grid" aria-hidden="true">
    {rows.map((row, r) => <div key={r} className="bw-grid-row">
      {row.map((mark, i) => <span key={i} className={`bw-square bw-${mark}`} />)}
    </div>)}
  </div>;
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

/** "Next puzzle in 05:12:33", from the clock every second, so a tab that was asleep is right. */
function Countdown({ now }: { now: Date }) {
  const left = Math.max(0, Math.floor(msUntilMidnight(now) / 1000));
  const clock = [Math.floor(left / 3600), Math.floor(left / 60) % 60, left % 60].map((part) => formatNumber(part, { minimumIntegerDigits: 2 })).join(":");
  return <p className="bw-countdown">{`Next puzzle in ${clock}`}</p>;
}
