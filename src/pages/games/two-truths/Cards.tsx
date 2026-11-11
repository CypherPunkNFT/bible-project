// One statement as a card that turns over in place at the reveal (the audit's item 1, the step's special rule). The
// front is the tap card: a lettered slot and the sentence, a lift on hover and focus, a press on tap (item 2). The back,
// mounted by the kit only once the round is revealed, shows the same sentence with a tick and "True" or, struck
// through, with a cross and "Made up"; the slot column keeps both faces the same height, so the card never jumps as it
// turns. Nothing about the statement's kind reaches the page before the reveal: no tone, no class, no attribute.
import { forwardRef } from 'react';
import { FlipCard } from '../kit';

const LETTERS=['A','B','C'] as const;

export interface StatementCardProps {
  index: number; text: string; kind: 'truth' | 'lie'; revealed: boolean; picked: boolean;
  /** Solo rounds pick by tapping; group rounds only read. */
  onPick?: () => void;
}

export const StatementCard=forwardRef<HTMLButtonElement,StatementCardProps>(function StatementCard({index,text,kind,revealed,picked,onPick},ref) {
  const letter=LETTERS[index], lie=kind==='lie';
  const words=<><span className="tt-slot" aria-hidden="true"><span className="tt-letter">{letter}</span></span><span className="tt-text">{text}</span></>;
  const front=onPick && !revealed
    ? <button ref={ref} type="button" className="tt-face" aria-pressed={picked} onClick={onPick}>{words}</button>
    : <div className="tt-face">{words}</div>;
  const back=<div className={`tt-face tt-back ${lie?'is-lie':'is-true'}`}>
    <span className="tt-slot" aria-hidden="true"><span className="tt-mark">{lie?'✗':'✓'}</span><span className="tt-kind">{lie?'Made up':'True'}</span></span>
    <span className="tt-text">{lie?<s>{text}</s>:text}<span className="tt-sr">{lie?'Made up':'True'}</span></span>
  </div>;
  return <FlipCard className={`tt-card${picked?' is-picked':''}`} index={index} flipped={revealed} tone={revealed?(lie?'wrong':'right'):null}
    front={front} back={back}/>;
});
