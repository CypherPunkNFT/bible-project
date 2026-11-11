// Type with first letters: one key per hidden word reveals it in its own gap in the verse (the card draws the words
// from onProgress), struck through when the letter was wrong (design §5.2). Keys are read from the input's text, not
// keydown, because many Android keyboards report every key as code 229. Text still being composed by an input method
// waits for compositionend and is taken once. A scored word cannot be undone.
import { useRef, useState } from "react";
import type { Mark } from "./match";
import { normalize, firstLetter, type Word } from "./words";

/** The letters and digits of what was typed, in order: spaces and punctuation are not tries. */
const lettersOf = (text: string): string[] => normalize(text).join("").split("");

interface TypeLettersProps {
  hidden: readonly Word[];
  onProgress: (marks: Mark[]) => void;
  onDone: (marks: Mark[]) => void;
  onDontKnow: (marks: Mark[]) => void;
}

export function TypeLetters({ hidden, onProgress, onDone, onDontKnow }: TypeLettersProps) {
  const [said, setSaid] = useState("");
  const [position, setPosition] = useState(0);
  const composing = useRef(false);
  const state = useRef<{ marks: Mark[]; done: boolean }>({ marks: [], done: false });

  const take = (text: string, input: HTMLInputElement) => {
    input.value = "";
    if (state.current.done) return;
    let next = state.current.marks;
    for (const letter of lettersOf(text)) {
      if (next.length >= hidden.length) break;
      const word = hidden[next.length];
      const right = letter === firstLetter(word);
      next = [...next, right ? { verdict: "exact", credit: 1 } : { verdict: "wrong", credit: 0, typed: letter }];
      setSaid(`${word.key}, ${right ? "right" : "missed"}`);
    }
    state.current.marks = next;
    setPosition(next.length);
    onProgress(next);
    if (next.length === hidden.length) { state.current.done = true; onDone(next); }
  };

  return <div className="vc-letters">
    <div className="vc-letter-row">
      <label className="vc-label" htmlFor="vc-letter">Type the first letter of the next word</label>
      <input id="vc-letter" className="vc-input vc-letter" type="text" autoFocus inputMode="text"
        autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="next"
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={(event) => { composing.current = false; take(event.data ?? event.currentTarget.value, event.currentTarget); }}
        onInput={(event) => { if (!composing.current) take(event.currentTarget.value, event.currentTarget); }} />
      <span className="vc-count" aria-hidden="true">{`${Math.min(position + 1, hidden.length)} / ${hidden.length}`}</span>
    </div>
    <div className="vc-actions is-tight">
      <button type="button" className="vc-link" onClick={() => { if (!state.current.done) { state.current.done = true; onDontKnow(state.current.marks); } }}>I don't know</button>
    </div>
    <p className="sr-only" aria-live="polite">{said}</p>
  </div>;
}
