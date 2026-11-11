// Type with whole words: write the rest of the verse and press Check (design §5.2). The box sits inside the card under
// the verse, in the serif, and the gaps above dim as the typed words reach them (onReach). Check, Show next word and
// I don't know sit above the box, so a phone keyboard never covers them. Show next word fills in the earliest word
// still short of credit; that word then always scores zero. Enter checks, Shift+Enter starts a new line.
import { useRef, useState } from "react";
import { matchAnswer, withNextWord, type AnswerContext, type Result } from "./match";
import { MAX_CHARS } from "./passage";
import { typedReach } from "./view";

interface TypeWordsProps {
  context: Omit<AnswerContext, "hinted">;
  /** How many gaps the typed answer has reached so far. */
  onReach: (count: number) => void;
  onDone: (result: Result, hinted: ReadonlySet<number>) => void;
  onDontKnow: () => void;
}

export function TypeWords({ context, onReach, onDone, onDontKnow }: TypeWordsProps) {
  const [answer, setAnswer] = useState("");
  const [hinted, setHinted] = useState<ReadonlySet<number>>(new Set());
  const done = useRef(false);
  const full = { ...context, hinted };
  const nextWord = withNextWord(answer, full);

  const write = (text: string) => {
    const cut = text.slice(0, MAX_CHARS);
    setAnswer(cut);
    onReach(typedReach(cut, context.hidden.length));
  };
  const check = () => {
    if (done.current) return;
    done.current = true;
    if (!answer.trim()) { onDontKnow(); return; }
    onDone(matchAnswer(answer, full), hinted);
  };
  const hint = () => {
    if (!nextWord) return;
    write(nextWord.answer);
    setHinted(new Set([...hinted, nextWord.index]));
  };

  return <div className="vc-type">
    <div className="vc-actions is-tight">
      <button type="button" className="vc-primary" onClick={check}>Check</button>
      <button type="button" className="vc-secondary" onClick={hint} disabled={!nextWord}>Show next word</button>
      <button type="button" className="vc-link" onClick={() => { if (!done.current) { done.current = true; onDontKnow(); } }}>I don't know</button>
    </div>
    <label className="sr-only" htmlFor="vc-answer">Type the rest of the verse</label>
    <textarea id="vc-answer" className="vc-input" rows={3} value={answer} maxLength={MAX_CHARS} autoFocus placeholder="Type the rest of the verse"
      autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="done"
      onChange={(event) => write(event.target.value)}
      onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); check(); } }} />
    {hinted.size > 0 && <p className="vc-note">{`Words shown: ${hinted.size}`}</p>}
  </div>;
}
