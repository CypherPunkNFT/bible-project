// Pilgrim: the site's own warm atlas, grown up. A dawn-road illustration, sealed emblem cards, a chapter rail that
// fills as you go, and a stepper beside the map that lights each stop as the traveller reaches it.
(() => {
  const hero = () => `<svg class="pg-art" viewBox="0 0 560 340" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="pg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="pg-sky1"/><stop offset="1" class="pg-sky2"/></linearGradient>
      <radialGradient id="pg-sun" cx=".5" cy=".5" r=".5"><stop offset="0" class="pg-sun1"/><stop offset="1" class="pg-sun2"/></radialGradient>
      <clipPath id="pg-clip"><rect width="560" height="340" rx="22"/></clipPath>
    </defs>
    <g clip-path="url(#pg-clip)">
      <rect width="560" height="340" fill="url(#pg-sky)"/>
      <g class="pg-stars">${[[60, 40], [120, 70], [210, 30], [300, 55], [470, 36], [520, 80], [430, 92], [250, 96], [170, 44], [40, 110]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1 : 1.6}" style="animation-delay:${i * 0.37}s"/>`).join("")}</g>
      <circle class="pg-glow" cx="392" cy="176" r="150" fill="url(#pg-sun)"/>
      <circle class="pg-sundisc" cx="392" cy="176" r="40"/>
      <path class="pg-birds" d="M300 104q5-5 10 0q5-5 10 0M330 88q4-4 8 0q4-4 8 0M282 122q3-3 6 0q3-3 6 0"/>
      <path class="pg-hill pg-hill-far" d="M0 214C60 188 120 178 190 192S300 176 360 186 470 170 560 184V340H0z"/>
      <g class="pg-city"><path d="M372 188v-14h6v-6l4-4 4 4v6h6v14M398 188v-9a6 6 0 0 1 12 0v9M414 188v-18h4v-4h4v4h4v18M352 188v-8h8v8"/></g>
      <path class="pg-hill pg-hill-mid" d="M0 248C70 222 150 214 230 228S360 206 440 218 520 210 560 214V340H0z"/>
      <path class="pg-hill pg-hill-near" d="M0 288C90 262 170 270 250 284S420 268 560 280V340H0z"/>
      <path class="pg-road-bed" d="M118 340C160 312 150 292 214 276S322 248 300 230 352 206 388 190"/>
      <path id="pg-road" class="pg-road" d="M118 340C160 312 150 292 214 276S322 248 300 230 352 206 388 190"/>
      ${[[132, 326], [176, 292], [246, 266], [308, 238], [336, 214], [378, 194]].map(([x, y], i) => `<circle class="pg-mile" cx="${x}" cy="${y}" r="3.4" style="animation-delay:${0.9 + i * 1.1}s"/>`).join("")}
      <g class="pg-tent" transform="translate(70 262)"><path d="M0 22 14 2l14 20M14 2v20M14 22l-5-8M-6 22h40"/></g>
      <g class="pg-tent pg-tent-2" transform="translate(470 246) scale(.7)"><path d="M0 22 14 2l14 20M14 2v20M14 22l-5-8M-6 22h40"/></g>
      <g class="pg-walker"><circle r="9" class="pg-walker-halo"/><circle r="4.2" class="pg-walker-dot"/>
        <animateMotion dur="9s" repeatCount="indefinite" rotate="0" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#pg-road"/></animateMotion></g>
    </g>
  </svg>`;

  const card = (p, i) => `<button type="button" class="pg-person draw-on-hover" data-j="person" data-person="${p.id}" aria-pressed="${JSTATE.person === p.id}" style="--tone: var(--${p.tone})">
      <span class="pg-seal">${emblem(p.id, 40, 1.5)}</span>
      <span class="pg-pnum">${pad2(i + 1)}</span>
      <strong>${p.name}</strong><small>${p.sub}</small>
      <span class="pg-pgo">${icon("arrowRight", 15)}</span>
    </button>`;

  const rail = (s) => `<div class="pg-rail-wrap"><div class="pg-rail" role="group" aria-label="Chapters" style="--sel: ${s.chapter}; --n: ${CHAPTERS.length}">
      <span class="pg-rail-track" aria-hidden="true"><span></span></span>
      ${CHAPTERS.map((c, i) => `<button type="button" data-j="chapter" data-i="${i}" aria-pressed="${i === s.chapter}"><i>${pad2(i + 1)}</i><b>${esc(c.title)}</b><small>${yearsOf(c)}</small></button>`).join("")}
    </div></div>`;

  const panel = (s, ch) => {
    const N = ch.stops.length;
    const progress = `<div class="pg-progress"><div class="pg-bar" data-progress><span></span></div><span class="pg-count"><b data-count>1 of ${N}</b> stops</span></div>`;
    if (!s.stop) return `${progress}
      <p class="kicker">${yearsOf(ch) || "Paul's letters"}</p><h3>${esc(ch.title)}</h3>
      <p class="pg-summary">${esc(ch.summary)}</p>${ch.years ? `<p class="pg-dating">${DATING}</p>` : ""}
      <ol class="pg-stops">${ch.stops.map((st, i) => `<li><button type="button" data-j="stop" data-n="${i + 1}" data-stop="${i + 1}"><span class="pg-n">${i + 1}</span><span class="pg-sn">${esc(st.name)}</span>${st.layer !== "scripture" ? layerBadge(st.layer) : ""}</button></li>`).join("")}</ol>
      ${stepButtons("pg-steps")}`;
    const st = ch.stops[s.stop - 1];
    return `${progress}
      <p class="kicker">${esc(ch.title)} · stop ${s.stop} of ${N}</p><h3 class="pg-stop-name">${esc(st.name)}</h3>${layerBadge(st.layer)}
      <div class="pg-stop-words">${stopWords(st)}</div>
      <div class="pg-dots" aria-label="Stops">${ch.stops.map((x, i) => `<button type="button" data-j="stop" data-n="${i + 1}" data-stop="${i + 1}" aria-label="${esc(x.name)}"></button>`).join("")}</div>
      ${stepButtons("pg-steps")}`;
  };

  const journey = (s) => {
    const p = personOf();
    const head = `<header class="pg-jhead"><span class="pg-seal pg-seal-lg emblem-draw-in">${emblem(p.id, 46, 1.4)}</span>
      <div><p class="kicker">Your journey</p><h2>${p.name}<span>${p.sub}</span></h2></div>
      <div class="pg-lensbar"><span>Explore through</span>${lensButtons("pg-lenses")}</div></header>`;
    if (p.id !== "paul") return `<div class="pg-journey" style="--tone: var(--${p.tone})">${head}
      <div class="pg-soon"><span class="pg-soon-art">${emblem(p.id, 120, 1)}</span><div><p class="kicker">${p.name}</p><h3>${p.sub}</h3><p>${PAGE.next}</p></div></div></div>`;
    return `<div class="pg-journey" style="--tone: var(--${p.tone})">${head}${rail(s)}
      <div class="pg-stage">
        <div class="pg-map" data-map>
          <div class="pg-map-ctl"><button type="button" data-j="toggle" aria-label="Play">${icon("play", 16)}</button><button type="button" data-j="replay" aria-label="Replay the journey" title="Replay">${icon("replay", 16)}</button></div>
          <div class="pg-here"><span class="pg-here-dot"></span><b data-here></b></div>
        </div>
        <aside class="pg-panel" data-panel aria-live="polite">${panel(s, CHAPTERS[s.chapter])}</aside>
      </div>${keyList("pg-key")}</div>`;
  };

  DIRECTIONS.pilgrim = {
    id: "pilgrim", name: "Pilgrim", swatch: "var(--epistles)",
    mapOptions: { className: "v-pilgrim", relief: true, pad: 0.14, reserve: { top: 0.07 } },
    render: (s) => `${atlasFrame()}
      <header class="pg-hero"><div class="pg-hero-copy"><p class="kicker">${PAGE.kicker}</p><h1>Follow a life.<br><em>See the story unfold.</em></h1><p>${PAGE.description}</p></div>${hero()}</header>
      <section class="pg-choose"><div class="pg-head"><h2>${PAGE.choose}</h2><span>Choose your starting point</span></div>
        <div class="pg-people" role="group" aria-label="${PAGE.choose}">${PEOPLE.map(card).join("")}</div></section>
      <section data-region="journey">${journey(s)}</section>`,
    journey, panel,
    onChapter: (root, s) => root.querySelector(".pg-rail")?.style.setProperty("--sel", s.chapter),
  };
})();
