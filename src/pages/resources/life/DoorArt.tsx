// Matthew 11:28 as line art beside the Help for life title (owner's choice, 2026-10-08: round 2, drawing 1, "Door, with
// Jesus"): a small stone house at night with Jesus standing in the open doorway as a solid, softly lit figure, arms open,
// light falling from the doorway's edges; a plain sun with turning rays, a flock crossing through its top rays, stars,
// low hills meeting the walls, a tree in front of the house's right side, grass and swaying flowers. 320 × 240.
// Generated from design/help-for-life-drawings-2 (scenes.js, ART.doorSolid) as static markup; styles in life.css (.lf-door).
// Every motion loops slowly and stops for anyone who asks for reduced motion.
import type { CSSProperties } from "react";

export function DoorArt() {
  return <figure className="lf-door" aria-label="Line drawing: Jesus standing in the open doorway of a small stone house at night, his arms open, warm light falling across the ground; a sun, stars and birds above, a tree and flowers beside the house">
    <svg viewBox="0 0 320 240" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <defs>
      <radialGradient id="lfd-glow">
        <stop offset="0" style={{ stopColor: "var(--c)", stopOpacity: "0.5" } as CSSProperties} />
        <stop offset=".5" style={{ stopColor: "var(--c)", stopOpacity: "0.2" } as CSSProperties} />
        <stop offset="1" style={{ stopColor: "var(--c)", stopOpacity: "0" } as CSSProperties} />
      </radialGradient>
    </defs>
    <circle className="lfd-star" style={{ "--i": "0" } as CSSProperties} cx={12} cy={26} r={1} />
    <circle className="lfd-star" style={{ "--i": "1" } as CSSProperties} cx={40} cy={14} r={1.2} />
    <circle className="lfd-star" style={{ "--i": "2" } as CSSProperties} cx={70} cy={34} r={0.9} />
    <circle className="lfd-star" style={{ "--i": "3" } as CSSProperties} cx={96} cy={18} r={1} />
    <circle className="lfd-star" style={{ "--i": "4" } as CSSProperties} cx={124} cy={8} r={0.8} />
    <circle className="lfd-star" style={{ "--i": "5" } as CSSProperties} cx={190} cy={12} r={1} />
    <circle className="lfd-star" style={{ "--i": "6" } as CSSProperties} cx={204} cy={40} r={0.8} />
    <circle className="lfd-star" style={{ "--i": "7" } as CSSProperties} cx={226} cy={22} r={1.2} />
    <circle className="lfd-star" style={{ "--i": "8" } as CSSProperties} cx={252} cy={10} r={1} />
    <circle className="lfd-star" style={{ "--i": "9" } as CSSProperties} cx={276} cy={34} r={1.1} />
    <circle className="lfd-star" style={{ "--i": "10" } as CSSProperties} cx={300} cy={18} r={1} />
    <circle className="lfd-star" style={{ "--i": "11" } as CSSProperties} cx={314} cy={52} r={0.9} />
    <circle className="lfd-star" style={{ "--i": "12" } as CSSProperties} cx={262} cy={66} r={0.8} />
    <circle className="lfd-star" style={{ "--i": "13" } as CSSProperties} cx={236} cy={80} r={0.8} />
    <circle className="lfd-star" style={{ "--i": "14" } as CSSProperties} cx={300} cy={86} r={0.9} />
    <circle className="lfd-star" style={{ "--i": "15" } as CSSProperties} cx={190} cy={50} r={0.7} />
    <circle className="lfd-sun" cx={158} cy={41} r={12.5} />
    <g className="lfd-t lfd-sunrays">
      <path d="M174 41L182 41" />
      <path d="M171.9 49L176.2 51.5" />
      <path d="M166 54.9L170 61.8" />
      <path d="M158 57L158 62" />
      <path d="M150 54.9L146 61.8" />
      <path d="M144.1 49L139.8 51.5" />
      <path d="M142 41L134 41" />
      <path d="M144.1 33L139.8 30.5" />
      <path d="M150 27.1L146 20.2" />
      <path d="M158 25L158 20" />
      <path d="M166 27.1L170 20.2" />
      <path d="M171.9 33L176.2 30.5" />
    </g>
    <path className="lfd-f" d="M0 166C20 158 42 157 63 170" />
    <path className="lfd-f" d="M253 170C274 157 296 158 320 166" />
    <g className="lfd-flock-cross">
      <path d="M0 0c1.8 -2.7 4.5 -3.6 6.3 -0.9c1.8 -2.7 4.5 -2.7 6.3 0.9" />
      <path d="M16 -5c1.4 -2.0999999999999996 3.5 -2.8 4.8999999999999995 -0.7c1.4 -2.0999999999999996 3.5 -2.0999999999999996 4.8999999999999995 0.7" />
      <path d="M11 5c1.3 -1.9500000000000002 3.25 -2.6 4.55 -0.65c1.3 -1.9500000000000002 3.25 -1.9500000000000002 4.55 0.65" />
    </g>
    <g transform="translate(30 0)">
      <path className="lfd-pf" d="M22 69H234V76H223V200H33V76H22Z" />
      <path d="M22 76H234" />
      <path d="M27 69H229" />
      <path d="M22 76L27 69M234 76L229 69" />
      <path className="lfd-f" d="M44 80v4M64 80v4M84 80v4M172 80v4M192 80v4M212 80v4" />
      <path d="M33 76V200" />
      <path d="M223 76V200" />
      <path className="lfd-f" d="M38 108h20M42 150h16M46 180h22M174 112h30M188 150h24M168 184h20M86 92h24M150 92h26" />
      <path d="M58 138V116C58 110 63 106 69 106C75 106 80 110 80 116V138Z" />
      <path className="lfd-ft" d="M69 109V137M60 122H78" />
      <path d="M55 139H83" />
      <g className="lfd-glow-door">
        <ellipse cx={128} cy={150} rx={46} ry={64} fill="url(#lfd-glow)" stroke="none" />
        <ellipse cx={128} cy={214} rx={60} ry={16} fill="url(#lfd-glow)" stroke="none" />
      </g>
      <path d="M105 200V128C105 114 115 105 128 105C141 105 151 114 151 128V200" />
      <path d="M151 200L143 195V110.2" />
      <path className="lfd-f" d="M147 191V122" />
      <g className="lfd-spill">
        <path className="lfd-t" d="M105 200L64 240" />
        <path className="lfd-t" d="M151 200L194 240" />
        <path className="lfd-ft" d="M116.5 200L96 240M128 200V240M139.5 200L160 240" />
      </g>
      <path className="lfd-solid" d="M122.6 127.6C121 131 119.6 134 117.6 137C112 147 106 154 99 159C96.5 160.5 97 164.5 100.5 164.6C102 164.5 103 163.8 104 163C111 158 116 153 119.6 148.6C117 166 114 184 112 200C120 202 136 202 144 200C142 184 139 166 136.4 148.6C140 153 145 158 152 163C153 163.8 154 164.5 155.5 164.6C159 164.5 159.5 160.5 157 159C150 154 144 147 138.4 137C136.4 134 135 131 133.4 127.6A6.4 6.4 0 1 0 122.6 127.6Z" />
      <path className="lfd-fold" d="M121.4 142C126 151 133 160 139 175M124.6 156C123.8 172 123 186 122.6 199M132.6 158C133.4 172 134 186 134.6 199M117.6 137C121 134.6 124 134 128 134C132 134 135 134.6 138.4 137" />
      <circle className="lfd-mote" style={{ "--i": "0" } as CSSProperties} cx={108} cy={236} r={1} fill="currentColor" />
      <circle className="lfd-mote" style={{ "--i": "1" } as CSSProperties} cx={117} cy={231} r={1} fill="currentColor" />
      <circle className="lfd-mote" style={{ "--i": "2" } as CSSProperties} cx={126} cy={226} r={1} fill="currentColor" />
      <circle className="lfd-mote" style={{ "--i": "3" } as CSSProperties} cx={135} cy={221} r={1} fill="currentColor" />
      <circle className="lfd-mote" style={{ "--i": "4" } as CSSProperties} cx={144} cy={216} r={1} fill="currentColor" />
      <circle className="lfd-mote" style={{ "--i": "5" } as CSSProperties} cx={113} cy={233} r={1} fill="currentColor" />
      <circle className="lfd-mote" style={{ "--i": "6" } as CSSProperties} cx={122} cy={228} r={1} fill="currentColor" />
      <path d="M78 200L80 187H94L96 200" />
      <path className="lfd-plant" d="M87 187C85 179 80 175 74 175M87 187C88 179 92 174 98 173M87 187V177" />
    </g>
    <path d="M4 200H135M181 200H316" />
    <path className="lfd-pf" d="M282 200C285 188 279 178 283 166C285 158 281 150 282 142H291C292 150 289 158 290 166C293 178 288 188 290 200Z" />
    <path d="M282 200C285 188 279 178 283 166C285 158 281 150 282 142" />
    <path d="M290 200C288 188 293 178 290 166C289 158 292 150 291 142" />
    <path className="lfd-f" d="M286 196C287 186 284 176 287 168" />
    <g className="lfd-crown">
      <path className="lfd-pf" d="M262 142C250 140 248 126 258 122C256 110 268 102 280 106C286 96 304 98 308 108C320 110 322 126 314 132C316 142 304 148 296 144C288 150 272 150 262 142Z" />
      <path className="lfd-canopy" d="M262 142C250 140 248 126 258 122C256 110 268 102 280 106C286 96 304 98 308 108C320 110 322 126 314 132C316 142 304 148 296 144C288 150 272 150 262 142Z" />
      <path className="lfd-f lfd-leafdash" d="M266 128l5-3M276 116l5 1M292 110l4 3M302 122l5-2M284 132l5 2M296 134l4-3M272 138l4 1M288 122l-3 4" />
    </g>
    <path className="lfd-tuft" d="M10 200c-1 -3 -3 -5 -5 -6M10 200c0 -4 1 -7 2 -9M10 200c2 -2 4 -4 6 -5" />
    <path className="lfd-tuft" d="M34 233c-0.7 -2.0999999999999996 -2.0999999999999996 -3.5 -3.5 -4.199999999999999M34 233c0 -2.8 0.7 -4.8999999999999995 1.4 -6.3M34 233c1.4 -1.4 2.8 -2.8 4.199999999999999 -3.5" />
    <path className="lfd-tuft" d="M22 239c-0.8 -2.4000000000000004 -2.4000000000000004 -4 -4 -4.800000000000001M22 239c0 -3.2 0.8 -5.6000000000000005 1.6 -7.2M22 239c1.6 -1.6 3.2 -3.2 4.800000000000001 -4" />
    <path className="lfd-tuft" d="M240 201c-0.8 -2.4000000000000004 -2.4000000000000004 -4 -4 -4.800000000000001M240 201c0 -3.2 0.8 -5.6000000000000005 1.6 -7.2M240 201c1.6 -1.6 3.2 -3.2 4.800000000000001 -4" />
    <path className="lfd-tuft" d="M262 200c-0.7 -2.0999999999999996 -2.0999999999999996 -3.5 -3.5 -4.199999999999999M262 200c0 -2.8 0.7 -4.8999999999999995 1.4 -6.3M262 200c1.4 -1.4 2.8 -2.8 4.199999999999999 -3.5" />
    <path className="lfd-tuft" d="M170 201c-0.7 -2.0999999999999996 -2.0999999999999996 -3.5 -3.5 -4.199999999999999M170 201c0 -2.8 0.7 -4.8999999999999995 1.4 -6.3M170 201c1.4 -1.4 2.8 -2.8 4.199999999999999 -3.5" />
    <path className="lfd-tuft" d="M204 200c-0.6 -1.7999999999999998 -1.7999999999999998 -3 -3 -3.5999999999999996M204 200c0 -2.4 0.6 -4.2 1.2 -5.3999999999999995M204 200c1.2 -1.2 2.4 -2.4 3.5999999999999996 -3" />
    <path className="lfd-tuft" d="M70 222c-0.8 -2.4000000000000004 -2.4000000000000004 -4 -4 -4.800000000000001M70 222c0 -3.2 0.8 -5.6000000000000005 1.6 -7.2M70 222c1.6 -1.6 3.2 -3.2 4.800000000000001 -4" />
    <path className="lfd-tuft" d="M90 231c-0.7 -2.0999999999999996 -2.0999999999999996 -3.5 -3.5 -4.199999999999999M90 231c0 -2.8 0.7 -4.8999999999999995 1.4 -6.3M90 231c1.4 -1.4 2.8 -2.8 4.199999999999999 -3.5" />
    <path className="lfd-tuft" d="M238 224c-0.8 -2.4000000000000004 -2.4000000000000004 -4 -4 -4.800000000000001M238 224c0 -3.2 0.8 -5.6000000000000005 1.6 -7.2M238 224c1.6 -1.6 3.2 -3.2 4.800000000000001 -4" />
    <path className="lfd-tuft" d="M258 232c-0.7 -2.0999999999999996 -2.0999999999999996 -3.5 -3.5 -4.199999999999999M258 232c0 -2.8 0.7 -4.8999999999999995 1.4 -6.3M258 232c1.4 -1.4 2.8 -2.8 4.199999999999999 -3.5" />
    <g className="lfd-bloom" style={{ transformOrigin: "58px 230px", "--i": "0" } as CSSProperties}>
      <path className="lfd-stem" d="M58 230C58 224 57 220.4 56 218" />
      <circle className="lfd-blue lfd-petal" cx={56} cy={213.4} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={58.5} cy={215.2} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={57.5} cy={218.1} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={54.5} cy={218.1} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={53.5} cy={215.2} r={1.5} />
      <circle className="lfd-heart" cx={56} cy={216} r={1} />
    </g>
    <g className="lfd-bloom" style={{ transformOrigin: "78px 238px", "--i": "1" } as CSSProperties}>
      <path className="lfd-stem" d="M78 238C78 233.5 79 230.8 80 229" />
      <circle className="lfd-violet lfd-petal" cx={80} cy={224.4} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={82.5} cy={226.2} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={81.5} cy={229.1} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={78.5} cy={229.1} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={77.5} cy={226.2} r={1.5} />
      <circle className="lfd-heart" cx={80} cy={227} r={1} />
    </g>
    <g className="lfd-bloom" style={{ transformOrigin: "48px 238px", "--i": "2" } as CSSProperties}>
      <path className="lfd-stem" d="M48 238C48 234 48.5 231.6 49 230" />
      <circle className="lfd-blue lfd-petal" cx={49} cy={225.4} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={51.5} cy={227.2} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={50.5} cy={230.1} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={47.5} cy={230.1} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={46.5} cy={227.2} r={1.5} />
      <circle className="lfd-heart" cx={49} cy={228} r={1} />
    </g>
    <g className="lfd-bloom" style={{ transformOrigin: "250px 228px", "--i": "3" } as CSSProperties}>
      <path className="lfd-stem" d="M250 228C250 222.5 251 219.2 252 217" />
      <circle className="lfd-violet lfd-petal" cx={252} cy={212.4} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={254.5} cy={214.2} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={253.5} cy={217.1} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={250.5} cy={217.1} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={249.5} cy={214.2} r={1.5} />
      <circle className="lfd-heart" cx={252} cy={215} r={1} />
    </g>
    <g className="lfd-bloom" style={{ transformOrigin: "272px 236px", "--i": "4" } as CSSProperties}>
      <path className="lfd-stem" d="M272 236C272 231.5 271 228.8 270 227" />
      <circle className="lfd-blue lfd-petal" cx={270} cy={222.4} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={272.5} cy={224.2} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={271.5} cy={227.1} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={268.5} cy={227.1} r={1.5} />
      <circle className="lfd-blue lfd-petal" cx={267.5} cy={224.2} r={1.5} />
      <circle className="lfd-heart" cx={270} cy={225} r={1} />
    </g>
    <g className="lfd-bloom" style={{ transformOrigin: "288px 230px", "--i": "5" } as CSSProperties}>
      <path className="lfd-stem" d="M288 230C288 226 288.5 223.6 289 222" />
      <circle className="lfd-violet lfd-petal" cx={289} cy={217.4} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={291.5} cy={219.2} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={290.5} cy={222.1} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={287.5} cy={222.1} r={1.5} />
      <circle className="lfd-violet lfd-petal" cx={286.5} cy={219.2} r={1.5} />
      <circle className="lfd-heart" cx={289} cy={220} r={1} />
    </g>
    </svg>
    <figcaption>“Come unto me, all ye that labour and are heavy laden, and I will give you rest.” <cite>Matthew 11:28</cite></figcaption>
  </figure>;
}
