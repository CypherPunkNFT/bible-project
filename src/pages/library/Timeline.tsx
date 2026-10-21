import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PARTS, type Part, type PartId } from "./part-content";

// "Through time": one lane per part. The light band is the time the part tells of, the dark line when it was written.
// The axis is in three pieces so the New Testament's single century is readable: 2200–400 BC, the ~400 years between
// the Testaments (compressed), then 10 BC–AD 110.
const AXIS = [
  { from: -2200, to: -400, left: 0, right: 0.64 },
  { from: -400, to: -10, left: 0.64, right: 0.73 },
  { from: -10, to: 110, left: 0.73, right: 1 },
];
const TICKS: [number, string][] = [
  [-2000, "2000 BC"],
  [-1500, "1500"],
  [-1000, "1000"],
  [-500, "500 BC"],
  [1, "AD 1"],
  [50, "50"],
  [100, "AD 100"],
];
const RESTING = "Point at a lane: the light band is the time each part tells of, the dark line when it was written.";
const LAYOUT = { gutter: 132, lane: 30, top: 8, minWidth: 760 };

function yearToFraction(year: number): number {
  const piece = AXIS.find((p) => year >= p.from && year <= p.to) ?? (year < AXIS[0].from ? AXIS[0] : AXIS[2]);
  const t = (Math.min(Math.max(year, piece.from), piece.to) - piece.from) / (piece.to - piece.from);
  return piece.left + t * (piece.right - piece.left);
}

export function Timeline({ part, onChoose }: { part: PartId; onChoose: (id: PartId) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(LAYOUT.minWidth);
  const [pointed, setPointed] = useState<Part | null>(null);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const resize = new ResizeObserver(() => setWidth(Math.max(LAYOUT.minWidth, element.clientWidth)));
    resize.observe(element);
    return () => resize.disconnect();
  }, []);

  const { gutter, lane, top } = LAYOUT;
  const plot = width - gutter - 12;
  const height = top + PARTS.length * lane + 34;
  const bottom = top + PARTS.length * lane;
  const x = (year: number) => gutter + yearToFraction(year) * plot;
  const gapLeft = x(-400), gapRight = x(-10);

  return (
    <figure className="lib-timeline">
      <figcaption>
        <span className="lib-small-caps">Through time</span>
        <span>
          {pointed ? (
            <>
              <b style={{ color: `var(--${pointed.id})` }}>{pointed.name}</b> tells of {pointed.coversText}. Written {pointed.writtenText}.
            </>
          ) : (
            RESTING
          )}
        </span>
      </figcaption>
      <div ref={scroller} className="lib-timeline-scroll">
        <svg className="lib-timeline-svg" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" onPointerLeave={() => setPointed(null)}>
          <defs>
            <pattern id="lib-gap-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className="lib-hatch" />
            </pattern>
            <linearGradient id="lib-fade-left" x1="0" x2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset=".6" stopColor="#fff" stopOpacity="1" />
            </linearGradient>
            <mask id="lib-fade-mask">
              <rect x="0" y="0" width={x(-1700)} height={height} fill="url(#lib-fade-left)" />
              <rect x={x(-1700)} y="0" width={width} height={height} fill="#fff" />
            </mask>
          </defs>
          <rect x={gapLeft} y={top} width={gapRight - gapLeft} height={bottom - top} fill="url(#lib-gap-hatch)" />
          <text className="lib-tick-label" x={(gapLeft + gapRight) / 2} y={bottom + 26} textAnchor="middle">
            ~400 years between the Testaments
          </text>
          {TICKS.map(([year, label]) => (
            <g key={year}>
              <line className="lib-tick" x1={x(year)} x2={x(year)} y1={top} y2={bottom + 4} />
              <text className="lib-tick-label" x={x(year)} y={bottom + 14} textAnchor="middle">
                {label}
              </text>
            </g>
          ))}
          {PARTS.map((p, row) => {
            const y = top + row * lane, mid = y + lane / 2;
            const writtenLeft = x(p.written[0]), writtenRight = x(p.written[1]);
            return (
              <g
                key={p.id}
                className={p.id === part ? "lib-lane on" : "lib-lane"}
                style={{ "--tone": `var(--${p.id})` } as CSSProperties}
                onPointerEnter={() => setPointed(p)}
                onClick={() => onChoose(p.id)}
              >
                <rect className="lib-lane-hit" x="0" y={y} width={width} height={lane} />
                <text className="lib-lane-name" x={gutter - 12} y={mid + 4} textAnchor="end">
                  {p.name}
                </text>
                {p.covers && (
                  <>
                    <rect
                      className="lib-covers"
                      x={x(p.covers[0])}
                      y={mid - 8}
                      width={Math.max(x(p.covers[1]) - x(p.covers[0]), 4)}
                      height="16"
                      rx="3"
                      mask={p.coversFrom ? "url(#lib-fade-mask)" : undefined}
                    />
                    {p.coversFrom && (
                      <text className="lib-lane-note" x={gutter + 4} y={mid + 3.5}>
                        ← {p.coversFrom}
                      </text>
                    )}
                    {p.coversTo && <path className="lib-arrow" d={`M${x(p.covers[1]) + 2} ${mid}h8m-3-3 3 3-3 3`} />}
                  </>
                )}
                {writtenRight - writtenLeft < 3 ? (
                  <circle className="lib-written" cx={writtenLeft} cy={mid} r="3.5" />
                ) : (
                  <rect className="lib-written" x={writtenLeft} y={mid - 1.75} width={writtenRight - writtenLeft} height="3.5" rx="1.75" />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
