// The drawings for Bearing witness: one thin stroke, round caps, the letters' colour for the light. A door ajar in a wall, a chain beside it.
// No person and no face. Fixed strings written here, never built from data.
window.BWArt = {
  hero: `<svg class="bw-scene" viewBox="0 0 460 400" aria-hidden="true">
    <path class="bw-faint" d="M0 96h460M0 134h142M332 134h128M0 172h134M340 172h120M0 210h134M340 210h120M0 248h134M340 248h120M0 286h134M340 286h120M0 324h134M340 324h120"/>
    <path class="bw-faint" d="M40 96v38M104 96v38M372 96v38M430 96v38M72 134v38M16 172v38M100 172v38M392 134v38M366 172v38M440 172v38M48 210v38M112 210v38M404 210v38M20 248v38M84 248v38M372 248v38M436 248v38M58 286v38M116 286v38M402 286v38M28 324v22M92 324v22M366 324v22M428 324v22"/>
    <path class="bw-light" d="M230 126a64 64 0 0 1 64 64v156h-64Z"/>
    <path class="bw-light bw-light-floor" d="M230 346h64l74 44H204Z"/>
    <g class="bw-motes"><circle class="bw-mote bw-m1" cx="252" cy="310" r="1.6"/><circle class="bw-mote bw-m2" cx="272" cy="280" r="1.3"/><circle class="bw-mote bw-m3" cx="244" cy="248" r="1.5"/><circle class="bw-mote bw-m4" cx="266" cy="212" r="1.2"/><circle class="bw-mote bw-m5" cx="256" cy="176" r="1.4"/></g>
    <path d="M152 346V190a78 78 0 0 1 156 0v156"/>
    <path class="bw-faint" d="M166 346V190a64 64 0 0 1 128 0v156"/>
    <path class="bw-leaf" d="M166 346V190c0-34 20-62 46-74l18 2v246Z"/>
    <path class="bw-faint" d="M184 352V146M202 358V124"/>
    <circle cx="220" cy="256" r="2.6"/>
    <path d="M326 150a5 5 0 1 1 10 0a5 5 0 1 1-10 0"/>
    <g class="bw-chain"><ellipse cx="331" cy="164" rx="3" ry="6.4"/><path d="M331 171v11"/><ellipse cx="331" cy="189" rx="3" ry="6.4"/><path d="M331 196v11"/><ellipse cx="331" cy="214" rx="3" ry="6.4"/><path d="M331 221v11"/><ellipse cx="331" cy="239" rx="3" ry="6.4"/><path d="M331 246v11"/><ellipse cx="331" cy="264" rx="3" ry="6.4"/><path d="M331 271v6"/><path d="M319 289a12 12 0 1 0 24 0a12 12 0 1 0-24 0"/></g>
    <path d="M10 348c70-3 130-3 142-2h156c30-1 90-2 142 2"/>
  </svg>`,
  doorway: `<svg class="bw-scene" viewBox="0 0 200 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <path class="bw-light" d="M100 32a64 64 0 0 1 64 64v184h-64Z"/>
    <path d="M22 280V96a78 78 0 0 1 156 0v184"/>
    <path class="bw-faint" d="M36 280V96a64 64 0 0 1 128 0v184"/>
    <path class="bw-leaf" d="M36 280V96c0-32 22-60 48-72l16 2v266Z"/>
    <path class="bw-faint" d="M54 286V52M74 290V30"/>
    <circle cx="90" cy="178" r="2.4"/>
    <path d="M2 282h196"/>
  </svg>`,
  doorAjar: `<svg class="bw-mini" viewBox="0 0 56 72" aria-hidden="true">
    <path class="bw-light" d="M28 8a22 22 0 0 1 22 22v38H28Z"/>
    <path d="M6 68V30a22 22 0 0 1 44 0v38"/>
    <path class="bw-leaf" d="M10 68V30c0-9 5-17 13-21l5 1v62Z"/>
    <path d="M2 68h52"/>
  </svg>`,
  doorShut: `<svg class="bw-mini" viewBox="0 0 56 72" aria-hidden="true">
    <path d="M6 68V30a22 22 0 0 1 44 0v38"/>
    <path class="bw-faint" d="M10 68V30a18 18 0 0 1 36 0v38M28 12v56"/>
    <circle cx="34" cy="44" r="1.6"/>
    <path d="M2 68h52"/>
  </svg>`,
  foot: `<svg viewBox="0 0 1200 110" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path class="bw-faint" d="M0 98c200-6 360-6 520-3h680"/>
    <path d="M760 96V42h440M700 96V42h60"/>
    <path class="bw-faint" d="M760 60h440M760 78h440M800 42v18M860 60v18M930 42v18M1000 60v18M1070 42v18M1140 60v18M730 42v18"/>
    <path class="bw-light" d="M900 96V66a14 14 0 0 1 28 0v30Z"/>
    <path d="M896 96V66a18 18 0 0 1 36 0v30"/>
    <path class="bw-leaf" d="M896 96V62l14-8v42Z"/>
    <path class="bw-accent" d="M920 96c-30 2-90 4-180 4s-260-2-420 2"/>
  </svg>`,
};
