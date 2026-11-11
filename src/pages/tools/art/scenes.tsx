// The tools' drawings, one per tool, in the games' drawing style and with its parts (src/pages/games/art/parts.tsx:
// a 240 × 160 scene in front of the arched window, ground at y = 150, one slow living detail each). No SVG ids and no
// words inside a drawing: the hub holds ten of them, and a drawing is the same in every language.
import { at, hatch, shadow, spark } from "@/pages/games/art/draw";
import { P, T } from "@/pages/games/art/parts";

/** A cradle on rockers, a baby asleep under its hood, and a mobile of stars turning above. */
export function BabyNamesScene() {
  return <>
    <P d="M96 14V30M120 14V24M144 14V34M90 14H150" c="ga-f" />
    <g className="ga-bob">{[[96, 36, 5], [120, 30, 6], [144, 40, 5]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-t ga-l ga-twinkle" style={at(i)} />)}</g>
    <circle className="ga-p ga-l" cx={138} cy={90} r={8} />
    <P d="M134 89q2 1.6 4 0M140 89q2 1.6 4 0" c="ga-i" />
    <P d="M68 96H172L164 128H76Z" c="ga-p ga-l" />
    <P d="M68 96C68 72 84 60 104 60L112 96Z" c="ga-t ga-l" />
    <P d="M78 70C88 76 98 86 104 96" c="ga-f" />
    <P d="M114 100C128 96 150 96 168 100" c="ga-f" />
    <P d={hatch(80, 106, 82, 18, 4)} c="ga-h ga-sm-hide" />
    <P d="M120 110C116 105 110 108 113 113L120 119L127 113C130 108 124 105 120 110Z" c="ga-s" />
    <P d="M84 128L80 140M156 128L160 140" />
    <P d="M58 136C90 148 150 148 182 136" c="ga-l ga-bold" />
    <P d={shadow(120, 146, 58)} c="ga-h" />
  </>;
}

/** A birthday cake with one lit candle, and a calendar page with the day on it. */
export function BirthdayVersesScene() {
  return <>
    <rect className="ga-p ga-l" x={116} y={64} width={8} height={20} rx={1.5} />
    <P d="M120 64V58" c="ga-i" />
    <P d="M120 57C115 51 116 45 120 40C124 45 125 51 120 57Z" c="ga-t ga-l ga-flame" />
    <rect className="ga-p ga-l" x={92} y={84} width={56} height={20} rx={2} />
    <rect className="ga-p ga-l" x={72} y={104} width={96} height={30} rx={2} />
    <P d="M72 112q6 7 12 0t12 0t12 0t12 0t12 0t12 0t12 0t12 0M92 90q7 6 14 0t14 0t14 0t14 0" c="ga-f" />
    <P d={hatch(74, 118, 92, 14, 4)} c="ga-h ga-sm-hide" />
    <P d="M58 134H182" c="ga-l ga-bold" />
    <rect className="ga-p ga-l" x={170} y={64} width={36} height={40} rx={3} />
    <rect className="ga-s" x={170} y={64} width={36} height={10} rx={3} />
    <P d="M178 60v8M198 60v8" c="ga-i" />
    <T x={188} y={90} size={16}>12</T>
    {[[84, 54, 4], [154, 50, 3.4], [62, 82, 3]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(120, 136, 62)} c="ga-h" />
  </>;
}

/** A folded card standing open, a cross on its front and words inside, with two wedding rings before it. */
export function LifeEventsScene() {
  return <>
    <P d="M120 52L72 64V138L120 128Z" c="ga-t ga-l" />
    <P d="M120 52L176 62V136L120 128Z" c="ga-p ga-l" />
    <P d="M96 80V108M86 90H106" c="ga-i" />
    <P d="M130 76l36 5M130 86l36 5M130 96l30 4M130 106l22 3" c="ga-f" />
    <P d={hatch(122, 112, 50, 14, 4)} c="ga-h ga-sm-hide" />
    <circle className="ga-p ga-l" cx={88} cy={136} r={11} />
    <circle className="ga-l ga-bold" cx={104} cy={136} r={11} />
    <P d={spark(84, 121, 4.5)} c="ga-s ga-pulse" />
    {[[70, 108, 3], [140, 40, 3.6], [190, 70, 3]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(124, 146, 60)} c="ga-h" />
  </>;
}

/** A lit candle in a dish, a lily beside it and a sealed envelope: comfort sent to someone grieving. */
export function SympathyScene() {
  return <>
    <circle className="ga-t2 ga-pulse" cx={115} cy={56} r={18} />
    <rect className="ga-p ga-l" x={104} y={74} width={22} height={62} rx={2} />
    <P d={hatch(106, 82, 9, 52, 4)} c="ga-h ga-sm-hide" />
    <P d="M104 82q4 7 8 0" c="ga-f" />
    <P d="M115 74V68" c="ga-i" />
    <P d="M115 67C109 59 111 51 115 44C119 51 121 59 115 67Z" c="ga-t ga-l ga-flame" />
    <P d="M90 136H140L136 143H94Z" c="ga-p ga-l" />
    <P d="M76 143C76 122 78 106 82 92" />
    <P d="M77 126C66 120 62 110 64 100C72 106 76 116 77 126Z" c="ga-t ga-l" />
    <P d="M82 92C74 86 70 78 72 70C78 76 82 82 82 92ZM82 92C88 84 96 80 102 80C98 88 90 92 82 92ZM82 92C80 82 82 72 88 66C90 76 88 86 82 92Z" c="ga-p ga-l" />
    <rect className="ga-p ga-l" x={148} y={110} width={48} height={32} rx={2} />
    <P d="M148 110L172 128L196 110" />
    <circle className="ga-s" cx={172} cy={127} r={3} />
    <P d={shadow(124, 144, 66)} c="ga-h" />
  </>;
}

/** An umbrella held up against the rain, the ground beneath it dry. */
export function WhenYoureScene() {
  const drops = [[36, 60], [46, 86], [34, 112], [196, 62], [206, 90], [194, 116], [58, 40], [184, 38]];
  return <>
    {drops.map(([x, y], i) => <P key={i} d={`M${x} ${y}l-2 7`} c="ga-f ga-rain" style={at(i)} />)}
    <P d="M120 46V36" c="ga-l ga-bold" />
    <P d="M58 92C62 62 88 46 120 46C152 46 178 62 182 92C174 86 164 86 156 92C148 86 136 86 128 92C120 86 108 86 100 92C92 86 80 86 72 92C66 87 62 88 58 92Z" c="ga-t ga-l" />
    <P d="M120 46C110 60 104 76 100 92M120 46C130 60 136 76 140 92M120 46C98 56 82 72 72 92M120 46C142 56 158 72 168 92" c="ga-f" />
    <P d="M120 92V138C120 147 108 147 108 139" c="ga-l ga-bold" />
    <P d={hatch(84, 140, 72, 8, 5)} c="ga-h ga-sm-hide" />
    <P d={shadow(120, 146, 52)} c="ga-h" />
  </>;
}

/** An open book on a lectern, and a dove hovering over it. */
export function OccasionPrayersScene() {
  return <>
    <g className="ga-bob">
      <P d="M124 44C112 32 100 30 88 32C96 40 106 46 118 48Z" c="ga-t ga-l" />
      <P d="M106 50C114 42 130 40 140 46C144 42 150 42 154 44C150 46 148 50 144 52C134 58 116 58 106 52L92 56Z" c="ga-p ga-l" />
      <P d="M130 46C136 32 146 24 158 22C154 34 146 44 136 50Z" c="ga-t ga-l" />
      <circle className="ga-s" cx={148} cy={45} r={1.2} />
    </g>
    <P d="M88 98C100 90 112 90 120 96V80C112 74 100 74 88 82Z" c="ga-p ga-l" />
    <P d="M152 98C140 90 128 90 120 96V80C128 74 140 74 152 82Z" c="ga-p ga-l" />
    <P d="M94 84C102 80 110 80 116 84M94 90C102 86 110 86 116 90M124 84C130 80 138 80 146 84M124 90C130 86 138 86 146 90" c="ga-f" />
    <P d="M120 96C122 104 118 108 121 114" c="ga-l" />
    <P d="M82 100H158L150 110H90Z" c="ga-p ga-l" />
    <P d="M108 110L100 150M132 110L140 150M96 150H144" />
    <P d={hatch(106, 112, 26, 36, 4)} c="ga-h ga-sm-hide" />
    {[[70, 70, 3.4], [172, 76, 3], [184, 52, 2.6]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
  </>;
}

/** A small house with lit windows, a blessing framed above its door and smoke rising from the chimney. */
export function HomeBlessingsScene() {
  return <>
    {[0, 1, 2].map((i) => <P key={i} d={`M${153 + i * 4} 50c-4 -4 4 -8 0 -12`} c="ga-f ga-heat" style={at(i)} />)}
    <P d="M148 84V56H160V84" c="ga-p ga-l" />
    <P d="M72 150V98H168V150" c="ga-p ga-l" />
    <P d="M66 98L120 58L174 98Z" c="ga-t" />
    <P d="M60 102L120 56L180 102" c="ga-l ga-bold" />
    <P d={hatch(74, 132, 30, 16, 4)} c="ga-h ga-sm-hide" />
    <rect className="ga-p ga-l" x={102} y={102} width={36} height={10} rx={2} />
    <P d="M108 107H132" c="ga-f" />
    <P d="M108 150V124C108 116 132 116 132 124V150" c="ga-p ga-l" />
    <circle className="ga-s" cx={127} cy={138} r={1.5} />
    {[80, 142].map((x) => <g key={x}>
      <rect className="ga-s ga-pulse" x={x} y={114} width={18} height={18} rx={1} style={{ opacity: .45 }} />
      <rect className="ga-l" x={x} y={114} width={18} height={18} rx={1} />
      <P d={`M${x + 9} 114v18M${x} 123h18`} c="ga-f" />
    </g>)}
    <P d="M40 150H200" c="ga-l" />
  </>;
}

/** A phone showing a verse card, with hearts and a share arrow rising from it. */
export function VerseCardsScene() {
  return <>
    <rect className="ga-p ga-l" x={88} y={28} width={64} height={118} rx={9} />
    <rect className="ga-t" x={94} y={40} width={52} height={88} rx={3} />
    <P d="M114 34h12" c="ga-i" />
    <circle className="ga-f" cx={120} cy={137} r={3} />
    <rect className="ga-p ga-l" x={99} y={54} width={42} height={58} rx={2} />
    <P d="M105 66h30M105 74h26M105 82h30M105 90h18" c="ga-f" />
    <P d="M117 102h16" c="ga-i" />
    <g className="ga-pop" style={at(0)}><P d="M172 72C162 64 162 54 168 54C171 54 172 57 172 58C172 57 173 54 176 54C182 54 182 64 172 72Z" c="ga-s" /></g>
    <g className="ga-pop" style={at(1)}><P d="M160 104C170 102 178 96 182 86M176 85L182 86L183 92" c="ga-l ga-bold" /></g>
    <g className="ga-pop" style={at(2)}><P d="M68 64C61 58 61 51 65 51C67 51 68 53 68 54C68 53 69 51 71 51C75 51 75 58 68 64Z" c="ga-t ga-l" /></g>
    <P d={shadow(120, 148, 42)} c="ga-h" />
  </>;
}

/** An Advent wreath of four candles, the first one lit. */
export function CountdownsScene() {
  const candles = [[82, 92, 36], [106, 82, 46], [126, 82, 46], [150, 92, 36]];
  return <>
    {candles.map(([x, y, h], i) => <g key={x}>
      <rect className="ga-p ga-l" x={x} y={y} width={10} height={h} rx={1.5} />
      <P d={`M${x + 5} ${y}v-5`} c="ga-i" />
      {i === 0 && <P d={`M${x + 5} ${y - 6}C${x} ${y - 12} ${x + 1} ${y - 18} ${x + 5} ${y - 23}C${x + 9} ${y - 18} ${x + 10} ${y - 12} ${x + 5} ${y - 6}Z`} c="ga-t ga-l ga-flame" />}
    </g>)}
    <ellipse className="ga-t ga-l" cx={120} cy={130} rx={64} ry={14} />
    <P d="M62 128q5 -6 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0M70 138q5 -5 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0" c="ga-f" />
    {[[70, 124], [174, 126], [118, 144]].map(([x, y]) => <circle key={x} className="ga-s" cx={x} cy={y} r={2.2} />)}
    {[[64, 60, 3.4], [178, 66, 3], [170, 40, 2.6]].map(([x, y, r], i) => <P key={x} d={spark(x, y, r)} c="ga-f ga-twinkle" style={at(i)} />)}
    <P d={shadow(120, 144, 66)} c="ga-h" />
  </>;
}

/** A web page with a small church on it and the day's verse in a box, and the code that puts it there. */
export function VerseWidgetScene() {
  return <>
    <rect className="ga-p ga-l" x={46} y={30} width={148} height={106} rx={6} />
    <P d="M46 44H194" />
    {[56, 63, 70].map((x) => <circle key={x} className="ga-f" cx={x} cy={37} r={2} />)}
    <P d="M60 126V98L76 86L92 98V126Z" c="ga-t ga-l" />
    <P d="M76 86V70M71 75H81" c="ga-i" />
    <P d="M72 126V116C72 111 80 111 80 116V126" />
    <P d="M54 126H98" c="ga-f" />
    <rect className="ga-p ga-l" x={104} y={56} width={80} height={56} rx={3} />
    <circle className="ga-s ga-pulse" cx={174} cy={65} r={3.2} />
    <P d="M112 70h48M112 79h62M112 88h56M112 97h36" c="ga-f" />
    <P d="M126 118l-7 6l7 6M156 118l7 6l-7 6M146 116l-10 16" c="ga-i" />
    <P d={shadow(120, 140, 76)} c="ga-h" />
  </>;
}
