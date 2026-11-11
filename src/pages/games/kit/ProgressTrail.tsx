// The progress trail (the audits' item 5, ten games): one square or dot per round, filled green, red or amber as each
// is answered, the newest popping. It replaces the small grey "3 OF 10" captions, and the same marks make the share
// grid (trailText in trail.ts). The label is the game's own words (a counted phrase from plural()).
import type { CSSProperties } from "react";
import { newestIndex, type TrailMark } from "./trail";

export interface ProgressTrailProps {
  marks: readonly TrailMark[];
  /** Squares (the default) or dots. */
  shape?: "squares" | "dots";
  /** The spoken label, e.g. plural(done, "{n} of {t} answered", …) written by the game. */
  label: string;
  /** The size of one pip, any CSS length. */
  size?: string;
  /** A colour per mark (any CSS colour), for a game whose filled pips wear their own tones (Memory match's pair colours);
   *  a missing entry keeps the right/wrong/part colour. */
  tones?: readonly (string | undefined)[];
  className?: string;
}

export function ProgressTrail({ marks, shape = "squares", label, size, tones, className = "" }: ProgressTrailProps) {
  const newest = newestIndex(marks);
  const style = size ? ({ "--kit-pip": size } as CSSProperties) : undefined;
  return <div className={`kit-trail${shape === "dots" ? " kit-trail--dots" : ""}${className ? ` ${className}` : ""}`} role="img" aria-label={label} style={style}>
    {marks.map((mark, i) => <span key={i} className={`kit-trail__mark is-${mark}${i === newest ? " is-new" : ""}`} data-mark={mark}
      style={tones?.[i] ? ({ "--kit-mark": tones[i] } as CSSProperties) : undefined} />)}
  </div>;
}
