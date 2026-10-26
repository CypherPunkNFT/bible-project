// A ring of the whole test, one arc per question, filling in as you answer: used beside the question in "Try one,
// grown up" and as the score on every look's results.
import type { ReactNode } from "react";
import type { Result } from "./engine";

const point = (angle: number, r: number) => [50 + r * Math.sin(angle), 50 - r * Math.cos(angle)].map((v) => v.toFixed(2)).join(" ");

function arc(i: number, n: number, r: number) {
  const gap = (n <= 25 ? 2.2 : 1.1) * (Math.PI / 180);
  const from = (i / n) * 2 * Math.PI + gap / 2, to = ((i + 1) / n) * 2 * Math.PI - gap / 2;
  return `M ${point(from, r)} A ${r} ${r} 0 ${to - from > Math.PI ? 1 : 0} 1 ${point(to, r)}`;
}

export function Ring({ results, current, children }: { results: (Result | undefined)[]; current?: number; children?: ReactNode }) {
  const n = results.length;
  return <div className="tp-ring">
    <svg viewBox="0 0 100 100" aria-hidden>
      {results.map((r, i) => <path key={i} d={arc(i, n, 44)} pathLength={1}
        className={r ? (r.right ? "is-right" : "is-wrong") : i === current ? "is-now" : ""} style={{ animationDelay: `${i * 30}ms` }} />)}
    </svg>
    <div className="tp-ring-centre">{children}</div>
  </div>;
}
