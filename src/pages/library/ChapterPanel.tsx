import { AlertTriangle } from "lucide-react";
import { forwardRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { ChapterSummary } from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import { minutesToRead, PART_BY_ID, type Library } from "./model";
import { PartIcon } from "./PartIcon";

export type SummaryState = { status: "loading" } | { status: "ready"; summary: ChapterSummary | undefined } | { status: "missing" };

interface Props {
  library: Library;
  index: number;
  summary: SummaryState;
  readHref: string;
  onSelect: (index: number, options?: { center?: boolean }) => void;
}

/** The chosen chapter: its figures, a strip of its book, the AI-written summary and outline, and a link to read it. */
export const ChapterPanel = forwardRef<HTMLElement, Props>(function ChapterPanel({ library, index, summary, readHref, onSelect }, ref) {
  const bar = library.bars[index];
  const book = library.books[bar.book];
  const part = PART_BY_ID[bar.section];
  const prev = library.bars[index - 1];
  const next = library.bars[index + 1];
  const chapters = library.bars.slice(book.start, book.start + book.count);
  const maxInBook = Math.max(...chapters.map((b) => b.verses));
  const text = summary.status === "ready" ? summary.summary : undefined;
  const tone = { "--tone": `var(--${bar.section})` } as CSSProperties;

  return (
    <section ref={ref} className="lib-chapter" style={tone} aria-labelledby="chapter-title">
      <div className="lib-chapter-head">
        <div>
          <p className="lib-eyebrow lib-tone">
            <PartIcon id={bar.section} size={16} /> {part.name}{" "}
            <span>
              · {part.testament} · chapter {bar.chapter} of {book.count} · {formatNumber(index + 1)} of {formatNumber(library.bars.length)} in the Bible
            </span>
          </p>
          <h2 id="chapter-title">
            {bar.name} {bar.chapter}
          </h2>
          {text && <p className="lib-chapter-title">{text.title}</p>}
        </div>
        <div className="lib-step">
          <button type="button" disabled={!prev} onClick={() => prev && onSelect(prev.index)}>
            ← {prev ? `${prev.name} ${prev.chapter}` : "Start"}
          </button>
          <button type="button" disabled={!next} onClick={() => next && onSelect(next.index)}>
            {next ? `${next.name} ${next.chapter}` : "End"} →
          </button>
        </div>
      </div>
      <div className="lib-chapter-grid">
        <div className="lib-chapter-facts">
          <dl>
            <Figure label="Verses" value={bar.verses} />
            <Figure label="Words" value={formatNumber(bar.words)} />
            {bar.red > 0 && <Figure label="Words of Jesus" value={formatNumber(bar.red)} />}
            <Figure label="Reading time" value={`${minutesToRead(bar.words)} min`} />
          </dl>
          <div className="lib-strip-block" aria-hidden="true">
            <p className="lib-small-caps">{bar.name}, chapter by chapter</p>
            <div className="lib-strip" style={{ "--gap": `${book.count > 80 ? 0 : book.count > 40 ? 1 : 2}px` } as CSSProperties}>
              {chapters.map((b) => (
                <button
                  key={b.index}
                  type="button"
                  tabIndex={-1}
                  className={b.index === index ? "lib-strip-bar on" : "lib-strip-bar"}
                  title={`${b.name} ${b.chapter} · ${b.verses} verses`}
                  style={{ "--h": `${Math.max(8, (b.verses / maxInBook) * 100)}%` } as CSSProperties}
                  onClick={() => onSelect(b.index)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="lib-chapter-summary">
          {summary.status === "loading" ? (
            <p className="lib-muted">Loading the summary…</p>
          ) : text ? (
            <>
              <p>{text.summary}</p>
              {text.invitation && (
                <p className="lib-notice">
                  <span className="lib-small-caps">Notice</span>
                  {text.invitation}
                </p>
              )}
            </>
          ) : (
            <p className="lib-muted">No summary for this chapter yet.</p>
          )}
          <div className="lib-chapter-actions">
            <Link className="lib-read" to={readHref}>
              Read {bar.name} {bar.chapter} →
            </Link>
          </div>
        </div>
        <div className="lib-chapter-outline">
          <p className="lib-small-caps">Outline</p>
          {text?.outline.length ? (
            text.outline.map(([from, to, heading, body]) => (
              <details key={`${from}-${to}-${heading}`}>
                <summary>
                  <span className="lib-verses">{from === to ? from : `${from}–${to}`}</span>
                  {heading}
                </summary>
                <p>{body}</p>
              </details>
            ))
          ) : (
            <p className="lib-muted">{summary.status === "loading" ? "…" : "No outline yet."}</p>
          )}
          {text && (
            <p className="lib-ai-note">
              <AlertTriangle aria-hidden className="lib-ai-icon" />
              AI-generated summary. It may contain mistakes and is still being checked.
            </p>
          )}
        </div>
      </div>
    </section>
  );
});

function Figure({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
