// Odd one out: what the player sees after answering (design section 7). The reason, one line for each of the four
// with a verse, the key verse in the BSB, and anything else that also singles out the same answer.
import { Check, X } from "lucide-react";
import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { headline, itemRef, joinNames, shownLabel, verseHref, verseLabel, type SetEntry, type SetsFile } from "./game";

/** The reason in one sentence; `inline` for places that take only phrasing content (a summary row). */
export function Headline({ data, set, inline = false }: { data: SetsFile; set: SetEntry; inline?: boolean }) {
  const { odd, oddPhrase, rest } = headline(data, set);
  const body = <><strong>{odd}</strong> {oddPhrase}. {rest}</>;
  return inline ? <span className="oo-headline">{body}</span> : <p className="oo-headline">{body}</p>;
}

interface RevealProps { data: SetsFile; set: SetEntry; order: readonly string[]; pick: string | null }

/** The full explanation; the heading takes focus after an answer (design 10, accessibility). */
export const Reveal = forwardRef<HTMLHeadingElement, RevealProps>(function Reveal({ data, set, order, pick }, ref) {
  const right = pick === set.odd;
  const rule = data.rules[set.rule];
  const oddLabel = shownLabel(data, set, set.odd);
  return <section className="oo-reveal" aria-labelledby={`oo-result-${set.id}`}>
    <h3 id={`oo-result-${set.id}`} ref={ref} tabIndex={-1} className={right ? "oo-result is-right" : "oo-result is-wrong"}>
      {right ? <Check size={18} aria-hidden="true" /> : <X size={18} aria-hidden="true" />}
      {pick === null ? <>The odd one out was <strong>{oddLabel}</strong></>
        : right ? "Right!" : <>Not quite: the odd one out was <strong>{oddLabel}</strong></>}
    </h3>
    <Headline data={data} set={set} />
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
    {rule.keyRef && rule.keyQuote && <blockquote className="oo-key">
      <p>“{rule.keyQuote}”</p>
      <footer><Link to={verseHref(data, ...rule.keyRef)}>{verseLabel(data, ...rule.keyRef)}</Link> <span>BSB</span></footer>
    </blockquote>}
    {set.also?.length ? <p className="oo-also"><span>Also true:</span> {oddLabel} {joinNames(set.also)}.</p> : null}
  </section>;
});
