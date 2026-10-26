// The section's hero drawing, in the engraved manner of the creeds collection's manuscript: an open
// codex with a doctrine being worked out on the left page and the lines still to be written on the
// right, under a compass arc and a quill. Anselm's phrase for what the work is — faith seeking
// understanding. The drawing carries no information a reader needs, so it is hidden from assistive
// technology and every label in it is decorative.
export function TheologyArt() {
  return <svg className="th-hero-art" viewBox="0 0 520 440" fill="none" aria-hidden="true">
    <defs><radialGradient id="th-glow"><stop stopColor="currentColor" stopOpacity=".1" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></radialGradient></defs>
    <circle cx="260" cy="212" r="205" fill="url(#th-glow)" />
    <g stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="260" cy="212" r="168" strokeDasharray="1 9" opacity=".45" />
      <path d="M96 246V186a164 164 0 0 1 328 0v60" opacity=".26" />

      {/* the codex: two leaves meeting at the spine, with the block of pages beneath */}
      <path d="M260 148v196" opacity=".55" />
      <path d="M260 148 118 166v170l142-16z" fill="var(--th-paper)" />
      <path d="M260 148l142 18v170l-142-16z" fill="var(--th-paper)" />
      <path d="M118 336l-14 10 156 18 156-18-14-10" opacity=".7" />
      <path d="M111 341l-7 5m308-5 7 5" opacity=".4" />

      {/* left leaf: the shield of the Trinity, half drawn */}
      <g opacity=".85">
        <path d="M189 191v63m0 0-36 44m36-44 36 44" strokeDasharray="3 5" opacity=".6" />
        <circle cx="189" cy="184" r="15" fill="var(--th-paper)" />
        <circle cx="189" cy="262" r="12" fill="var(--th-paper)" />
        <circle cx="151" cy="306" r="12" fill="var(--th-paper)" />
        <circle cx="227" cy="306" r="12" fill="var(--th-paper)" strokeDasharray="2 4" />
        <path d="M151 306h-11m87 0h11" opacity=".35" />
      </g>

      {/* right leaf: ruled lines, the last of them unfinished */}
      <path d="M288 188h92m-92 15h88m-88 15h93m-93 15h78m-78 15h90m-90 15h86m-86 15h41" opacity=".55" />
      <path d="M288 173h52" strokeWidth="2.2" opacity=".75" />
      <path d="M288 300h76m-76 14h58" opacity=".3" />

      {/* the quill, resting where the writing stopped */}
      <path d="M333 248c20-44 41-88 92-120-6 46-30 80-62 97m-16 36 48-108m-28 65 2-33m7 16 23-11" />

      {/* compass arc and small marginal marks, as in the creeds drawing */}
      <path d="M86 150h16m-8-8v16M418 290h15m-7-7v14M138 372l3 8 8 3-8 3-3 8-3-8-8-3 8-3zM396 118l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM236 58v16m-7-8h14" />
    </g>
    <text x="260" y="105" textAnchor="middle" fill="currentColor" fontFamily="Georgia, serif" fontSize="28" letterSpacing="5">THEOLOGIA</text>
    <text x="260" y="424" textAnchor="middle" fill="currentColor" fontSize="8" letterSpacing="3">FIDES QUAERENS INTELLECTUM · FAITH SEEKING UNDERSTANDING</text>
  </svg>;
}
