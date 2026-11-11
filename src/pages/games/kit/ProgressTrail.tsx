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
  className?: string;
}

export function ProgressTrail({ marks, shape = "squares", label, size, className = "" }: ProgressTrailProps) {
  const newest = newestIndex(marks);
  const style = size ? ({ "--kit-pip": size } as CSSProperties) : undefined;
  return <div className={`kit-trail${shape === "dots" ? " kit-trail--dots" : ""}${className ? ` ${className}` : ""}`} role="img" aria-label={label} style={style}>
    {marks.map((mark, i) => <span key={i} className={`kit-trail__mark is-${mark}${i === newest ? " is-new" : ""}`} data-mark={mark} />)}
  </div>;
}
