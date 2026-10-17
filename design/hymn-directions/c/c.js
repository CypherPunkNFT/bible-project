// Direction C · Six movements.
(() => {
  const { H, esc, panel, sources, switcher } = Hymn;
  const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
  const main = Frame.mount();
  const book = HymnSections.book("07");
  const placed = HymnSections.placed("08");

  // Hills along the foot of a scene: a gentle line through a few points, smoothed.
  const hills = (pts, cls = "ln") => `<path class="${cls}" d="M${pts.map((p, i) => (i ? `S${p[0] - 60},${p[1]} ${p[0]},${p[1]}` : `${p[0]},${p[1]}`)).join(" ")}"/>`;
  const bird = (x, y, s = 1) => `<path class="ln" d="M${x},${y} q${6 * s},${-6 * s} ${12 * s},0 q${6 * s},${-6 * s} ${12 * s},0"/>`;
  const cloud = (x, y) => `<path class="ln fa" d="M${x},${y} h70 a14,14 0 0 0 -10,-24 a20,20 0 0 0 -36,-6 a16,16 0 0 0 -24,30z"/>`;

  // The landing: a road through hills to a house on the far hill, the sun rising behind it.
  const landing = `<svg class="scene" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <g class="rise"><circle class="ln" cx="1040" cy="430" r="58"/>${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<path class="ln fa" d="M${1040 + Math.cos(a) * 76},${430 + Math.sin(a) * 76} L${1040 + Math.cos(a) * 104},${430 + Math.sin(a) * 104}"/>`; }).join("")}</g>
    <g class="drift slow">${cloud(80, 220)}</g><g class="drift">${cloud(-200, 300)}</g>
    <g class="glide">${bird(760, 300, 1.2)}${bird(800, 318)}${bird(730, 330, .8)}</g>
    ${hills([[0, 560], [260, 520], [560, 548], [860, 500], [1180, 470], [1440, 500]], "ln fa")}
    <path class="ln" d="M960,488 v-28 l22,-18 l22,18 v28 M974,488 v-12 h10 v12"/>
    ${hills([[0, 650], [320, 600], [700, 640], [1080, 590], [1440, 620]])}
    <path class="ln march" d="M600,900 C640,800 760,760 820,700 S960,560 982,492"/>
    <path class="ln fa" d="M690,900 C720,820 830,770 880,710 S990,570 994,492"/>
    ${hills([[0, 780], [400, 740], [900, 790], [1440, 750]], "ln fa")}
  </svg>`;

  // One scene per stanza, drawn along a 1440 × 170 strip.
  const SCENES = [
    // I · lost and found, blind and seeing: dawn over the hills
    `<g class="rise"><path class="ln" d="M660,150 a60,60 0 0 1 120,0"/>${Array.from({ length: 9 }, (_, i) => { const a = Math.PI + (i / 8) * Math.PI; return `<path class="ln fa breathe" d="M${720 + Math.cos(a) * 76},${150 + Math.sin(a) * 76} L${720 + Math.cos(a) * 104},${150 + Math.sin(a) * 104}"/>`; }).join("")}</g>
     ${hills([[0, 150], [300, 128], [720, 150], [1100, 124], [1440, 146]])}<g class="glide">${bird(980, 60)}${bird(1010, 74, .8)}</g>`,
    // II · grace that taught: a lamp, its flame moving
    `${hills([[0, 160], [500, 150], [1000, 156], [1440, 148]], "ln fa")}
     <path class="ln" d="M690,160 h60 M700,160 c0,-18 10,-26 20,-28 c10,2 20,10 20,28 M712,132 h16 l-3,-8 h-10z"/>
     <path class="ln flicker" d="M720,122 c-9,-10 -6,-24 0,-34 c6,10 9,24 0,34z"/>
     <circle class="ln fa breathe" cx="720" cy="104" r="34"/>`,
    // III · dangers, toils and snares; "hitherto": the road and Samuel's standing stone
    `${hills([[0, 150], [360, 120], [760, 140], [1160, 112], [1440, 132]], "ln fa")}
     <path class="ln march" d="M0,168 C300,150 520,132 760,128 S1200,110 1440,104"/>
     <path class="ln" d="M820,130 v-62 q0,-10 10,-12 l18,-2 q10,0 10,10 v66"/><path class="ln fa" d="M830,92 h20 M830,104 h20"/>
     <path class="ln fa" d="M300,152 l14,-10 l12,8 M420,146 l10,-8 l10,6 M1080,118 l12,-9 l10,7"/>`,
    // IV · my shield and portion: a walled field and its furrows
    `${hills([[0, 150], [420, 132], [900, 146], [1440, 128]], "ln fa")}
     <path class="ln" d="M560,150 v-50 h320 v50"/>${Array.from({ length: 7 }, (_, i) => `<path class="ln fa" d="M${580 + i * 44},150 l26,-48"/>`).join("")}
     <path class="ln" d="M880,100 v-16 l10,-8 l10,8 v66"/><g class="glide">${bird(380, 70)}</g>`,
    // V · within the veil: the curtain, stirring
    `${hills([[0, 160], [720, 150], [1440, 160]], "ln fa")}
     <path class="ln" d="M600,24 h240"/><g class="sway">${Array.from({ length: 9 }, (_, i) => `<path class="ln ${i % 2 ? "fa" : ""}" d="M${610 + i * 27},24 c-6,40 6,80 0,136"/>`).join("")}</g>
     <circle class="dot breathe" cx="720" cy="96" r="2.5"/>`,
    // VI · the earth dissolving like snow, the sun forbearing to shine: snow, a dimming sun, one star that stays
    `<g class="dim"><circle class="ln" cx="460" cy="70" r="30"/></g>
     <path class="ln" d="M980,40 l4,10 l10,2 l-8,7 l2,10 l-8,-5 l-8,5 l2,-10 l-8,-7 l10,-2z"/>
     ${hills([[0, 156], [360, 136], [820, 152], [1200, 130], [1440, 146]], "ln fa")}
     <g class="fall">${Array.from({ length: 34 }, (_, i) => `<circle class="dot" cx="${(i * 97) % 1440}" cy="${(i * 37) % 90}" r="${1 + (i % 3) * .5}"/>`).join("")}</g>`,
  ];

  const movements = H.stanzas.map((lines, s) => {
    const mine = H.echoes.map((e, i) => ({ ...e, i })).filter((e) => e.stanza === s);
    return `<section class="mv" id="m${s + 1}"><div class="sky" aria-hidden="true"></div><span class="giant" aria-hidden="true">${ROMAN[s]}</span>
      <div class="inner"><div><p class="k">Stanza ${ROMAN[s]} of VI</p>
        <div class="verse">${lines.map((line, l) => { const e = mine.find((m) => m.line === l); return `<p class="${e ? "e" : ""}" ${e ? `data-i="${e.i}"` : ""}><span>${esc(line)}</span></p>`; }).join("")}</div></div>
        <div class="float">${mine.map((e) => `<button type="button" data-i="${e.i}"><b>${esc(e.ref)}</b><span>“${esc(e.words)}”</span></button>`).join("")}</div></div>
      <svg class="scene foot" viewBox="0 0 1440 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${SCENES[s]}</svg></section>`;
  }).join("");

  main.innerHTML = `<section class="mv-land" id="top">${landing}<div class="copy">
      <p class="hy-crumb"><a href="/study">Study</a><span>/</span><a href="/study/theology">Living the Christian Life</a><span>/</span><a href="/study/hymns">Hymns</a></p>
      <h1>Amazing grace<em>how sweet the sound</em></h1>
      <p class="line1">Six stanzas John Newton printed in 1779 under David's question in 1 Chronicles: who am I, that you have brought me this far?</p>
      <dl class="mv-bar"><div><dt>Written by</dt><dd>John Newton<small>${H.authorDates}</small></dd></div><div><dt>Printed</dt><dd>${H.year}<small>Olney Hymns · Book I, no. ${H.number}</small></dd></div>
        <div><dt>Metre</dt><dd>${H.meterName}<small>${H.meter}</small></dd></div><div><dt>In hymnals</dt><dd>${H.hymnals.toLocaleString()}<small>Hymnary.org</small></dd></div></dl></div></section>
    ${movements}
    <div class="wrap">${book.html}${placed.html}${sources()}</div>`;

  const P = panel();
  book.wire(main);
  placed.wire(main);
  switcher();

  // Echoes: a line and its floating verse light together; click opens the passage beside the page.
  main.querySelectorAll(".mv").forEach((section) => {
    const pair = (i, on) => section.querySelectorAll(`[data-i="${i}"]`).forEach((el) => el.classList.toggle("on", on));
    section.querySelectorAll("[data-i]").forEach((el) => {
      const i = +el.dataset.i;
      el.addEventListener("mouseenter", () => pair(i, true));
      el.addEventListener("mouseleave", () => pair(i, false));
      el.addEventListener("click", () => { const e = H.echoes[i]; P.open(e, H.stanzas[e.stanza][e.line], `Stanza ${ROMAN[e.stanza]} echoes`); });
    });
  });

  // Side dots: one per movement, the current one drawn as a pill.
  const targets = [["top", "Amazing grace"], ...H.stanzas.map((l, s) => [`m${s + 1}`, `${ROMAN[s]} · ${l[0].replace(/[,;!]$/, "")}`]), ["book", "Its place in the book"], ["placed", "Where hymnals place it"]];
  const dots = document.createElement("nav");
  dots.className = "mv-dots";
  dots.setAttribute("aria-label", "Sections");
  dots.innerHTML = targets.map(([id, label]) => `<a href="#${id}" aria-label="${esc(label)}"><span>${esc(label)}</span></a>`).join("");
  document.body.append(dots);
  const links = [...dots.querySelectorAll("a")];
  const watch = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === `#${en.target.id}`));
  }), { rootMargin: "-45% 0px -45% 0px" });
  targets.forEach(([id]) => { const el = document.getElementById(id); if (el) watch.observe(el); });
})();
