import type { ReactNode } from "react";
import { OutsideScroll } from "@/components/OutsideScroll";
import "./reference-panel.css";

/**
 * The reader's side panel: the header and footer stay fixed and only the middle scrolls, with its scrollbar
 * just outside the rounded box. Scrolling continues onto the page at either end.
 */
export function ReferencePanel({ labelledBy, scrollLabel, header, footer, children }: {
  labelledBy: string;
  scrollLabel: string;
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  return <aside aria-labelledby={labelledBy} className="reader-reference-panel fixed inset-x-0 bottom-0 z-40 flex max-h-[72dvh] flex-col rounded-t-2xl border-t border-line bg-surface shadow-[0_-12px_40px_rgba(0,0,0,0.18)] lg:sticky lg:top-[8.5rem] lg:z-0 lg:max-h-[calc(100dvh-10rem)] lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none">
    <div className="reader-reference-box flex min-h-0 flex-1 flex-col rounded-t-2xl bg-surface lg:rounded-2xl lg:border lg:border-line">
      <div className="shrink-0 px-4 pt-4">{header}</div>
      <OutsideScroll label={scrollLabel} className="flex-1" viewportClassName="px-4">{children}</OutsideScroll>
      <div className="shrink-0 border-t border-line/60 px-4 pt-2" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>{footer}</div>
    </div>
  </aside>;
}
