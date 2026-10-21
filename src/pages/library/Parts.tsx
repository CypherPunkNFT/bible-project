import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import type { Progress } from "@/lib/progress";
import { formatNumber } from "@/lib/utils";
import { partFigures, type BookSpan, type Library } from "./model";
import { PartChart, type ChartMode } from "./PartChart";
import { PartIcon } from "./PartIcon";
import { PARTS, type PartId } from "./part-content";
import { Timeline } from "./Timeline";

interface Props {
  library: Library;
  part: PartId;
  onPart: (id: PartId) => void;
  selected: number;
  progress: Progress;
  /** choose a chapter from below the river, bringing the chapter panel to the middle of the screen */
  onChapter: (index: number) => void;
  onBook: (book: BookSpan) => void;
  onShowPart: (id: PartId) => void;
}

/** 02 · the six parts: when each was written, what it is, its figures, and every chapter in it. */
export function Parts({ library, part, onPart, selected, progress, onChapter, onBook, onShowPart }: Props) {
  const [mode, setMode] = useState<ChartMode>("choose");
  const figures = useMemo(() => Object.fromEntries(PARTS.map((p) => [p.id, partFigures(library, p.id)])) as Record<PartId, ReturnType<typeof partFigures>>, [library]);
  const tabs = useRef<HTMLDivElement>(null);
  const current = PARTS.find((p) => p.id === part)!;
  const stats = figures[part];

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = PARTS[(PARTS.findIndex((p) => p.id === part) + moves[event.key] + PARTS.length) % PARTS.length];
    onPart(next.id);
    tabs.current?.querySelector<HTMLButtonElement>(`[data-part="${next.id}"]`)?.focus();
  };

  const numbers: [string, string][] = [
    ["Books", String(stats.books.length)],
    ["Chapters", formatNumber(stats.bars.length)],
    ["Verses", formatNumber(stats.verses)],
    ["Words", formatNumber(stats.words)],
    ["Of the Bible", `${stats.share.toFixed(1)}%`],
    ["To read", `${Math.max(1, Math.round(stats.words / 200 / 60))} h`],
  ];
  if (stats.red) numbers.push(["Words of Jesus", formatNumber(stats.red)]);
  const chapterLink = (index: number) => {
    const bar = library.bars[index];
    return (
      <>
        <button type="button" className="lib-inline-link" onClick={() => onChapter(index)}>
          {bar.name} {bar.chapter}
        </button>{" "}
        · {bar.verses} {bar.verses === 1 ? "verse" : "verses"}
      </>
    );
  };

  return (
    <section className="lib-parts" aria-labelledby="parts-title">
      <div className="lib-section-head">
        <p className="lib-num">02</p>
        <div>
          <h2 id="parts-title">
            Six parts, <em>one library.</em>
          </h2>
          <p>The Bible is a library of 66 books written over about fifteen centuries. Choose a part to see what it is, when it was written, and every chapter in it.</p>
        </div>
      </div>
      <Timeline part={part} onChoose={onPart} />

      <div ref={tabs} className="lib-part-chips" role="tablist" aria-label="Parts of the Bible" onKeyDown={onTabKey}>
        {PARTS.map((p) => {
          const f = figures[p.id];
          const done = f.bars.filter((b) => progress.isRead(b.code, b.chapter)).length;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              id={`lib-tab-${p.id}`}
              data-part={p.id}
              aria-selected={p.id === part}
              aria-controls="lib-part"
              tabIndex={p.id === part ? 0 : -1}
              className="lib-part-chip"
              style={{ "--tone": `var(--${p.id})` } as CSSProperties}
              onClick={() => onPart(p.id)}
            >
              <span className="lib-chip-icon">
                <PartIcon id={p.id} />
              </span>
              <span className="lib-chip-name">{p.name}</span>
              <span className="lib-chip-range">{p.range}</span>
              <span className="lib-chip-count">
                {f.books.length} {f.books.length === 1 ? "book" : "books"} · {f.bars.length} chapters{done > 0 && <b> · {done} read</b>}
              </span>
              <span className="lib-chip-share" style={{ "--share": `${f.share.toFixed(1)}%` } as CSSProperties} />
            </button>
          );
        })}
      </div>

      <div className="lib-part" id="lib-part" role="tabpanel" aria-labelledby={`lib-tab-${part}`} style={{ "--tone": `var(--${part})` } as CSSProperties}>
        <div className="lib-part-head">
          <div>
            <p className="lib-eyebrow lib-tone">
              <PartIcon id={part} size={16} /> {current.testament} · {current.range}
            </p>
            <h3>{current.long}</h3>
          </div>
          <dl className="lib-numbers">
            {numbers.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="lib-part-body">
          <div className="lib-part-copy">
            <p className="lib-about">{current.about}</p>
            <div className="lib-moments">
              {current.moments.map((moment) => (
                <span key={moment}>{moment}</span>
              ))}
            </div>
            <button type="button" className="lib-link-button" onClick={() => onShowPart(part)}>
              Show {current.name} in the river ↑
            </button>
          </div>
          <dl className="lib-facts">
            <Fact label="Tells of">{current.coversText}</Fact>
            <Fact label="Written">{current.writtenText}</Fact>
            {current.facts.map(([label, value]) => (
              <Fact key={label} label={label}>
                {value}
              </Fact>
            ))}
            <Fact label="Longest chapter">{chapterLink(stats.longest.index)}</Fact>
            <Fact label="Shortest chapter">{chapterLink(stats.shortest.index)}</Fact>
            {stats.books.length > 1 && (
              <Fact label="Longest book">
                {stats.biggestBook.name} · {formatNumber(stats.biggestBook.words)} words
              </Fact>
            )}
          </dl>
        </div>
      </div>

      <div className="lib-chart-head">
        <h3>
          Every chapter of <em style={{ color: `var(--${part})` }}>{current.long.replace(/^The /, "the ")}</em>
        </h3>
        <div className="lib-toggle" role="radiogroup" aria-label="What a click does">
          {(
            [
              ["choose", "Choose a chapter"],
              ["mark", "Mark as read"],
            ] as const
          ).map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={mode === value} onClick={() => setMode(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {!progress.saving && (
        <p role="alert" className="lib-alert">
          This browser isn't letting the page save, so marks will be lost when you leave.
        </p>
      )}
      <div style={{ "--tone": `var(--${part})` } as CSSProperties}>
        <PartChart
          library={library}
          books={stats.books}
          longest={stats.longest.verses}
          mode={mode}
          selected={selected}
          progress={progress}
          onChapter={onChapter}
          onBook={onBook}
        />
      </div>
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
