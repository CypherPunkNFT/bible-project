// Landing art: five glass sheets, one per era of the Bible page, exploded along a dated axis from the hand-copied
// leaf (back) to the modern critical edition (front). Each sheet is drawn flat in a 150 × 200 frame and leaned into
// space with one oblique matrix, so corner guides between sheets read as an exploded drawing. Line art only.
const SKEW = 'matrix(0.82 -0.3 0 1';
const W = 150, H = 200;

/** A line of "words": short strokes with gaps, stable for the same seed. */
function words(x, y, width, seed, jitter = 0) {
  let d = '', at = 0, s = seed;
  while (at < width - 3) {
    s = (s * 9301 + 49297) % 233280;
    const w = Math.min(3 + (s / 233280) * 13, width - at);
    const dy = jitter ? (((s >> 3) % 7) - 3) * jitter : 0;
    d += `M${(x + at).toFixed(1)} ${(y + dy).toFixed(1)}h${w.toFixed(1)}`;
    at += w + 2.6;
  }
  return d;
}
const column = (x, y, w, n, gap, seed, jitter) =>
  Array.from({ length: n }, (_, i) => words(x, y + i * gap, i % 6 === 5 ? w * .6 : w, seed + i * 37, jitter)).join('');

// What each era's sheet carries. Coordinates are inside the 150 × 200 sheet.
const SHEETS = [
  { date: 'before 1450', name: 'Hand-copied leaf', tone: 'var(--muted)', draw: () =>
    `<path class="hx-ink hx-hand" d="${column(20, 34, 110, 20, 7.4, 11, .35)}"/>
     <rect class="hx-gold" x="20" y="28" width="12" height="14" rx="1"/>
     <path class="hx-ink" d="M18 22c20-3 38 2 58-1s36 2 56-1" opacity=".5"/>` },
  { date: '1440s', name: 'Movable type', tone: 'var(--pr-blue)', draw: () => {
    let sorts = '';
    'INPRINCIPIO'.split('').forEach((c, i) => {
      const x = 18 + (i % 4) * 29, y = 30 + Math.floor(i / 4) * 44;
      sorts += `<rect class="hx-sort" x="${x}" y="${y}" width="24" height="36" rx="1.5"/>`
        + `<text class="hx-letter" x="${-(x + 12)}" y="${y + 25}" transform="scale(-1 1)">${c}</text>`;
    });
    return sorts + '<path class="hx-ink" d="M18 170h112M18 178h112" opacity=".5"/>';
  } },
  { date: 'c. 1455', name: 'Gutenberg, Mainz', tone: 'var(--pr-red)', draw: () =>
    `<path class="hx-ink" d="${column(18, 30, 52, 22, 6.6, 3)}${column(80, 30, 52, 22, 6.6, 7)}"/>
     <rect class="hx-red" x="18" y="26" width="13" height="19" rx="1"/>
     <path class="hx-ink" d="M50 18h50" opacity=".6"/>` },
  { date: '1514–17', name: 'Polyglot, Alcalá', tone: 'var(--poetry)', draw: () =>
    `<path class="hx-ink" d="${column(16, 34, 34, 15, 6.6, 5)}${column(56, 34, 38, 15, 6.6, 9)}${column(100, 34, 34, 15, 6.6, 2)}"/>
     <path class="hx-rule" d="M16 141h118"/>
     <path class="hx-ink" d="${column(16, 152, 55, 5, 6, 4)}${column(79, 152, 55, 5, 6, 8)}" opacity=".7"/>
     <path class="hx-ink" d="M22 24h20M64 24h22M108 24h20" opacity=".7"/>` },
  { date: '2004–12', name: 'Critical edition', tone: 'var(--accent)', draw: () =>
    `<path class="hx-ink hx-main" d="${column(22, 34, 96, 15, 7, 13)}"/>
     <path class="hx-ink" d="M126 36v28M126 80v20" opacity=".7"/>
     <path class="hx-rule" d="M18 144h116"/>
     <path class="hx-ink" d="${column(18, 154, 116, 5, 5.4, 6)}" opacity=".75"/>
     <circle class="hx-dot" cx="64" cy="55" r="2.4"/><path class="hx-rule" d="M64 57.5V151"/>
     <circle class="hx-dot" cx="64" cy="154" r="2.4"/>` },
];

// Each sheet's origin; the axis runs along their lower-left corners.
const at = i => [56 + i * 108, 150 + i * 34];
const project = ([x, y], i) => { const [ex, ey] = at(i); return [ex + x * .82, ey - x * .3 + y]; };
const pt = p => p.map(n => n.toFixed(1)).join(' ');

function sheet(s, i) {
  const [ex, ey] = at(i);
  return `<g class="hx-sheet" style="--tone:${s.tone};--i:${i}" data-front="${i === SHEETS.length - 1 || undefined}">
    <g transform="${SKEW} ${ex} ${ey})">
      <rect class="hx-glass" x="0" y="0" width="${W}" height="${H}" rx="3"/>
      <path class="hx-edge" d="M0 3V0h${W}v${H}"/>
      <path class="hx-guide" d="M10 -6V${H + 6}M${W - 10} -6V${H + 6}M-6 12H${W + 6}M-6 ${H - 12}H${W + 6}"/>
      ${s.draw()}
      <text class="hx-num" x="${W - 8}" y="${H - 6}">0${i + 1}</text>
    </g></g>`;
}

/** Dashed corner-to-corner guides: the exploded drawing's tie lines. */
function ties() {
  let d = '';
  for (let i = 0; i < SHEETS.length - 1; i++)
    for (const c of [[0, 0], [W, 0], [W, H], [0, H]]) d += `M${pt(project(c, i))}L${pt(project(c, i + 1))}`;
  return `<path class="hx-tie" d="${d}"/>`;
}

/** The dated axis under the stack, with a tick and caption per sheet. */
function axis() {
  const a = project([0, H + 34], 0), b = project([0, H + 34], SHEETS.length - 1);
  const ticks = SHEETS.map((s, i) => {
    const [x, y] = project([0, H + 34], i);
    // Captions are sheared to the axis's slope so they run parallel to it, like labels on an isometric drawing.
    return `<g class="hx-tick" style="--tone:${s.tone}" transform="translate(${x} ${y}) skewY(17.5)"><path d="M0 -5v10"/><circle r="2.6"/>
      <text class="hx-date" x="4" y="20">${s.date}</text><text class="hx-name" x="4" y="32">${s.name}</text></g>`;
  }).join('');
  return `<path class="hx-axis" d="M${a[0] - 30} ${a[1] - 10}L${b[0] + 70} ${b[1] + 23}"/>
    <path class="hx-axis-head" d="M${b[0] + 62} ${b[1] + 15}l8 8-11 2"/>${ticks}`;
}

/** The press platen hovering over the Gutenberg sheet, with its screw. */
function platen() {
  const [x, y] = project([75, -48], 2);
  return `<g class="hx-press" transform="translate(${x} ${y})">
    <path d="M0 -70V-22M-6 -64l12 5M-6 -55l12 5M-6 -46l12 5M-6 -37l12 5"/>
    <path d="M-38 -60H38"/><path class="hx-plate" d="M-62 -18l100 -34 22 0 -100 34z"/>
    <path class="hx-press-drop" d="M-30 -6V22M30 -26V2"/></g>`;
}

function art() {
  const marks = [[34, 96], [610, 120], [598, 470], [30, 430], [330, 40]]
    .map(([x, y]) => `M${x - 5} ${y}h10M${x} ${y - 5}v10`).join('');
  return `<svg viewBox="0 0 660 560" role="img" aria-label="Five sheets, from a hand-copied leaf to a modern critical edition, drawn as an exploded stack along a dated axis">
    <defs><linearGradient id="hx-beam" x1="0" x2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity="0"/>
      <stop offset=".5" stop-color="var(--accent)" stop-opacity=".3"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient>
      <clipPath id="hx-glass-clip">${SHEETS.map((_, i) => `<rect x="0" y="0" width="${W}" height="${H}" transform="${SKEW} ${at(i).join(' ')})"/>`).join('')}</clipPath></defs>
    <path class="hx-mark" d="${marks}"/>
    ${ties()}${SHEETS.map(sheet).join('')}
    <g clip-path="url(#hx-glass-clip)"><path class="hx-beam" d="M40 60h60l-50 520h-60z"/></g>
    ${platen()}${axis()}
  </svg>`;
}

const host = document.getElementById('hx-art');
if (host) host.insertAdjacentHTML('afterbegin', art());
