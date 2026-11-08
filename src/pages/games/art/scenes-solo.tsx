// The solo shelf's drawings: the homepage quiz, Verse completion and Bible twenty questions (style: parts.tsx).
import { at, hatch, shadow, spark } from "./draw";
import { P, T } from "./parts";

/** An open Bible, the curved lines of a page at heights 0..4. */
const pageLines = (left: number) => [0, 1, 2, 3, 4].map((i) => {
  const y = 92 + i * 6;
  return `M${left} ${y}C${left + 14} ${y - 6} ${left + 30} ${y - 6} ${left + 44} ${y}`;
}).join("");

/** An open Bible with light rising from it and a large question mark that floats above, among sparks. */
export function QuizScene() {
  return <>
    <P d="M58 90V126C80 118 104 119 120 127C136 119 160 118 182 126V90" />
    <P d="M64 122C80 114 104 114 120 122V86C104 78 80 78 64 86Z" c="ga-p ga-l" />
    <P d="M176 122C160 114 136 114 120 122V86C136 78 160 78 176 86Z" c="ga-p ga-l" />
    <P d={pageLines(70) + pageLines(126)} c="ga-f" />
    <P d="M128 122C130 130 127 138 131 146" c="ga-l ga-bold" />
    <P d="M98 78L90 70M142 78L150 70M84 86L74 82M156 86L166 82" c="ga-f" />
    <g className="ga-bob">
      <P d="M106 38C106 27 112 21 120 21C128 21 134 27 134 34C134 42 127 45 123 49C121 51 120 54 120 58" c="ga-l ga-heavy" />
      <circle className="ga-s" cx={120} cy={66} r={2.8} />
    </g>
    {[[84, 40, 4], [156, 34, 3.4], [166, 58, 2.6], [74, 60, 2.6]].map(([sx, sy, r], i) => <P key={i} d={spark(sx, sy, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(120, 128, 66)} c="ga-h" />
  </>;
}

/** An unrolled scroll of words with one line left blank, and a quill that writes it in. */
export function VerseCompletionScene() {
  return <>
    <P d="M46 38H194V124H46Z" c="ga-p ga-l" />
    {[32, 194].map((x) => <g key={x}>
      <rect className="ga-p ga-l" x={x} y={32} width={14} height={98} rx={7} /><P d={hatch(x + 2, 38, 6, 86, 4)} c="ga-h ga-sm-hide" />
      <P d={`M${x + 7} 27v5M${x + 7} 130v5`} c="ga-i" />
    </g>)}
    <P d="M58 54h22m6 0h30m6 0h18m6 0h36M58 66h14m6 0h40m6 0h24m6 0h30M58 78h30m6 0h20m6 0h44m6 0h10M58 90h26m6 0h22M58 102h34m6 0h28" c="ga-f" />
    <P d="M118 93H182" c="ga-f ga-dash" />
    <path className="ga-i ga-write" pathLength={1} d="M120 90h18m5 0h14m5 0h18" />
    <g className="ga-quill"><P d="M176 90C186 74 200 56 218 40C212 58 198 76 180 88Z" c="ga-t ga-l" /><P d="M184 80L204 54M190 74L212 46" c="ga-f" /></g>
    <P d={shadow(120, 134, 82)} c="ga-h" />
  </>;
}

/** A head in profile thinking of someone, the guesses appearing one by one, Yes and No to answer, and the count so far. */
export function TwentyQuestionsScene() {
  return <>
    <P d="M58 148C60 132 56 124 50 116C40 102 42 76 60 64C78 52 104 60 108 80C109 86 115 92 112 96C110 98 107 98 108 102C110 106 105 108 106 112C107 116 101 118 96 118C92 118 90 126 92 148" c="ga-p ga-l" />
    <P d="M66 92c-4 -6 4 -12 7 -6c2 4 -2 8 -5 8M98 82q3 -1 5 1" c="ga-i" />
    <P d="M50 84l8 -8M49 92l12 -12M50 100l14 -14M53 106l13 -13M57 110l11 -11" c="ga-h ga-sm-hide" />
    <circle className="ga-p ga-l" cx={118} cy={72} r={3} /><circle className="ga-p ga-l" cx={128} cy={60} r={5} />
    <P d="M138 50C132 38 144 26 156 30C160 18 182 18 186 30C198 26 210 38 202 50C208 60 196 70 186 64C180 74 160 74 156 66C144 72 132 62 138 50Z" c="ga-p ga-l" />
    {[[154, 14], [171, 19], [188, 14]].map(([x, size], i) => <g key={x} className="ga-pop" style={at(i)}><T x={x} y={48} size={size} c="ga-txt ga-tone">?</T></g>)}
    <rect className="ga-s" x={142} y={96} width={34} height={18} rx={9} /><T x={159} y={105.5} size={9} c="ga-txt ga-on">Yes</T>
    <rect className="ga-p ga-l" x={184} y={96} width={34} height={18} rx={9} /><T x={201} y={105.5} size={9}>No</T>
    {Array.from({ length: 10 }, (_, i) => <circle key={i} className={i < 4 ? "ga-s" : "ga-f"} cx={148 + i * 7.4} cy={130} r={2} />)}
  </>;
}
