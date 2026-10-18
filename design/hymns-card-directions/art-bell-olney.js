// Directions 05 (Rung out: Amazing Grace's echoes) and 06 (Olney, a line drawing).
(() => {
  const { AG, reduced, sleep, esc } = HC;

  // 05 · A bell; its six stanzas ring out as six rings, and each line that echoes Scripture sits on its ring at its line's height.
  const CX = 62, CY = 116, RING = (s) => 96 + s * 84, ROWS = [46, 92, 140, 186], ROMAN = ["I", "II", "III", "IV", "V", "VI"];
  const SHORT = [["1 Samuel", "1 Sam"], ["1 Chronicles", "1 Chr"], ["Psalm", "Ps"], ["Hebrews", "Heb"], ["Revelation", "Rev"], ["2 Peter", "2 Pet"]];
  const short = (ref) => SHORT.reduce((r, [long, abbr]) => r.replace(long, abbr), ref).replace(/–\d+$/, "");
  const PULSE = 520, CYCLE = 6;

  CARD_ART.push({
    id: "rung-out",
    label: "Rung out",
    idea: "A bell strikes and its sound rings out as six rings, one for each verse of Amazing Grace. On the rings sit the eleven Bible verses its lines echo, lighting as the sound reaches them; the line beneath reads them one at a time.",
    art() {
      const spots = new Map();
      for (const e of AG.echoes) {
        const key = `${e.stanza}-${e.line}`;
        if (!spots.has(key)) spots.set(key, { stanza: e.stanza, line: e.line, echoes: [] });
        spots.get(key).echoes.push(e);
      }
      const arcs = ROMAN.map((numeral, s) => {
        const r = RING(s), dy = Math.min(r, 98), x = CX + Math.sqrt(r * r - dy * dy);
        return `<path class="ring-arc" d="M${x.toFixed(1)} ${CY - dy} A${r} ${r} 0 0 1 ${x.toFixed(1)} ${CY + dy}"/>
          <text class="ring-numeral" x="${(CX + Math.sqrt(r * r - 100 * 100) || CX + 20).toFixed(1)}" y="12">${numeral}</text>`;
      }).join("");
      const dots = [...spots.values()].map((spot) => {
        const r = RING(spot.stanza), y = ROWS[spot.line], x = CX + Math.sqrt(r * r - (y - CY) ** 2);
        const anchor = spot.stanza === 5 ? "end" : "middle", lx = anchor === "end" ? x + 5 : x;
        const delay = ((r / PULSE - 0.05) / 0.95) * CYCLE - 0.36;
        const [first, second] = spot.echoes;
        const labels = `<text class="echo-ref" x="${lx.toFixed(1)}" y="${y - 9}" text-anchor="${anchor}">${short(first.ref)}</text>` +
          (second ? `<text class="echo-ref" x="${lx.toFixed(1)}" y="${y + 16}" text-anchor="${anchor}">${short(second.ref)}</text>` : "");
        return `<g class="echo" data-spot="${spot.stanza}-${spot.line}" style="animation-delay:${delay.toFixed(2)}s">
          <circle class="echo-halo" cx="${x.toFixed(1)}" cy="${y}" r="7.5" fill="none" stroke="currentColor"/>
          <circle class="echo-dot" cx="${x.toFixed(1)}" cy="${y}" r="${second ? 4.4 : 3.6}"/>${labels}</g>`;
      }).join("");
      const bell = `<g class="bell" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">
          <path d="M40 60 H84"/><circle cx="40" cy="60" r="2.5"/><circle cx="84" cy="60" r="2.5"/><path d="M62 60 V69"/>
          <path d="M51 77 C51 69 73 69 73 77 C79 90 79 108 85 121 C88 128 94 130 95 134 H29 C30 130 36 128 39 121 C45 108 45 90 51 77 Z" fill="var(--surface)" fill-opacity=".6"/>
          <path d="M46 98 H78 M44 103 H80" stroke-width=".8" opacity=".55"/><path d="M27 138 H97" stroke-width="1"/>
          <path d="M62 84 V131" stroke-width=".9"/><circle cx="62" cy="134" r="3.6" fill="currentColor"/></g>`;
      return `<svg class="${reduced ? "" : "ringing"}" viewBox="0 0 600 200" preserveAspectRatio="xMidYMin meet" role="img" aria-label="Amazing Grace's six verses and the Bible verses their lines echo" style="height:calc(100% - 24px);overflow:hidden">
          <circle class="pulse" cx="${CX}" cy="${CY}" r="${PULSE}"/>${arcs}${bell}${dots}</svg>
        <div class="ring-read"></div>`;
    },
    async start(root) {
      const read = root.querySelector(".ring-read"), order = [...AG.echoes];
      const say = (e) => {
        root.querySelectorAll(".echo.on").forEach((g) => g.classList.remove("on"));
        root.querySelector(`.echo[data-spot="${e.stanza}-${e.line}"]`)?.classList.add("on");
        read.innerHTML = `<em>${ROMAN[e.stanza]}</em> <i>${esc(AG.stanzas[e.stanza][e.line].replace(/[,;:.!]$/, ""))}</i> <span>→</span> <b>${esc(e.ref)}</b> “${esc(e.words)}”`;
      };
      if (reduced) { say(order[4]); return; }
      for (let i = 0; ; i = (i + 1) % order.length) {
        read.style.opacity = 0;
        await sleep(400);
        say(order[i]);
        read.style.opacity = 1;
        await sleep(3000);
      }
    },
  });

  // 06 · Olney by the river Ouse: the church spire, the vicarage, bells pealing, a little snow for New Year's Day 1773.
  const SNOW = Array.from({ length: 16 }, (_, i) => ({ x: (i * 97 + 31) % 590 + 5, delay: -((i * 2.3) % 14), size: i % 3 ? 1 : 1.4 }));
  const WINDOWS = [409, 437, 465, 493].map((x) => `<path d="M${x} 162 V151 Q${x + 5} 142 ${x + 10} 151 V162 Z M${x + 5} 146 V162" class="fine"/>`).join("");
  const GRAVES = [426, 446, 478, 504, 532].map((x) => `<path d="M${x} 170 v-4 a2.6 2.6 0 0 1 5.2 0 v4" class="faint"/>`).join("");

  CARD_ART.push({
    id: "olney",
    label: "Olney, 1773",
    idea: "A line drawing of Olney, where Newton and Cowper wrote the Olney Hymns: the church spire by the river, its bells pealing in slow rings, smoke from the vicarage chimney and light snow for New Year's Day 1773, when Amazing Grace was written for the parish. It loops slowly.",
    art() {
      const snow = SNOW.map((f) => `<circle cx="${f.x}" cy="-6" r="${f.size}" fill="currentColor" stroke="none" opacity=".4" style="animation:snow 14s linear infinite;animation-delay:${f.delay}s"/>`).join("");
      const peal = `<g class="peal"><path d="M361 107 A23 23 0 0 0 361 129"/><path d="M403 107 A23 23 0 0 1 403 129"/></g>`;
      return `<svg class="scene" viewBox="0 0 600 214" preserveAspectRatio="xMidYMax meet" style="height:calc(100% - 22px)" role="img" aria-label="A line drawing of Olney church and the vicarage by the river">
          <style>@keyframes snow { to { transform: translate(-14px, 222px); } }</style>
          <circle cx="262" cy="56" r="15" class="wash"/><circle cx="262" cy="56" r="15" class="faint"/>
          ${snow}
          <path d="M0 170 H600" class="fine"/><path d="M0 176 C150 172 450 180 600 175" class="faint"/>
          <path d="M46 170 V120 H124 V170 M40 121 L85 93 L130 121"/><path d="M104 105 V85 H114 V111" class="fine"/>
          <path class="smoke" d="M109 80 C103 70 117 64 110 54 C104 45 116 38 110 28" stroke-opacity=".55"/>
          <path d="M56 129 h12 v12 h-12 Z M62 129 v12 M56 135 h12 M102 129 h12 v12 h-12 Z M108 129 v12 M102 135 h12 M56 149 h12 v12 h-12 Z M102 149 h12 v12 h-12 Z" class="fine"/>
          <path d="M79 170 V153 Q85 146 91 153 V170" class="fine"/>
          <path d="M232 170 V142 M232 152 L222 144 M232 148 L242 140" class="fine"/>
          <path d="M206 132 C196 120 204 102 218 104 C220 90 240 88 246 100 C260 96 268 112 260 122 C268 132 258 144 246 140 C238 148 222 148 216 140 C208 144 200 140 206 132 Z" class="wash"/>
          <path d="M206 132 C196 120 204 102 218 104 C220 90 240 88 246 100 C260 96 268 112 260 122 C268 132 258 144 246 140 C238 148 222 148 216 140 C208 144 200 140 206 132 Z"/>
          <path d="M318 170 V152 M302 146 C296 136 304 124 314 128 C318 118 332 120 334 130 C342 134 338 148 328 146 C322 152 308 152 302 146 Z" class="fine"/>
          <path d="M366 170 V100 H398 V170 M363 100 H401 M363 100 L365 92 L367 100 M397 100 L399 92 L401 100"/>
          <path d="M368 100 L382 22 L396 100 M368 100 L373 93 M396 100 L391 93"/>
          <path d="M378 82 V77 L382 71 L386 77 V82 M380 58 V55 L382 51 L384 55 V58" class="fine"/>
          <path d="M382 22 V11 M378.5 15 H385.5" class="fine"/>
          <path d="M374 124 V114 Q377 107 380 114 V124 M384 124 V114 Q387 107 390 114 V124 M375 117 H379 M375 120 H379 M385 117 H389 M385 120 H389" class="fine"/>
          <path d="M376 162 V148 Q382 138 388 148 V162 M382 143 V162" class="fine"/>
          <path d="M398 170 V134 H520 V170 M398 134 L404 120 H514 L520 134"/>${WINDOWS}
          <path d="M520 170 V144 H560 V170 M520 144 L524 136 H556 L560 144"/><path d="M545 164 V155 Q550 148 555 155 V164 Z" class="fine"/>
          ${GRAVES}
          <path d="M566 142 C558 130 566 114 580 116 C584 102 604 102 608 114" class="fine"/><path d="M584 170 V146" class="fine"/>
          ${peal}${peal}${peal}
          <g class="bird"><g transform="translate(0 44)"><path class="wing" d="M0 0 q4 -4 8 0 q4 -4 8 0"/></g></g>
          <g class="bird"><g transform="translate(0 66)"><path class="wing" d="M0 0 q3 -3 6 0 q3 -3 6 0"/></g></g>
          <path d="M0 181 C120 178 250 184 380 180 S540 183 600 180" class="fine"/>
          <path d="M14 182 Q16 170 18 162 M20 182 Q21 172 26 164 M574 182 Q576 170 572 162 M580 182 Q582 172 586 165" class="fine"/>
          <g class="water"><path d="M30 191 H92 M150 193 H232 M300 190 H342 M440 194 H520" class="faint"/></g>
          <g class="water"><path d="M70 202 H122 M248 204 H300 M402 201 H470 M520 205 H580" class="faint"/></g>
          <g class="water"><path d="M368 186 L382 210 L396 186 M366 184 V190 M398 184 V190" class="faint" stroke-dasharray="3 3"/></g>
        </svg>
        <span class="art-note">Olney, where Amazing Grace was written for New Year's Day 1773</span>`;
    },
    start() {},
  });
})();
