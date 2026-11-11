// Odd one out: what the player sees after answering (design section 7), split for the kit's feedback band. The
// Verdict (right or wrong, and the odd one's name when the pick was wrong) sits in the band's row beside Next; the
// Reading folds in under it: the reason in one large sentence, then, under a "Why" fold, one line for each of the
// four with a verse, the key verse in the reader's Bible, and anything else that singles out the same answer. The
// Ring is the hub drawing's circle round the goat, drawn round the odd card. Words: fixed phrases and names stand in
// their own elements, so the translation check passes.
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { BibleAbbr, Verse } from "@/components/Verse";
import { MoreOptions } from "../kit";
import { headline, itemRef, joinNames, shownLabel, verseHref, verseLabel, type SetEntry, type SetsFile } from "./game";

/** The reason in one sentence; `inline` for places that take only phrasing content (a summary row). */
export function Headline({ data, set, inline = false }: { data: SetsFile; set: SetEntry; inline?: boolean }) {
  const { odd, oddPhrase, rest } = headline(data, set);
  const body = <><strong>{odd}</strong> {oddPhrase}. {rest}</>;
  return inline ? <span className="oo-headline">{body}</span> : <p className="oo-headline">{body}</p>;
}

/** The band's verdict: a tick and "Right!", or a cross and "Not quite" with the odd one named on its own line. */
export function Verdict({ right, oddLabel }: { right: boolean; oddLabel: string }) {
  return <div className="oo-verdict">
    <h2 className={right ? "oo-result is-right" : "oo-result is-wrong"}>
      {right ? <Check size={20} aria-hidden="true" /> : <X size={20} aria-hidden="true" />}
      <span>{right ? "Right!" : "Not quite"}</span>
    </h2>
    {!right && <p className="oo-verdict-who"><strong>{oddLabel}</strong> <span>was the odd one out</span></p>}
  </div>;
}

/** A hand-drawn ring that draws itself round the odd card (the hub's goat, circled). Decoration only. */
export function Ring() {
  return <svg className="oo-ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <ellipse cx="50" cy="50" rx="48" ry="46" pathLength={1} vectorEffect="non-scaling-stroke" />
  </svg>;
}

interface LinesProps { data: SetsFile; set: SetEntry; order: readonly string[] }

/** The four lines with their verses, the key verse, and "Also true". */
export function Lines({ data, set, order }: LinesProps) {
  const rule = data.rules[set.rule];
  const oddLabel = shownLabel(data, set, set.odd);
  return <div className="oo-lines-block">
    <ul className="oo-lines">
      {order.map((id) => {
        const item = data.items[id];
        const verse = itemRef(data, set, id);
        return <li key={id} className={id === set.odd ? "is-odd" : undefined}>
          <Link to={item.href} className="oo-line-name">{item.label}</Link>
          {id === set.odd && <span className="oo-tag">Odd one out</span>}
          <span className="oo-line-brief">{item.brief}</span>
          <Link to={verseHref(data, verse)} className="oo-line-ref">{verseLabel(data, verse)}</Link>
        </li>;
      })}
    </ul>
    {rule.keyRef && <blockquote className="oo-key">
      <p>“<Verse from={rule.keyRef[0]} to={rule.keyRef[1]} unquoted />”</p>
      <footer><Link to={verseHref(data, ...rule.keyRef)}>{verseLabel(data, ...rule.keyRef)}</Link> <BibleAbbr /></footer>
    </blockquote>}
    {set.also?.length ? <p className="oo-also"><span>Also true:</span> {oddLabel} {joinNames(set.also)}.</p> : null}
  </div>;
}

/** The band's reading: the reason large, then the rest under "Why". */
export function Reading({ data, set, order }: LinesProps) {
  return <div className="oo-reading">
    <Headline data={data} set={set} />
    <MoreOptions className="oo-why" summary="Why">
      <Lines data={data} set={set} order={order} />
    </MoreOptions>
  </div>;
}
