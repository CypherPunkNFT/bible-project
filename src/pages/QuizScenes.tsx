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
    <g className="qs-swell qs-sway-x"><path d="M14 160Q31 150 48 160T82 160T116 160T150 160T184 160T218 160T252 160T286 160" /><path className="qs-faint" d="M14 178Q31 168 48 178T82 178T116 178T150 178T184 178T218 178T252 178T286 178" /></g>
    <g className="qs-swell qs-sway-x" style={{ animationDelay: "-2.2s" }}><path d="M14 196Q31 186 48 196T82 196T116 196T150 196T184 196T218 196T252 196T286 196" /><path className="qs-faint" d="M14 214Q31 204 48 214T82 214T116 214T150 214T184 214T218 214T252 214T286 214" /></g>
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
    <g className="qs-twinkle"><circle className="qs-faint" cx="250" cy="52" r="11" /></g>
    <path className="qs-faint" d="M20 110C28.5 109.4 53.2 106.1 71.2 106.5C89.1 107 110.2 113.1 127.8 112.9C145.5 112.7 160 105.3 176.9 105.6C193.7 105.9 212.7 114.6 229 114.8C245.3 114.9 262.9 108 274.8 106.6C286.6 105.2 295.8 106.6 300 106.6" />
    <path className="qs-faint" d="M60 108L60 101.5M60 102.6L56.1 97.6M60 102L63.9 97.1" /><path className="qs-paper qs-faint" d="M49 97.6C51.8 92.1 67.7 91.6 71.5 97.1C64.4 99.3 55.6 99.3 49 97.6Z" />
    <path className="qs-faint" d="M226 115.7L226 111.2" /><path className="qs-paper qs-faint" d="M219.5 110.7C217 107.7 220 103.7 223.5 104.7C225 101.2 230 101.7 230.5 105.2C234 105.2 234.5 109.7 232 110.7Z" />
    <path className="qs-faint" d="M20 136C30 137 58.9 142.8 80.1 141.9C101.4 141 125.6 131 147.6 130.6C169.6 130.2 189.6 139.3 211.9 139.5C234.3 139.6 267.2 133 281.8 131.7C296.5 130.4 297 131.7 300 131.7" />
    <path className="qs-faint" d="M34 137.8L34 131.9" /><path className="qs-paper qs-faint" d="M24.9 131.2C21.4 127 25.6 121.4 30.5 122.8C32.6 117.9 39.6 118.6 40.3 123.5C45.2 123.5 45.9 129.8 42.4 131.2Z" />
    <path className="qs-faint" d="M280 132.7L280 124.2M280 125.7L274.8 119M280 125L285.2 118.2" /><path className="qs-paper qs-faint" d="M265 119C268.8 111.5 290.5 110.7 295.8 118.2C286 121.2 274 121.2 265 119Z" />
    <path className="qs-faint" d="M20 166C30.6 166.9 62.5 172.6 83.5 171.5C104.5 170.4 124.3 159.4 145.8 159.4C167.3 159.4 186.6 169.3 212.3 171.2C238 173.2 285.4 171.2 300 171.2" />
    <path d="M128.6 187C130.3 162.2 128.6 141.8 135.4 124.8M135.4 187C137.1 162.2 135.4 141.8 140.5 124.8" /><g className="qs-sway" style={{ transformOrigin: "137.9px 124.8px", animationDelay: "-1s" }}><path className="qs-accent" d="M137.9 124.8Q124.3 114.6 110.7 124.8M137.9 124.8Q131.1 107.8 117.5 104.4M137.9 124.8Q144.8 107.8 158.3 104.4M137.9 124.8Q151.5 114.6 166.8 126.5" /></g>
    <path d="M145.8 187C147.9 156.6 145.8 131.4 154.2 110.4M154.2 187C156.3 156.6 154.2 131.4 160.5 110.4" /><g className="qs-sway" style={{ transformOrigin: "157.3px 110.4px", animationDelay: "0s" }}><path className="qs-accent" d="M157.3 110.4Q140.5 97.8 123.8 110.4M157.3 110.4Q148.9 89.4 132.1 85.2M157.3 110.4Q165.8 89.4 182.6 85.2M157.3 110.4Q174.2 97.8 193.1 112.5" /></g>
    <path d="M181 187C182.5 165 181 147 187 132M187 187C188.5 165 187 147 191.5 132" /><g className="qs-sway" style={{ transformOrigin: "189.2px 132px", animationDelay: "-2s" }}><path className="qs-accent" d="M189.2 132Q177.2 123 165.2 132M189.2 132Q183.2 117 171.2 114M189.2 132Q195.2 117 207.2 114M189.2 132Q201.2 123 214.8 133.5" /></g>
    <ellipse className="qs-paper" cx="160" cy="187" rx="30" ry="5" />
    <g className="qs-ripple" style={{ transformOrigin: "160px 187px" }}><ellipse className="qs-faint" cx="160" cy="187" rx="16" ry="2.4" /></g>
    <path d="M20 204C37.9 204.9 89.8 210.6 127.4 209.2C164.9 207.8 216.5 198 245.3 195.7C274.1 193.4 290.9 195.7 300 195.7" />
    <path  d="M54 206.2L54 192.7M54 195.2L45.2 184M54 194L62.8 182.7" /><path className="qs-paper" d="M29 184C35.2 171.5 71.5 170.2 80.2 182.7C64 187.7 44 187.7 29 184Z" />
    <path d="M262 196.7L262 188" /><path className="qs-paper" d="M247.7 186.9C242.2 180.3 248.8 171.5 256.5 173.7C259.8 166 270.8 167.1 271.9 174.8C279.6 174.8 280.7 184.7 275.2 186.9Z" />
    <path className="qs-faint" d="M44 222Q58 218 72 222M150 226Q166 222 182 226M236 220Q250 216 264 220" />
  </>,
  whirlwind: <>
    <path className="qs-paper" d="M70 50Q66 30 88 30Q96 14 118 20Q134 6 156 16Q178 4 200 18Q224 12 234 32Q256 32 252 50Z" />
    <path className="qs-faint" d="M96 40Q118 33 140 39M176 35Q198 30 220 39" />
    <g className="qs-swirl" style={{ transformOrigin: "160px 120px" }}><path className="qs-accent qs-long" d="M98 58C98 69 222 69 222 58C222 47 110 60 110 74C110 83 221 83 221 74C221 64 116 77 116 89C116 97 214 97 214 89C214 81 117 94 117 104C117 112 201 112 201 104C201 97 119 112 119 120C119 126 190 126 190 120C190 114 127 129 127 136C127 140 185 140 185 136C185 131 139 146 139 151C139 155 184 155 184 151C184 147 150 163 150 166C150 169 182 169 182 166C182 164 154 179 154 182C154 184 173 184 173 182" /></g>
    <path className="qs-faint" d="M30 120Q50 112 70 118M250 92Q270 86 292 92M262 108Q278 104 296 108" />
    <path d="M20 206Q160 196 300 206" />
    <path className="qs-faint" d="M132 200Q146 190 160 197Q174 190 188 200M120 206Q130 200 140 204" />
    <g className="qs-rise">
      <g className="qs-flicker" style={{ transformOrigin: "246px 132px" }}><path className="qs-accent" d="M232 134C226 118 236 108 240 96C244 108 248 112 250 120C254 108 260 104 262 92C270 108 272 124 262 136Z" /></g>
      <path className="qs-paper" d="M222 158L226 134Q244 126 262 134L264 158Z" />
      <path className="qs-faint" d="M232 142H256" />
      <circle className="qs-paper" cx="244" cy="166" r="16" /><circle cx="244" cy="166" r="3" /><path d="M244 150V182M228 166H260M233 155L255 177M255 155L233 177" />
      <path className="qs-accent" d="M264 150Q280 146 290 136M264 158Q284 158 296 150" />
    </g>
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
    <path className="qs-faint" d="M176 198L186 188L192 178L204 172L210 160L224 154L236 142L252 138L262 130L280 128L294 120L312 118" />
    <path className="qs-faint" d="M206 186L222 182M226 168L240 164M268 148L286 146M298 136L310 134M290 172L306 170" />
    <path className="qs-tearfill" d="M236 198C236 184 242 172 252 170C262 168 272 176 274 190L276 198Z" />
    <circle className="qs-paper" cx="288" cy="186" r="13" />
    <path className="qs-faint" d="M20 198H312" />
    <g className="qs-ripple" style={{ transformOrigin: "110px 198px" }}><ellipse className="qs-faint" cx="110" cy="198" rx="34" ry="5" /></g>
    <g className="qs-ripple" style={{ transformOrigin: "110px 198px", animationDelay: "-1.3s" }}><ellipse cx="110" cy="198" rx="20" ry="3" /></g>
    <g className="qs-tear">
      <path className="qs-tearfill" d="M110 44C98 70 86 88 86 106C86 121 97 132 110 132C123 132 134 121 134 106C134 88 122 70 110 44Z" />
      <path className="qs-faint" d="M98 102C98 112 102 118 109 121" />
    </g>
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
