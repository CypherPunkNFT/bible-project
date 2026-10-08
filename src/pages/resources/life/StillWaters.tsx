// Psalm 23:2 as line art beside the Help for life title: hills, still water whose ripples drift, a dove gliding slowly.
// The motion loops slowly and stops for anyone who asks for reduced motion (life.css).
const WAVE = "q 7 -3.2 14 0 t 14 0";
const wave = (x: number, y: number, pairs: number) => `M${x} ${y} ${Array.from({ length: pairs }, () => WAVE).join(" ")}`;

export function StillWaters() {
  return <figure className="lf-still" aria-label="Line drawing: still waters below green hills, a dove above">
    <svg viewBox="0 0 420 260" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g className="lf-sun"><circle cx="306" cy="74" r="22" /><path d="M306 38v-8 M306 118v-6 M270 74h-8 M350 74h-8 M281 49l-5 -5 M331 99l5 5 M331 49l5 -5" /></g>
      <path className="lf-hill lf-far" d="M0 140 C46 112 96 108 146 122 C196 136 236 104 290 108 C340 112 380 124 420 118" />
      <path className="lf-hill" d="M0 166 C60 134 128 138 186 152 C236 164 290 132 352 138 C384 141 404 148 420 150" />
      <path d="M0 180 C84 172 150 184 226 178 C300 172 360 176 420 180" />
      <g className="lf-reeds">
        <path d="M34 182 c-2 -18 -1 -30 3 -42 M42 183 c0 -14 2 -24 6 -32 M28 184 c-4 -10 -8 -18 -14 -24" /><path d="M37 140 c-2 -4 -1 -8 1 -10 M48 151 c2 -3 4 -5 6 -6" />
        <path d="M380 180 c1 -14 4 -24 8 -32 M388 181 c2 -10 5 -18 10 -24" />
      </g>
      <g className="lf-reflect"><path d="M120 196 C170 206 230 206 286 197" /><path d="M290 190 c8 3 24 3 32 0" /></g>
      <g className="lf-water"><path d={wave(48, 212, 7)} /><path d={wave(196, 222, 9)} /><path d={wave(70, 238, 10)} /><path d={wave(250, 246, 6)} /></g>
      <g className="lf-dove">
        <path d="M0 12 C10 7 24 7 34 11 C29 16 17 18 6 16 Z" /><circle cx="36" cy="10" r="2.6" /><path d="M38.5 10 l4 1.2 -4 1" />
        <path className="lf-wing" d="M14 9 C12 -4 20 -14 32 -18 C27 -9 25 -1 22 8" /><path d="M0 12 L-11 8 M1 14 L-11 15 M2 15 L-8 19" />
      </g>
    </svg>
    <figcaption>“he leadeth me beside the still waters.” <cite>Psalm 23:2</cite></figcaption>
  </figure>;
}
