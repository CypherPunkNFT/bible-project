import type { ReactNode } from "react";

/** A titled panel for one chart: what it shows in one line, then the chart. */
export function ChartCard({ id, title, lead, children, aside }: { id: string; title: string; lead: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 id={`${id}-title`} className="font-serif text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">{lead}</p>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Loading({ height = 240 }: { height?: number }) {
  return <div className="animate-pulse rounded-lg bg-surface-2" style={{ height }} role="status" aria-label="Loading chart" />;
}
