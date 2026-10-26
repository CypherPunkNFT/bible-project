// MOCK-UP (home_mockup2): one line drawing per quiz question, in the convictions' style (gold line, paper fill, faint
// detail). Each draws itself in, then one part keeps moving (a swaying book, drifting cloud, falling sand, a flame). None
// gives the answer away. Styles: home-quiz.css (.qs-*).
import type { ReactNode } from "react";
import type { Scene } from "./quiz-data";

const books = (list: [number, number, number, number][]) => list.map(([x, y, w, h]) => <rect key={`${x}-${y}`} className="qs-paper" x={x} y={y} width={w} height={h} rx="1.5" />);

const SCENES: Record<Scene, ReactNode> = {
  shelf: <>
    <path d="M36 110H284M36 200H284M36 110V200M284 110V200" />
    {books([[60, 50, 14, 60], [74, 42, 16, 68], [90, 56, 12, 54], [102, 46, 18, 64], [120, 52, 13, 58], [158, 48, 16, 62], [174, 40, 14, 70], [188, 54, 18, 56], [206, 46, 12, 64], [218, 58, 15, 52], [233, 50, 14, 60], [247, 44, 16, 66]])}
    <g className="qs-sway" style={{ transformOrigin: "152px 110px" }}><rect className="qs-paper" x="138" y="52" width="14" height="58" rx="1.5" /></g>
    {books([[56, 138, 16, 62], [72, 148, 14, 52], [86, 132, 18, 68], [104, 142, 12, 58], [116, 136, 16, 64], [132, 150, 14, 50], [160, 188, 70, 12], [166, 176, 60, 12], [162, 164, 66, 12], [240, 140, 14, 60], [254, 132, 16, 68]])}
    <path className="qs-faint" d="M63 62H71M77 54H87M77 100H87M105 58H117M177 52H185M177 100H185M191 66H203M250 56H260M89 144H101M89 190H101M119 148H129M168 194H190M172 182H190M168 170H186M243 152H251M257 144H267" />
    <path className="qs-accent" d="M77 60H87M89 150H101" />
  </>,
  waters: <>
    <g className="qs-twinkle qs-faint"><circle cx="58" cy="44" r="1.4" /><circle cx="112" cy="28" r="1" /><circle cx="214" cy="36" r="1.4" /><circle cx="262" cy="62" r="1" /><circle cx="84" cy="88" r="1" /><circle cx="286" cy="24" r="1.2" /></g>
    <g className="qs-float"><path className="qs-accent" d="M136 96Q148 82 160 94Q172 82 184 96" strokeWidth="1.8" /></g>
    <g className="qs-drift">
      <path d="M-20 160Q0 150 20 160T60 160T100 160T140 160T180 160T220 160T260 160T300 160T340 160" />
      <path className="qs-faint" d="M-20 178Q0 168 20 178T60 178T100 178T140 178T180 178T220 178T260 178T300 178T340 178" />
      <path d="M-20 196Q0 186 20 196T60 196T100 196T140 196T180 196T220 196T260 196T300 196T340 196" />
      <path className="qs-faint" d="M-20 214Q0 204 20 214T60 214T100 214T140 214T180 214T220 214T260 214T300 214T340 214" />
    </g>
  </>,
  hourglass: <>
    <path d="M106 36H214M106 204H214M114 36V204M206 36V204" strokeWidth="2" />
    <path className="qs-paper" d="M126 44C126 98 156 108 156 120C156 132 126 142 126 196H194C194 142 164 132 164 120C164 108 194 98 194 44Z" />
    <path className="qs-sand" d="M136 78Q160 90 184 78L164 112H156Z" />
    <path className="qs-sand" d="M132 196Q160 162 188 196Z" />
    <path className="qs-stream qs-accent" d="M160 116V190" />
    <path className="qs-faint" d="M70 120H96M224 120H250M82 90L98 100M238 100L254 90M82 150L98 140M238 140L254 150" />
  </>,
  tents: <>
    <path d="M20 200H300" />
    <path className="qs-faint" d="M30 214Q90 204 150 214T290 212M40 186Q70 180 98 186" />
    <path className="qs-paper" d="M48 200L86 140L124 200Z" /><path d="M86 140L80 200M74 200L86 176L96 200" />
    <path className="qs-paper" d="M132 200L164 152L196 200Z" /><path d="M164 152L158 200" />
    <path className="qs-paper" d="M200 200L226 162L252 200Z" />
    <g className="qs-float">
      <path className="qs-paper" d="M232 112Q220 100 232 90Q232 72 252 74Q264 62 278 74Q296 76 292 94Q302 106 288 114Z" />
      <path className="qs-faint" d="M246 114Q244 140 256 160M268 114Q272 138 262 162" />
    </g>
    <g className="qs-twinkle qs-faint"><circle cx="60" cy="50" r="1.2" /><circle cx="110" cy="34" r="1" /><circle cx="170" cy="58" r="1.2" /><circle cx="40" cy="96" r="1" /></g>
  </>,
  whirlwind: <>
    <path d="M14 204L96 128L140 162L196 112L306 204" />
    <path className="qs-faint" d="M70 160L96 128L112 146M180 128L196 112L216 134" />
    <g className="qs-spin" style={{ transformOrigin: "214px 66px" }}>
      <path className="qs-accent" d="M170 30Q214 20 258 30M178 46Q214 38 250 46M188 62Q214 56 240 62M196 78Q214 74 232 78M204 94Q214 91 224 94M210 108Q214 106 218 108" />
    </g>
    <g className="qs-fall"><path className="qs-paper" d="M122 120Q132 112 144 118L150 142Q136 150 122 144Z" /><path className="qs-faint" d="M128 124L132 144M138 120L142 144" /></g>
  </>,
  crown: <>
    <path className="qs-paper" d="M76 190Q160 168 244 190Q160 214 76 190Z" />
    <path className="qs-paper" d="M104 176L96 112L132 140L160 96L188 140L224 112L216 176Z" />
    <path d="M104 160H216" />
    <circle className="qs-accent" cx="160" cy="92" r="4" /><circle cx="96" cy="108" r="3" /><circle cx="224" cy="108" r="3" />
    <path className="qs-faint" d="M124 168H136M154 168H166M184 168H196" />
    <path d="M250 204L282 70" strokeWidth="2" />
    <circle className="qs-paper" cx="284" cy="62" r="8" />
    <g className="qs-twinkle qs-accent"><path d="M284 40V48M284 76V84M262 62H270M298 62H306" /></g>
  </>,
  lamp: <>
    <path className="qs-paper" d="M96 170C96 146 128 136 160 136C194 136 214 146 232 154L268 148C276 148 278 158 270 162L240 172C222 184 194 190 160 190C126 190 96 184 96 170Z" />
    <ellipse className="qs-paper" cx="158" cy="148" rx="16" ry="5" />
    <path d="M98 162C76 156 74 184 98 180M140 190L136 200H184L180 190M262 152L270 160" />
    <path className="qs-faint" d="M116 170Q160 180 214 168M150 120L146 112M166 120L170 112" />
    <g className="qs-flicker" style={{ transformOrigin: "270px 148px" }}><path className="qs-accent" d="M270 146C258 132 264 116 274 100C284 118 288 134 270 146Z" /><path className="qs-faint" d="M271 140C267 132 269 126 273 120" /></g>
    <g className="qs-twinkle qs-faint"><path d="M274 84V74M252 96L244 90M296 96L304 90M244 122H234M300 122H310" /></g>
    <path className="qs-faint" d="M30 218Q160 202 300 222M56 210H78M214 214H236" />
  </>,
  scroll: <>
    <path className="qs-paper" d="M74 64H246V196H74Z" />
    <path d="M68 56V204M252 56V204" strokeWidth="2.4" /><path d="M62 52H74M62 208H74M246 52H258M246 208H258" />
    <path className="qs-faint" d="M96 84H140M104 98H140M92 112H140M100 126H140M96 140H136M150 84H194M150 98H186M150 112H192M150 126H182M150 140H190M204 84H230M204 98H226M204 112H232M204 126H222" />
    <path className="qs-faint qs-dots" d="M146 76V176M198 76V176" />
    <g className="qs-write"><path className="qs-accent" d="M226 132L262 84Q270 78 266 90L232 138Z" /></g>
  </>,
  loaves: <>
    <g className="qs-twinkle qs-faint"><circle cx="40" cy="70" r="1.2" /><circle cx="52" cy="76" r="1.2" /><circle cx="64" cy="70" r="1.2" /><circle cx="250" cy="60" r="1.2" /><circle cx="262" cy="66" r="1.2" /><circle cx="274" cy="60" r="1.2" /><circle cx="286" cy="66" r="1.2" /><circle cx="46" cy="90" r="1.2" /><circle cx="270" cy="82" r="1.2" /></g>
    <path className="qs-faint" d="M20 120Q80 96 150 112T300 104" />
    <path className="qs-paper" d="M112 164Q124 140 146 164Z" /><path className="qs-paper" d="M138 164Q154 134 174 164Z" /><path className="qs-paper" d="M166 164Q184 142 200 164Z" />
    <path className="qs-paper" d="M88 164Q88 206 156 206Q224 206 224 164Z" />
    <path className="qs-faint" d="M96 176H216M104 188H208M120 164L116 204M156 164V206M192 164L196 204" />
    <g className="qs-wiggle" style={{ transformOrigin: "262px 196px" }}><path className="qs-paper" d="M236 196Q252 184 272 196Q252 208 236 196Z" /><path d="M272 196L284 188V204Z" /><circle className="qs-accent" cx="244" cy="194" r="1.4" /></g>
    <path className="qs-faint" d="M40 212H300" />
  </>,
  tomb: <>
    <path className="qs-paper" d="M24 204Q52 112 160 102Q268 112 296 204Z" />
    <path d="M128 204V166A32 32 0 0 1 192 166V204" />
    <path className="qs-faint" d="M70 150Q90 140 104 150M222 140Q238 132 256 142M136 204V170A24 24 0 0 1 184 170V204" />
    <circle className="qs-paper" cx="228" cy="178" r="26" /><path className="qs-faint" d="M216 168Q228 160 240 170" />
    <path className="qs-faint" d="M40 210L44 200M52 210L50 198M276 210L280 198M288 210L286 200" />
    <g className="qs-drip"><path className="qs-accent" d="M160 30C154 42 152 48 160 52C168 48 166 42 160 30Z" /></g>
  </>,
  colonnade: <>
    <path d="M40 204H280M50 196H270M60 188H260" />
    <path className="qs-paper" d="M60 96L160 54L260 96Z" /><path d="M66 96H254M66 104H254" />
    <path className="qs-paper" d="M78 104H90V188H78ZM118 104H130V188H118ZM158 104H170V188H158ZM198 104H210V188H198ZM238 104H250V188H238Z" />
    <path className="qs-faint" d="M84 110V182M124 110V182M164 110V182M204 110V182M244 110V182M144 82L160 72L176 82" />
    <g className="qs-fly"><path className="qs-accent" d="M30 40Q36 34 42 40Q48 34 54 40" /><path className="qs-faint" d="M58 56Q62 52 66 56Q70 52 74 56" /></g>
  </>,
  letters: <>
    <g transform="rotate(-8 130 160)"><rect className="qs-paper" x="74" y="128" width="112" height="70" rx="2" /></g>
    <g transform="rotate(5 140 150)"><rect className="qs-paper" x="82" y="116" width="112" height="70" rx="2" /><path className="qs-faint" d="M94 132H160M94 144H176M94 156H168M94 168H150" /></g>
    <rect className="qs-paper" x="96" y="104" width="112" height="70" rx="2" /><path d="M96 104L152 142L208 104" />
    <circle className="qs-accent" cx="152" cy="142" r="7" />
    <path className="qs-paper" d="M226 204H268V178Q268 168 258 168H236Q226 168 226 178Z" /><path d="M234 168V160H260V168" />
    <g className="qs-sway" style={{ transformOrigin: "246px 164px" }}><path className="qs-paper" d="M246 164Q256 108 300 66Q284 104 250 162Z" /><path className="qs-faint" d="M254 140L272 128M262 116L282 104" /></g>
    <path className="qs-faint" d="M40 210H300" />
  </>,
  verdict: <>
    <g className="qs-twinkle qs-accent"><path d="M160 26V44M110 40L120 56M210 40L200 56M76 70L92 80M244 70L228 80" /></g>
    <path className="qs-paper" d="M60 186Q110 170 160 184Q210 170 260 186V104Q210 88 160 102Q110 88 60 104Z" />
    <path d="M160 102V184" />
    <path className="qs-faint" d="M78 118Q112 108 146 116M78 132Q112 122 146 130M78 146Q112 136 146 144M78 160Q112 150 146 158M174 116Q208 108 242 118M174 130Q208 122 242 132M174 144Q208 136 242 146M174 158Q208 150 242 160" />
    <path className="qs-accent" d="M196 184V210L204 202L212 210V184" />
    <path className="qs-faint" d="M40 214H280" />
  </>,
};

/** The drawing for one question, redrawn whenever the question changes; `bare` gives just the strokes, for a drawing that
 *  frames it inside its own 320 × 240 space (QuizArt.tsx). */
export function QuizScene({ scene, bare }: { scene: Scene; bare?: boolean }) {
  const strokes = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (bare) return <g className="qs-scene qs-bare" {...strokes}>{SCENES[scene]}</g>;
  return <svg className="qs-scene" viewBox="0 0 320 240" {...strokes} aria-hidden="true">{SCENES[scene]}</svg>;
}
