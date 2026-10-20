// Line drawings for the study-style contact pages (owner, 2026-10-20: "less complicated", in the manner of the Manuscripts,
// A passage through the manuscripts and Surviving witnesses heroes). One object each, tilted, with a dotted orbit, small
// crosses and one gold highlight. 520 × 420. Styles in page.css (.ss-art).
(() => {
  const orbit = (cx = 260, cy = 210, rx = 236, ry = 178) => `<ellipse class="ss-orbit" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  const crosses = (points) => points.map(([x, y]) => `<path class="ss-faint" d="M${x} ${y - 6}V${y + 6}M${x - 6} ${y}H${x + 6}"/>`).join("");
  const lines = (x, y, width, count, gap = 11, cls = "ss-line") => Array.from({ length: count }, (_, i) =>
    `<path class="${cls}" d="M${x} ${y + i * gap}H${x + width * [1, .86, .94, .7, .9, .8, .96, .62][i % 8]}"/>`).join("");
  const tilt = (angle, body) => `<g transform="rotate(${angle} 260 210)">${body}</g>`;
  const frame = (body, extra = "") => `<svg viewBox="0 0 520 420" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${orbit()}${crosses([[40, 60], [486, 46], [470, 372], [62, 360]])}${extra}${body}</svg>`;
  const word = (x, y, text, size = 30, cls = "ss-word") => `<text class="${cls}" x="${x}" y="${y}" font-size="${size}">${text}</text>`;

  const ART = {
    // Set I: the written Word.
    codex: () => frame(tilt(-9, `<path class="ss-paper" d="M90 110Q170 96 256 118V330Q170 312 90 324Z"/><path class="ss-paper" d="M256 118Q342 96 424 108V322Q342 312 256 330Z"/>
      ${lines(108, 136, 128, 15)}${lines(276, 136, 128, 15)}
      <path class="ss-gold-fill" d="M272 196H410V262H272Z"/>${lines(280, 206, 120, 6, 10, "ss-gold")}
      <path class="ss-gold" d="M384 104V150L392 142L400 150V102"/>`)),
    scroll: () => frame(tilt(-7, `<path class="ss-paper" d="M110 120H410V300H110Z"/>
      <rect class="ss-paper" x="84" y="104" width="28" height="212" rx="12"/><rect class="ss-paper" x="408" y="104" width="28" height="212" rx="12"/>
      <path class="ss-faint" d="M98 104V92M98 316V328M422 104V92M422 316V328"/>
      ${lines(130, 138, 78, 14)}${lines(306, 138, 84, 14)}
      <path class="ss-gold-fill" d="M222 128H292V292H222Z"/>${lines(228, 138, 58, 14, 11, "ss-gold")}`)),
    fragment: () => frame(tilt(-10, `<path class="ss-faint-paper" d="M130 70H390V350H130Z"/>${lines(148, 92, 224, 23, 11, "ss-line ss-dim")}
      <path class="ss-gold-fill" d="M200 150L262 128L330 160L352 226L322 290L250 312L196 270L178 206Z"/>
      <clipPath id="ss-frag-clip"><path d="M200 150L262 128L330 160L352 226L322 290L250 312L196 270L178 206Z"/></clipPath>
      <g clip-path="url(#ss-frag-clip)">${lines(176, 136, 180, 17, 11, "ss-gold")}</g>`)),
    magnifier: () => frame(tilt(-8, `<path class="ss-paper" d="M120 80H360V340H120Z"/>${lines(138, 104, 204, 21)}
      <circle class="ss-lens" cx="330" cy="200" r="74"/>${word(276, 212, "λόγος", 38)}<path class="ss-gold" d="M282 222H380"/>
      <path class="ss-handle" d="M384 254L446 316"/>`)),

    // Set II: letters and writing.
    epistle: () => frame(tilt(-6, `<path class="ss-papyrus" d="M100 96H420V330H100Z"/>
      ${Array.from({ length: 9 }, (_, i) => `<path class="ss-fibre" d="M${120 + i * 34} 98V328"/>`).join("")}
      ${word(122, 142, "χάρις ὑμῖν", 34)}${word(122, 178, "καὶ εἰρήνη", 24, "ss-word ss-word-dim")}
      <path class="ss-gold" d="M122 150H290"/>${lines(122, 206, 270, 11)}
      <path class="ss-faint" d="M420 150Q452 160 446 196T420 238"/><circle class="ss-seal" cx="446" cy="196" r="12"/><path class="ss-seal-mark" d="M446 189V203M440 195H452"/>`)),
    reed: () => frame(tilt(-10, `<path class="ss-paper" d="M110 90H370V340H110Z"/>${lines(130, 116, 210, 12)}${lines(130, 248, 150, 5, 11, "ss-gold")}
      <path class="ss-pen" d="M210 300L440 120"/><path class="ss-gold" d="M210 300L200 312M206 296L214 304"/>
      <path class="ss-paper" d="M400 300H460V350Q430 360 400 350Z"/><ellipse class="ss-paper" cx="430" cy="300" rx="30" ry="9"/><ellipse class="ss-gold-fill" cx="430" cy="300" rx="16" ry="4"/>`)),
    tablet: () => frame(tilt(-7, `<rect class="ss-paper" x="80" y="110" width="176" height="210" rx="6"/><rect class="ss-paper" x="264" y="110" width="176" height="210" rx="6"/>
      <rect class="ss-wax" x="96" y="126" width="144" height="178" rx="2"/><rect class="ss-wax" x="280" y="126" width="144" height="178" rx="2"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<path class="ss-scratch" d="M108 ${150 + i * 24}${Array.from({ length: 10 }, () => "l6 -6l6 6").join("")}"/>`).join("")}
      ${[0, 1, 2].map((i) => `<path class="ss-gold" d="M292 ${150 + i * 24}${Array.from({ length: 8 }, () => "l6 -6l6 6").join("")}"/>`).join("")}
      <path class="ss-faint" d="M256 150H264M256 280H264"/><path class="ss-pen" d="M300 360L470 250"/><path class="ss-gold" d="M466 244L482 236L474 254Z"/>`)),
    margins: () => frame(tilt(-8, `<path class="ss-paper" d="M110 70H350V350H110Z"/>${lines(128, 96, 92, 22)}${lines(236, 96, 96, 22)}
      <ellipse class="ss-gold" cx="276" cy="184" rx="34" ry="9"/><path class="ss-gold" d="M310 184Q360 176 392 150"/>
      ${lines(396, 136, 70, 4, 11, "ss-gold")}${word(394, 122, "÷", 22)}
      <path class="ss-gold" d="M246 239H306"/><path class="ss-gold" d="M262 230l6 -8l6 8"/>`)),

    // Set III: wider themes.
    shelf: () => frame(tilt(-6, `<path class="ss-paper" d="M100 80H420V340H100Z"/>
      ${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<path class="ss-line" d="M${104 + c * 79} ${84 + r * 85}h75v81h-75Z"/>${[0, 1, 2, 3, 4].map((k) => `<circle class="ss-faint" cx="${122 + c * 79 + (k % 3) * 18}" cy="${148 + r * 85 - Math.floor(k / 3) * 18}" r="8"/>`).join("")}`).join("")).join("")}
      <path class="ss-gold-fill" d="M263 169h75v81h-75Z"/><path class="ss-gold" d="M300 220L380 236M300 234L380 250"/><circle class="ss-gold-fill" cx="384" cy="243" r="9"/>`)),
    map: () => frame(`<path class="ss-coast" d="M40 220Q90 190 130 200T200 186Q228 150 262 170T330 160Q360 132 400 150T470 140"/>
      <path class="ss-coast" d="M60 300Q120 290 180 306T300 300Q350 280 400 296T480 280"/>
      <path class="ss-coast" d="M210 186Q218 236 240 246T262 214"/>
      ${[["Rome", 150, 196], ["Corinth", 262, 214], ["Ephesus", 330, 186], ["Antioch", 444, 200], ["Jerusalem", 430, 262]].map(([name, x, y]) => `<circle class="ss-dot" cx="${x}" cy="${y}" r="5"/><text class="ss-label" x="${x}" y="${y - 12}" text-anchor="middle">${name.toUpperCase()}</text>`).join("")}
      <path class="ss-route" d="M430 262Q450 230 444 200Q400 210 330 186Q300 200 262 214"/>
      <path class="ss-gold ss-route-gold" d="M262 214Q210 250 150 196"/>`),
    door: () => frame(tilt(-4, `<path class="ss-paper" d="M170 340V150A90 90 0 0 1 350 150V340"/>
      <path class="ss-gold-fill" d="M190 340V160A70 70 0 0 1 330 160V340Z"/>
      <path class="ss-paper" d="M330 340V160Q330 120 300 100L390 120V350Z"/><circle class="ss-dot" cx="372" cy="246" r="4"/>
      <path class="ss-gold-fill ss-spill" d="M190 340H330L420 400H110Z"/><path class="ss-faint" d="M120 340H420"/>`)),
    mustard: () => frame(`<circle class="ss-gold-fill" cx="96" cy="350" r="4"/><path class="ss-route" d="M104 346Q180 320 230 320"/>
      <path class="ss-trunk" d="M300 350Q296 280 300 220M300 270Q260 240 230 200M300 250Q340 220 372 186M300 222Q290 170 270 130M300 222Q320 166 350 128"/>
      ${[[230, 190, 36], [372, 176, 40], [268, 120, 34], [352, 118, 34], [300, 92, 40], [210, 150, 28], [400, 140, 28]].map(([x, y, r]) => `<circle class="ss-leaf" cx="${x}" cy="${y}" r="${r}"/>`).join("")}
      ${[[240, 168], [354, 148], [312, 72], [402, 116]].map(([x, y]) => `<path class="ss-gold" d="M${x - 8} ${y}q4 -6 8 0q4 -6 8 0"/>`).join("")}
      <path class="ss-faint" d="M200 350H420"/>`),
  };
  window.SS_ART = ART;
})();
