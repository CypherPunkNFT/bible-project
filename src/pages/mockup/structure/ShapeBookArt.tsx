// The Structure page's heading drawing: an open Bible in line art whose right page turns into a row of chapter bars in
// the six parts' colours, rising and settling on a slow loop, with a ribbon marker swaying beneath. Still under
// reduced motion (structure-mockup.css).

/** Bars in canon order, coloured by part: a small echo of the chapter strip below. */
const BARS: { part: string; h: number }[] = [
  ["history", 30], ["history", 22], ["history", 36], ["history", 18], ["history", 27], ["history", 33],
  ["poetry", 40], ["poetry", 24], ["poetry", 16], ["prophets", 34], ["prophets", 26], ["prophets", 38], ["prophets", 14],
  ["gospels", 31], ["gospels", 28], ["epistles", 15], ["epistles", 20], ["revelation", 25],
].map(([part, h]) => ({ part: part as string, h: h as number }));
const TEXT_LINES = [64, 58, 70, 52, 66, 60, 48, 68, 56, 62];

export function ShapeBookArt() {
  return (
    <svg className="shape-art" viewBox="0 0 240 172" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {/* the page block beneath, three edges deep on each side */}
      {[0, 3, 6].map((d) => <path key={d} d={`M120 ${126 + d} C96 ${118 + d} 54 ${120 + d} ${18 - d / 2} ${130 + d} M120 ${126 + d} C144 ${118 + d} 186 ${120 + d} ${222 + d / 2} ${130 + d}`} strokeWidth={0.8} opacity={0.55 - d * 0.05} />)}
      {/* the two pages */}
      <path d="M120 34 C98 26 56 26 20 38 L18 130 C54 120 96 118 120 126 Z" strokeWidth={1.2} />
      <path d="M120 34 C142 26 184 26 220 38 L222 130 C186 120 144 118 120 126 Z" strokeWidth={1.2} />
      <path d="M120 34 L120 126" strokeWidth={0.9} opacity={0.6} />
      {/* left page: lines of text */}
      {TEXT_LINES.map((w, i) => <path key={i} d={`M${32} ${48 + i * 7.6} l${w} ${-0.9 + i * 0.05}`} strokeWidth={0.9} opacity={0.5} />)}
      {/* right page: the text becoming chapter bars */}
      <g className="shape-art-bars" stroke="none">
        {BARS.map((bar, i) => (
          <rect key={i} x={132 + i * 4.6} y={114 - bar.h} width={3} height={bar.h} rx={0.8}
            style={{ fill: `var(--${bar.part})`, animationDelay: `${(i * 0.18).toFixed(2)}s` }} />
        ))}
      </g>
      <path d="M130 116.5 C156 113 186 113 212 118" strokeWidth={0.7} opacity={0.5} />
      {[0, 1].map((i) => <path key={i} d={`M134 ${44 + i * 7} l${i ? 52 : 64} -1`} strokeWidth={0.9} opacity={0.5} />)}
      {/* the ribbon marker */}
      <path className="shape-art-ribbon" d="M121 30 C123 70 119 112 124 160 L128 152 L132 162 C126 112 129 70 125 30" strokeWidth={1} style={{ stroke: "var(--chart-color)", fill: "color-mix(in srgb, var(--chart-color) 35%, transparent)" }} />
    </svg>
  );
}
