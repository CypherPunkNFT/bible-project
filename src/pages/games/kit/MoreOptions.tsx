// The options fold (the audits' item 11, thirteen games open on a settings form): one row that hides the long tail of
// settings so Play sits on the first phone screen. A native disclosure, so it works with no script and the summary is
// a real button to the keyboard; the game keeps its own settings state inside.
import type { ReactNode } from "react";

export interface MoreOptionsProps {
  /** The row's words; default "More options". */
  summary?: ReactNode;
  /** Open at first (default closed). */
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function MoreOptions({ summary = "More options", defaultOpen = false, children, className = "" }: MoreOptionsProps) {
  return <details className={`kit-options${className ? ` ${className}` : ""}`} open={defaultOpen || undefined}>
    <summary>{summary}</summary>
    <div className="kit-options__body">{children}</div>
  </details>;
}
