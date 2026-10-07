// Starlight: the journeys as a night chart. A sky of six constellations (one per life), glowing medallions to choose
// from, and one immersive map with a glass panel floating over it and a chapter scrubber along its foot.
(() => {
  // Each constellation is a small figure echoing its emblem: [x, y] stars and the lines between them (indexes).
  const SKY = [
    { id: "paul", at: [395, 52], pts: [[0, 60], [40, 40], [80, 52], [120, 22], [165, 34], [205, 8], [250, 26]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]] },
    { id: "abraham", at: [372, 168], pts: [[0, 60], [34, 0], [68, 60], [34, 60], [20, 34]], lines: [[0, 1], [1, 2], [0, 3], [3, 2], [1, 3]] },
    { id: "moses", at: [604, 150], pts: [[0, 50], [0, 12], [14, 0], [28, 12], [28, 50], [40, 50], [40, 12], [54, 0], [68, 12], [68, 50]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [5, 6], [6, 7], [7, 8], [8, 9]] },
    { id: "ruth", at: [492, 196], pts: [[30, 70], [30, 10], [0, 20], [60, 20], [12, 0], [48, 0]], lines: [[0, 1], [0, 2], [0, 3], [2, 4], [3, 5]] },
    { id: "david", at: [418, 282], pts: [[0, 0], [8, 40], [28, 60], [48, 40], [56, 0], [28, 18]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 3]] },
    { id: "peter", at: [574, 292], pts: [[0, 20], [70, 20], [58, 40], [12, 40], [30, -20], [30, 20]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5]] },
  ];
  const constellations = () => SKY.map((c, ci) => {
    const p = personOf(c.id), [ox, oy] = c.at;
    const pts = c.pts.map(([x, y]) => [x + ox, y + oy]);
    const lines = c.lines.map(([a, b], li) => `<path pathLength="1" d="M${pts[a][0]} ${pts[a][1]}L${pts[b][0]} ${pts[b][1]}" style="animation-delay:${0.4 + ci * 0.35 + li * 0.12}s"/>`).join("");
    const stars = pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 2.6 : 1.9}" style="animation-delay:${(ci * 0.7 + i * 0.45) % 4}s"/>`).join("");
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const lx = (Math.min(...xs) + Math.max(...xs)) / 2, ly = Math.max(...ys) + 20;
    return `<g class="sl-const" style="--tone: var(--${p.tone})"><g class="sl-lines">${lines}</g><g class="sl-stars">${stars}</g><text x="${lx}" y="${ly}" text-anchor="middle">${p.name.toUpperCase()}</text></g>`;
  }).join("");
  const dust = () => Array.from({ length: 70 }, (_, i) => {
    const x = (i * 137.5) % 700, y = (i * 71.3 + (i % 7) * 13) % 380;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 9 === 0 ? 1.3 : 0.7}" style="animation-delay:${(i % 11) * 0.4}s"/>`;
  }).join("");
  const hero = () => `<header class="sl-hero">
      <svg class="sl-dustfield" viewBox="0 0 700 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="sl-dust">${dust()}</g></svg>
      <svg class="sl-sky" viewBox="345 25 360 340" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${constellations()}
        <path class="sl-comet" d="M690 40 L590 90"/></svg>
      <div class="sl-hero-copy"><p class="kicker">${PAGE.kicker}</p><h1>Follow a life.<br>See the story unfold.</h1><p>${PAGE.description}</p></div>
    </header>`;

  const medal = (p) => `<button type="button" class="sl-medal" data-j="person" data-person="${p.id}" aria-pressed="${JSTATE.person === p.id}" style="--tone: var(--${p.tone})">
      <span class="sl-orb"><span class="sl-orbit" aria-hidden="true"></span>${emblem(p.id, 44, 1.5)}</span><strong>${p.name}</strong><small>${p.sub}</small></button>`;

  const scrub = (s) => `<div class="sl-scrub">
      <div class="sl-ctl"><button type="button" data-j="toggle" aria-label="Play">${icon("play", 16)}</button><button type="button" data-j="replay" aria-label="Replay the journey" title="Replay">${icon("replay", 16)}</button></div>
      <div class="sl-segs" role="group" aria-label="Chapters">${CHAPTERS.map((c, i) => `<button type="button" data-j="chapter" data-i="${i}" aria-pressed="${i === s.chapter}">
        <span class="sl-seg-bar"><span ${i === s.chapter ? "data-progress" : ""}></span></span><b>${pad2(i + 1)} · ${esc(c.title)}</b><small>${yearsOf(c)}</small></button>`).join("")}</div></div>`;

  const panel = (s, ch) => {
    const N = ch.stops.length;
    if (!s.stop) return `<p class="kicker">${yearsOf(ch)}</p><h3>${esc(ch.title)}</h3><p class="sl-sum">${esc(ch.summary)}</p>${ch.years ? `<p class="sl-dating">${DATING}</p>` : ""}
      <ol class="sl-chips">${ch.stops.map((st, i) => `<li><button type="button" data-j="stop" data-n="${i + 1}" data-stop="${i + 1}"><i>${i + 1}</i>${esc(st.name.replace(/, Cyprus$/, ""))}${st.layer !== "scripture" ? ` <em class="sl-l sl-l-${st.layer}">${LAYER[st.layer]}</em>` : ""}</button></li>`).join("")}</ol>
      ${stepButtons("sl-steps")}`;
    const st = ch.stops[s.stop - 1];
    return `<p class="kicker">${esc(ch.title)} · stop ${s.stop} of ${N}</p><h3 class="sl-big">${esc(st.name)}</h3>${layerBadge(st.layer, "sl-l")}<div class="sl-words">${stopWords(st)}</div>
      <div class="sl-trail" aria-hidden="true">${ch.stops.map((x, i) => `<span data-stop="${i + 1}"></span>`).join("")}</div>${stepButtons("sl-steps")}`;
  };

  const journey = (s) => {
    const p = personOf();
    const head = `<header class="sl-jhead"><span class="sl-orb sl-orb-sm">${emblem(p.id, 30, 1.5)}</span><div><p class="kicker">Your journey</p><h2>${p.name} <span>${p.sub}</span></h2></div>${lensButtons("sl-lenses")}</header>`;
    if (p.id !== "paul") return `<div class="sl-journey" style="--tone: var(--${p.tone})">${head}<div class="sl-stage sl-soon"><div class="sl-soon-in"><span class="sl-orb sl-orb-xl">${emblem(p.id, 84, 1.2)}</span><h3>${p.sub}</h3><p>${PAGE.next}</p></div></div></div>`;
    return `<div class="sl-journey" style="--tone: var(--${p.tone})">${head}
      <div class="sl-stage">
        <div class="sl-map" data-map></div>
        <div class="sl-here"><span class="sl-spark"></span><b data-here></b><span class="sl-count" data-count></span></div>
        <aside class="sl-panel slim" data-panel aria-live="polite">${panel(s, CHAPTERS[s.chapter])}</aside>
        ${scrub(s)}
      </div>${keyList("sl-key")}</div>`;
  };

  const wide = () => matchMedia("(min-width: 900px)").matches;
  DIRECTIONS.starlight = {
    id: "starlight", name: "Starlight", swatch: "#6b7fd6",
    mapOptions: { className: "v-starlight", pad: 0.12, reserve: () => (wide() ? { right: 0.33, bottom: 0.14, top: 0.06 } : { top: 0.12 }) },
    render: (s) => `${atlasFrame()}${hero()}
      <section class="sl-choose"><div class="sl-head"><h2>${PAGE.choose}</h2><span>Choose your starting point</span></div>
        <div class="sl-medals" role="group" aria-label="${PAGE.choose}">${PEOPLE.map(medal).join("")}</div></section>
      <section data-region="journey">${journey(s)}</section>`,
    journey, panel,
    onChapter: (root, s) => root.querySelectorAll(".sl-seg-bar > span").forEach((b, i) => { if (i === s.chapter) b.setAttribute("data-progress", ""); else { b.removeAttribute("data-progress"); b.style.setProperty("--p", i < s.chapter ? 1 : 0); } }),
    afterMount: (root, s) => DIRECTIONS.starlight.onChapter(root, s),
    afterJourney: (root, s) => DIRECTIONS.starlight.onChapter(root, s),
  };
})();
