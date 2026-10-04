import type { ReactNode } from "react";
import "./reference-panel.css";

/** Keep the rounded content box separate from its outside scrollbar. */
export function ReferencePanel({ labelledBy, children }: { labelledBy: string; children: ReactNode }) {
  return <aside aria-labelledby={labelledBy} className="reader-reference-panel slim-scroll fixed inset-x-0 bottom-0 z-40 max-h-[72dvh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-line bg-surface shadow-[0_-12px_40px_rgba(0,0,0,0.18)] lg:sticky lg:top-[8.5rem] lg:z-0 lg:max-h-[calc(100dvh-10rem)] lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none">
    <div className="reader-reference-box rounded-t-2xl bg-surface p-4 lg:rounded-2xl lg:border lg:border-line" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>{children}</div>
  </aside>;
}
