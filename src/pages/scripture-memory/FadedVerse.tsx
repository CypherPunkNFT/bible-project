// Scripture memory: the passage with today's words hidden (design §3 and §9). A hidden word is a button that stays a
// button once shown (aria-pressed), so focus never drops. The whole verse is one keyboard stop: arrow keys, Home and
// End move between its gaps in reading order. The verse is the English Berean, set left to right in every language.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { hiddenAt, passageSeed, passageWords } from "./fade";

interface FadedVerseProps {
  text: string;
  from: number;
  to: number;
  stage: number;
  /** Every word shown for a moment's check. */
  showAll: boolean;
}

export function FadedVerse({ text, from, to, stage, showAll }: FadedVerseProps) {
  const list = useMemo(() => passageWords(text), [text]);
  const hidden = useMemo(() => hiddenAt(list.length, stage, passageSeed(from, to)), [list.length, stage, from, to]);
  const gaps = useMemo(() => list.map((_, i) => i).filter((i) => hidden.has(i)), [list, hidden]);
  const [shown, setShown] = useState<ReadonlySet<number>>(new Set());
  const [active, setActive] = useState(0);
  const buttons = useRef(new Map<number, HTMLButtonElement>());

  // A new step or another passage hides again whatever was peeked at.
  useEffect(() => { setShown(new Set()); setActive(0); }, [text, stage]);

  const toggle = (i: number) => setShown((now) => {
    const next = new Set(now);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  const move = (event: KeyboardEvent<HTMLButtonElement>, gap: number) => {
    const target = { ArrowRight: gap + 1, ArrowDown: gap + 1, ArrowLeft: gap - 1, ArrowUp: gap - 1, Home: 0, End: gaps.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = Math.min(gaps.length - 1, Math.max(0, target));
    setActive(next);
    buttons.current.get(gaps[next])?.focus();
  };

  return <p className="sm-verse" lang="en" dir="ltr" data-testid="sm-verse">
    {list.map((word, i) => {
      const gap = gaps.indexOf(i);
      if (gap < 0) return <span key={i}>{word.text}</span>;
      const open = showAll || shown.has(i);
      const trail = /\s+$/.exec(word.text)?.[0] ?? "";
      const body = word.text.slice(0, word.text.length - trail.length);
      return <span key={i}>
        <button
          type="button"
          ref={(node) => { if (node) buttons.current.set(i, node); else buttons.current.delete(i); }}
          className={open ? "sm-gap is-open" : "sm-gap"}
          style={{ minWidth: `${Math.max(3, body.length)}ch` }}
          tabIndex={gap === Math.min(active, gaps.length - 1) ? 0 : -1}
          aria-pressed={open}
          aria-label={open ? body : "Hidden word, show"}
          disabled={showAll}
          onClick={() => { setActive(gap); toggle(i); }}
          onKeyDown={(event) => move(event, gap)}
        >{open ? body : ""}</button>{trail}
      </span>;
    })}
  </p>;
}
