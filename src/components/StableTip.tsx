import type { CSSProperties, ReactNode } from "react";
import "./stable-tip.css";

/**
 * A hover/focus line ("tip") under a strip, map, chart or timeline that never changes height. Every text it can show is
 * laid in the same grid cell, hidden but measured, so the box is always as tall as its longest possible content at the
 * current width: pointing at a long name (two lines on a phone) no longer pushes the page down. Owner, 2026-10-08:
 * no jumps anywhere, not only on the page where one was noticed. Every hover line on the site uses this.
 *
 * `options` must hold every content the tip can show (the resting text and one per pointable item); `show` is the one
 * shown now. Hidden copies are `visibility: hidden`, so their links cannot be focused or read out.
 * `cap` (a CSS length) limits the box for tips that can hold a long list (a chart's passages): the box is then the
 * smaller of the tallest content and the cap, still fixed, and a longer content scrolls inside it.
 */
export function StableTip({ show, options, className = "lg-tip", cap }: { show: ReactNode; options: ReactNode[]; className?: string; cap?: string }) {
  const style = cap ? ({ "--stable-tip-cap": cap } as CSSProperties) : undefined;
  return <div className={`stable-tip ${className}`} data-capped={cap ? "" : undefined} style={style}>
    {options.map((option, i) => <div key={i} className="stable-tip-sizer" aria-hidden="true">{option}</div>)}
    <div className="stable-tip-live" aria-live="polite">{show}</div>
  </div>;
}
