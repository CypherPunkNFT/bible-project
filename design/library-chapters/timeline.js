// "Through time": one lane per part. The light band is the time the part tells of, the dark line
// when it was written. The axis is in three pieces so the New Testament's single century is readable:
// 2200–400 BC, the ~400 years between the Testaments (compressed), then 10 BC–AD 110.
const AXIS = [
  { from: -2200, to: -400, left: 0, right: 0.64 },
  { from: -400, to: -10, left: 0.64, right: 0.73 },
  { from: -10, to: 110, left: 0.73, right: 1 },
];
const TICKS = [[-2000, '2000 BC'], [-1500, '1500'], [-1000, '1000'], [-500, '500 BC'], [1, 'AD 1'], [50, '50'], [100, 'AD 100']];

function yearToFraction(year) {
  const piece = AXIS.find((p) => year >= p.from && year <= p.to) ?? (year < AXIS[0].from ? AXIS[0] : AXIS[2]);
  const t = (Math.min(Math.max(year, piece.from), piece.to) - piece.from) / (piece.to - piece.from);
  return piece.left + t * (piece.right - piece.left);
}

function drawTimeline() {
  const svg = document.getElementById('timeline-svg'), readout = document.getElementById('timeline-readout');
  const gutter = 132, lane = 30, top = 8, width = Math.max(760, svg.parentElement.clientWidth), plot = width - gutter - 12;
  const height = top + SECTIONS.length * lane + 34;
  const x = (year) => gutter + yearToFraction(year) * plot;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  const gapLeft = x(-400), gapRight = x(-10), bottom = top + SECTIONS.length * lane;
  const parts = [
    `<defs><pattern id="gap-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="hatch"/></pattern>
      <linearGradient id="fade-left" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".6" stop-color="#fff" stop-opacity="1"/></linearGradient>
      <mask id="fade-mask"><rect x="0" y="0" width="${x(-1700)}" height="${height}" fill="url(#fade-left)"/><rect x="${x(-1700)}" y="0" width="${width}" height="${height}" fill="#fff"/></mask></defs>`,
    `<rect x="${gapLeft}" y="${top}" width="${gapRight - gapLeft}" height="${bottom - top}" fill="url(#gap-hatch)" class="gap"/>`,
    `<text class="gap-label" x="${(gapLeft + gapRight) / 2}" y="${bottom + 26}" text-anchor="middle">~400 years between the Testaments</text>`,
  ];
  for (const [year, label] of TICKS) parts.push(`<line class="tick" x1="${x(year)}" x2="${x(year)}" y1="${top}" y2="${bottom + 4}"/><text class="tick-label" x="${x(year)}" y="${bottom + 14}" text-anchor="middle">${label}</text>`);
  SECTIONS.forEach((s, row) => {
    const y = top + row * lane, mid = y + lane / 2, on = s.id === app.part;
    parts.push(`<g class="lane${on ? ' on' : ''}" data-lane="${s.id}" style="--tone:var(--${s.id})">`);
    parts.push(`<rect class="lane-hit" x="0" y="${y}" width="${width}" height="${lane}"/>`);
    parts.push(`<text class="lane-name" x="${gutter - 12}" y="${mid + 4}" text-anchor="end">${s.name}</text>`);
    if (s.covers) {
      const left = x(s.covers[0]), right = x(s.covers[1]);
      parts.push(`<rect class="covers" x="${left}" y="${mid - 8}" width="${Math.max(right - left, 4)}" height="16" rx="3" ${s.coversFrom ? 'mask="url(#fade-mask)"' : ''}/>`);
      if (s.coversFrom) parts.push(`<text class="lane-note" x="${gutter + 4}" y="${mid + 3.5}">← ${s.coversFrom}</text>`);
      if (s.coversTo) parts.push(`<path class="arrow" d="M${right + 2} ${mid}h8m-3-3 3 3-3 3"/>`);
    }
    const wl = x(s.written[0]), wr = x(s.written[1]);
    parts.push(wr - wl < 3 ? `<circle class="written" cx="${wl}" cy="${mid}" r="3.5"/>` : `<rect class="written" x="${wl}" y="${mid - 1.75}" width="${wr - wl}" height="3.5" rx="1.75"/>`);
    parts.push('</g>');
  });
  svg.innerHTML = parts.join('');
  svg.querySelectorAll('[data-lane]').forEach((laneEl) => {
    const s = SECTIONS.find((item) => item.id === laneEl.dataset.lane);
    laneEl.addEventListener('pointerenter', () => { readout.innerHTML = `<b style="color:var(--${s.id})">${s.name}</b> tells of ${s.coversText}. Written ${s.writtenText}.`; });
    laneEl.addEventListener('click', () => selectPart(s.id));
  });
  svg.addEventListener('pointerleave', () => { readout.textContent = 'Point at a lane: the light band is the time each part tells of, the dark line when it was written.'; });
}
