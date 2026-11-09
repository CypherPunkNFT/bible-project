// A card's result (design §6.5, §10.3): the whole passage with every hidden word marked by symbol and words, the stars,
// a summary of a typed answer, Read in context, Add to My verses and Next. Next takes focus, so Enter moves on.
import { useEffect, useRef } from "react";
import { ExternalLink, Star } from "lucide-react";
import type { Catalog } from "@/lib/types";
import type { BoxChange } from "./boxes";
import { contextHref } from "./load";
import type { Mark, Result } from "./match";
import type { Passage } from "./model";
import { STAR_LINES, VERDICTS, boxChangeText } from "./text";
import type { Word } from "./words";

export interface Outcome extends Pick<Result, "marks" | "extras" | "accuracy" | "perfect"> {
  stars: 0 | 1 | 2 | 3;
  change: BoxChange | null;
  dontKnow?: boolean;
  hints?: number;
}

export function Stars({ count, total = 3 }: { count: number; total?: number }) {
  return <span className="vc-stars" aria-label={STAR_LINES[Math.min(3, count)]?.label ?? `${count} stars`}>
    {Array.from({ length: total }, (_, i) => <Star key={i} size={16} aria-hidden="true" className={i < count ? "is-on" : ""} />)}
  </span>;
}

function MarkedWord({ word, mark }: { word: Word; mark: Mark }) {
  const verdict = VERDICTS[mark.verdict];
  const typedNote = mark.typed && mark.verdict !== "exact" ? mark.verdict === "typo" ? `accepted: you typed ${mark.typed}` : `you typed ${mark.typed}` : "";
  return <span className={`vc-mark is-${mark.verdict}`} tabIndex={typedNote ? 0 : undefined} title={typedNote || undefined}>
    {mark.verdict === "wrong" && mark.typed && <s className="vc-typed">{mark.typed}</s>}
    {word.text}
    <span className="vc-symbol" aria-hidden="true">{verdict.symbol}</span>
    <span className="sr-only"> ({verdict.label}{typedNote ? `, ${typedNote}` : ""})</span>
  </span>;
}

/** "14 of 16 words right · 1 typo accepted · 1 missed". */
function typedSummary(marks: readonly Mark[]): string {
  const right = marks.filter((mark) => mark.verdict === "exact" || mark.verdict === "typo").length;
  const parts = [`${right} of ${marks.length} words right`];
  const typos = marks.filter((mark) => mark.verdict === "typo").length;
  const near = marks.filter((mark) => mark.verdict === "near").length;
  const missed = marks.filter((mark) => mark.verdict === "missing" || mark.verdict === "wrong").length;
  if (typos) parts.push(`typos accepted: ${typos}`);
  if (near) parts.push(`nearly right: ${near}`);
  if (missed) parts.push(`missed: ${missed}`);
  return parts.join(" · ");
}

interface ResultProps {
  catalog: Catalog;
  passage: Passage;
  reference: string;
  text: string;
  list: readonly Word[];
  split: number;
  outcome: Outcome;
  typed: boolean;
  endings?: { options: string[]; right: number };
  chosen: number | null;
  inMyVerses: boolean;
  onToggleAdd: () => void;
  onNext: () => void;
}

export function CardResult(props: ResultProps) {
  const { outcome, list, split } = props;
  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => { next.current?.focus(); }, []);
  const summary = props.typed && !outcome.dontKnow ? typedSummary(outcome.marks) : "";
  const announce = `${STAR_LINES[outcome.stars].label}. ${summary}`;
  return <section className="vc-card is-result" aria-labelledby="vc-ref">
    <h2 id="vc-ref" className="vc-ref" tabIndex={-1}>{props.reference}</h2>
    <p className="vc-verse">
      {props.text.slice(0, list[split].start)}
      {list.slice(split).map((word, i) => <MarkedWord key={i} word={word} mark={outcome.marks[i]} />)}
    </p>
    {outcome.extras.length > 0 && <p className="vc-note">Also typed: <em>{outcome.extras.join(", ")}</em></p>}
    {props.endings && props.chosen !== null && props.chosen !== props.endings.right && <p className="vc-note">You chose: <s>{props.endings.options[props.chosen]}</s></p>}
    <p className="vc-score"><Stars count={outcome.stars} />{outcome.perfect && <span className="vc-perfect">Word perfect</span>}</p>
    {summary && <p className="vc-note">{summary}</p>}
    {outcome.hints ? <p className="vc-note">{`Words shown with a hint count as wrong: ${outcome.hints}`}</p> : null}
    {outcome.change && <p className="vc-change">{boxChangeText(outcome.change)}</p>}
    <p className="sr-only" aria-live="polite">{announce}</p>
    <div className="vc-actions">
      <button ref={next} type="button" className="vc-primary" onClick={props.onNext}>Next</button>
      <button type="button" className="vc-secondary" aria-pressed={props.inMyVerses} onClick={props.onToggleAdd}>
        {props.inMyVerses ? "In My verses" : "Add to My verses"}
      </button>
      <a className="vc-link" href={contextHref(props.catalog, props.passage)} target="_blank" rel="noopener">
        Read in context<ExternalLink size={14} aria-hidden="true" />
      </a>
    </div>
  </section>;
}

