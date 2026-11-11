// A card's result (design §6.5, §10.3): the card stays and every hidden word lands in its gap, left to right, a tenth
// of a second apart, each marked by a symbol attached to it (right, typo, nearly, wrong, missed, shown with a hint).
// The verdict, the stars filling one after another and Next ride in the kit's feedback band, pinned to the bottom of
// a phone screen, so Next is never below the fold; the band gives Next focus, so Enter moves on. Add to My verses and
// Read in context fold in under the verdict. Every state is set at once; the motion only decorates it.
import { ExternalLink, Star } from "lucide-react";
import type { CSSProperties } from "react";
import type { Catalog } from "@/lib/types";
import type { BoxChange } from "./boxes";
import { FeedbackBand } from "../kit";
import { contextHref } from "./load";
import type { Mark, Result } from "./match";
import type { Passage } from "./model";
import { BAND_LINES, SHOWN_MARK, STAR_LINES, VERDICTS, boxChangeText } from "./text";
import { landDelayMs, shownVerdict } from "./view";
import type { Word } from "./words";

export interface Outcome extends Pick<Result, "marks" | "extras" | "accuracy" | "perfect"> {
  stars: 0 | 1 | 2 | 3;
  change: BoxChange | null;
  dontKnow?: boolean;
  hints?: number;
  /** The hidden words shown with a hint (Type, whole words): drawn as "shown", scored as wrong. */
  hinted?: ReadonlySet<number>;
}

/** Three stars, the earned ones filled; `live` pops them in one after another and shimmers a full three. */
export function Stars({ count, total = 3, live = false }: { count: number; total?: number; live?: boolean }) {
  return <span className={`vc-stars${live ? " is-live" : ""}${live && count === total ? " is-full" : ""}`} aria-label={STAR_LINES[Math.min(3, count)]?.label ?? `${count} stars`}>
    {Array.from({ length: total }, (_, i) => <Star key={i} size={live ? 22 : 16} aria-hidden="true" className={i < count ? "is-on" : ""} style={{ "--vc-i": i } as CSSProperties} />)}
  </span>;
}

function MarkedWord({ word, mark, index, hinted }: { word: Word; mark: Mark; index: number; hinted?: ReadonlySet<number> }) {
  const verdict = shownVerdict(mark, index, hinted);
  const { label, symbol } = verdict === "shown" ? SHOWN_MARK : VERDICTS[verdict];
  const typedNote = verdict !== "shown" && mark.typed && verdict !== "exact" ? verdict === "typo" ? `accepted: you typed ${mark.typed}` : `you typed ${mark.typed}` : "";
  const shown = word.text.trimEnd();
  const tail = word.text.slice(shown.length);
  return <>
    <span className={`vc-mark is-${verdict}`} tabIndex={typedNote ? 0 : undefined} title={typedNote || undefined} style={{ "--vc-land": `${landDelayMs(index)}ms` } as CSSProperties}>
      {verdict === "wrong" && mark.typed && <><s className="vc-typed">{mark.typed}</s> </>}
      {shown}
      <span className="vc-symbol" aria-hidden="true">{symbol}</span>
      <span className="sr-only"> ({label}{typedNote ? `, ${typedNote}` : ""})</span>
    </span>
    {tail}
  </>;
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
  const summary = props.typed && !outcome.dontKnow ? typedSummary(outcome.marks) : "";
  const tone = outcome.stars === 3 ? "right" : outcome.stars === 0 ? "wrong" : "part";
  const landed = `${landDelayMs(Math.max(0, list.length - split - 1)) + 250}ms`;
  return <>
    <section className={`vc-card is-result is-${tone}`} aria-labelledby="vc-ref" style={{ "--vc-landed": landed } as CSSProperties}>
      <h2 id="vc-ref" className="vc-ref" tabIndex={-1}>{props.reference}</h2>
      <p className="vc-verse">
        {props.text.slice(0, list[split].start)}
        {list.slice(split).map((word, i) => <MarkedWord key={i} word={word} mark={outcome.marks[i]} index={i} hinted={outcome.hinted} />)}
      </p>
      {outcome.extras.length > 0 && <p className="vc-note">Also typed: <em>{outcome.extras.join(", ")}</em></p>}
      {props.endings && props.chosen !== null && props.chosen !== props.endings.right && <p className="vc-note">You chose: <s>{props.endings.options[props.chosen]}</s></p>}
    </section>
    <FeedbackBand open tone={tone} className="vc-band" pinned="narrow"
      verdict={<span className="vc-verdict" style={{ "--vc-landed": landed } as CSSProperties}>
        <Stars count={outcome.stars} live />
        <span className="vc-verdict-words">{outcome.perfect ? "Word perfect!" : BAND_LINES[outcome.stars].label}</span>
        <span className="sr-only">{`${STAR_LINES[outcome.stars].label}. ${summary}`}</span>
      </span>}
      action={<button type="button" className="vc-primary" onClick={props.onNext}>Next</button>}>
      {summary && <p className="vc-note">{summary}</p>}
      {outcome.hints ? <p className="vc-note">{`Words shown with a hint count as wrong: ${outcome.hints}`}</p> : null}
      {outcome.change && <p className="vc-change">{boxChangeText(outcome.change)}</p>}
      <div className="vc-actions is-tight">
        <button type="button" className="vc-secondary" aria-pressed={props.inMyVerses} onClick={props.onToggleAdd}>
          {props.inMyVerses ? "In My verses" : "Add to My verses"}
        </button>
        <a className="vc-link" href={contextHref(props.catalog, props.passage)} target="_blank" rel="noopener">
          Read in context<ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </FeedbackBand>
  </>;
}
