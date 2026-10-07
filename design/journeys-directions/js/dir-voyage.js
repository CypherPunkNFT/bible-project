// Voyage: cinematic and bento. Six ribbons for six lives, a bento of people with Paul's real route in his tile,
// chapter cards, a wide film-like map whose traveller carries a name badge, and a numbered stop rail beneath it.
(() => {
  // Six ribbons leave one point together and fan out, each to its person's medallion.
  const ribbons = () => `<svg class="vy-ribbons" viewBox="0 0 1200 250" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><defs>${PEOPLE.map((p) => `<linearGradient id="vy-g-${p.id}" x1="0" x2="1"><stop offset="0" stop-color="var(--${p.tone})" stop-opacity="0"/><stop offset=".45" stop-color="var(--${p.tone})" stop-opacity=".5"/><stop offset="1" stop-color="var(--${p.tone})"/></linearGradient>`).join("")}</defs>
      ${PEOPLE.map((p, i) => {
        const ey = 22 + i * 41, ex = 930 + (i % 2) * 40;
        const d = `M40 125C${330 + i * 22} ${125 + (i - 2.5) * 8} ${560 + i * 18} ${ey} ${ex - 24} ${ey}`;
        return `<g class="vy-rib" style="--tone: var(--${p.tone}); --d: ${i * 0.16}s"><path class="vy-rib-glow" d="${d}" stroke="url(#vy-g-${p.id})"/><path class="vy-rib-line" pathLength="1" d="${d}" stroke="url(#vy-g-${p.id})"/><path class="vy-rib-flow" d="${d}"/>
          <g transform="translate(${ex} ${ey})"><g class="vy-rib-end"><circle r="18"/><g transform="translate(-12 -12) scale(.5)" class="vy-rib-ico">${EMBLEM[p.id].replace(/pathLength="1"/g, "")}</g><text x="30" y="5">${p.name}</text></g></g></g>`;
      }).join("")}<circle class="vy-rib-src" cx="40" cy="125" r="5"/></svg>`;

  // Paul's whole road, every chapter, drawn small from the real stops: the cover of his tile.
  const paulRoute = () => {
    const pts = CHAPTERS.flatMap((c) => c.stops.map((s) => GEO.project(s.at)));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), pad = 14;
    const vb = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2];
    const lines = CHAPTERS.filter((c) => c.route).map((c, i) => `<path pathLength="1" style="--d:${i * 0.25}s" d="M${c.stops.map((s) => GEO.project(s.at).map((v) => v.toFixed(1)).join(" ")).join("L")}"/>`).join("");
    return `<svg class="vy-paulmap" viewBox="${vb.map((v) => v.toFixed(1)).join(" ")}" aria-hidden="true"><g class="vy-pm-land">${GEO.landPaths().map(({ d }) => `<path d="${d}"/>`).join("")}</g><g class="vy-pm-route">${lines}</g>
      ${[...new Set(pts.map((p) => p.join()))].map((k) => { const [x, y] = k.split(","); return `<circle cx="${x}" cy="${y}" r="2.2"/>`; }).join("")}</svg>`;
  };

  const tile = (p, i) => `<button type="button" class="vy-tile vy-tile-${p.id}" data-j="person" data-person="${p.id}" aria-pressed="${JSTATE.person === p.id}" style="--tone: var(--${p.tone})">
      ${p.id === "paul" ? paulRoute() : ""}<span class="vy-tile-ico">${emblem(p.id, 64, 1.3)}</span>
      <span class="vy-tile-copy"><small class="vy-n">${pad2(i + 1)}</small><strong>${p.name}</strong><span>${p.sub}</span></span><span class="vy-tile-go">${icon("arrowRight", 16)}</span></button>`;

  const chapterCards = (s) => `<div class="vy-chapters" role="group" aria-label="Chapters">${CHAPTERS.map((c, i) => `<button type="button" data-j="chapter" data-i="${i}" aria-pressed="${i === s.chapter}">
      <span class="vy-cn">${pad2(i + 1)}</span><b>${esc(c.title)}</b><small>${yearsOf(c)} · ${c.stops.length} stops</small><span class="vy-cbar"><span ${i === s.chapter ? "data-progress" : ""}></span></span></button>`).join("")}</div>`;

  const rail = (ch) => `<div class="vy-rail-wrap"><ol class="vy-rail" style="--n: ${ch.stops.length}"><span class="vy-rail-line"><span data-progress></span></span>${ch.stops.map((st, i) => `<li><button type="button" data-j="stop" data-n="${i + 1}" data-stop="${i + 1}"><i>${i + 1}</i><span>${esc(st.name.replace(/, Cyprus$/, ""))}</span></button></li>`).join("")}</ol></div>`;

  const panel = (s, ch) => {
    const N = ch.stops.length;
    const left = `<div class="vy-over"><p class="kicker">${yearsOf(ch)}</p><h3>${esc(ch.title)}</h3><p>${esc(ch.summary)}</p>${ch.years ? `<p class="vy-dating">${DATING}</p>` : ""}</div>`;
    if (!s.stop) {
      const layers = [...new Set(ch.stops.map((x) => x.layer))];
      return `${left}<div class="vy-card vy-card-begin"><span class="vy-big">${N}</span><p>stops</p><div class="vy-layers">${layers.map((l) => layerBadge(l)).join("")}</div>${stepButtons("vy-steps")}</div>`;
    }
    const st = ch.stops[s.stop - 1];
    return `${left}<div class="vy-card"><p class="kicker">Stop ${s.stop} of ${N}</p><h4>${esc(st.name)}</h4>${layerBadge(st.layer)}${stopWords(st)}${stepButtons("vy-steps")}</div>`;
  };

  const journey = (s) => {
    const p = personOf();
    const head = `<header class="vy-jhead"><div><p class="kicker">Your journey</p><h2>${p.name}</h2><p>${p.sub}</p></div><div class="vy-lensbar"><span>Explore through</span>${lensButtons("vy-lenses")}</div></header>`;
    if (p.id !== "paul") return `<div class="vy-journey" style="--tone: var(--${p.tone})">${head}<div class="vy-soon"><span>${emblem(p.id, 160, .9)}</span><p>${PAGE.next}</p></div></div>`;
    const ch = CHAPTERS[s.chapter];
    return `<div class="vy-journey" style="--tone: var(--${p.tone})">${head}${chapterCards(s)}
      <div class="vy-film">
        <div class="vy-map" data-map></div>
        <div class="vy-film-title"><p class="kicker" data-film-years>${yearsOf(ch)}</p><b data-film-title>${esc(ch.title)}</b></div>
        <div class="vy-badge" aria-hidden="true"><span class="vy-badge-dot"></span><b data-badge></b></div>
        <div class="vy-ctl"><button type="button" data-j="replay" aria-label="Replay the journey" title="Replay">${icon("replay", 17)}</button><button type="button" data-j="toggle" class="vy-play" aria-label="Play">${icon("play", 17)}</button></div>
      </div>
      <div data-rail>${rail(ch)}</div>
      <div class="vy-bottom" data-panel aria-live="polite">${panel(s, ch)}</div>${keyList("vy-key")}</div>`;
  };

  const placeBadge = (root, map, x, y) => {
    const b = root.querySelector(".vy-badge");
    if (!b) return;
    const [sx, sy] = map.toScreen(x, y);
    b.style.transform = `translate(${sx.toFixed(1)}px, ${(sy - 18).toFixed(1)}px) translate(-50%, -100%)`;
  };
  DIRECTIONS.voyage = {
    id: "voyage", name: "Voyage", swatch: "var(--history)",
    mapOptions: { className: "v-voyage", pad: 0.12, reserve: () => ({ top: matchMedia("(max-width: 767px)").matches ? 0.08 : 0.12 }) },
    render: (s) => `${atlasFrame()}
      <header class="vy-hero"><p class="kicker">${PAGE.kicker}</p><h1>Follow a life.<br><span>See the story unfold.</span></h1><p>${PAGE.description}</p>${ribbons()}</header>
      <section class="vy-choose"><div class="vy-head"><h2>${PAGE.choose}</h2><span>Choose your starting point</span></div>
        <div class="vy-bento" role="group" aria-label="${PAGE.choose}">${PEOPLE.map(tile).join("")}</div></section>
      <section data-region="journey">${journey(s)}</section>`,
    journey, panel,
    onFrame: (root, info, map) => { placeBadge(root, map, info.x, info.y); const b = root.querySelector("[data-badge]"); if (b) b.textContent = `To ${info.to.name.replace(/, Cyprus$/, "")}`; root.querySelector(".vy-badge")?.classList.toggle("is-sea", info.sea); },
    onReach: (root, n, ch, map) => {
      const st = ch.stops[n - 1], b = root.querySelector("[data-badge]");
      if (b) b.textContent = st.name.replace(/, Cyprus$/, "");
      const [x, y] = GEO.project(st.at);
      placeBadge(root, map, x, y);
      root.querySelector(".vy-badge")?.classList.remove("is-sea");
      root.querySelector(`.vy-rail [data-stop="${n}"]`)?.scrollIntoView?.({ block: "nearest", inline: "center", behavior: "smooth" });
    },
    onChapter: (root, s) => {
      const ch = CHAPTERS[s.chapter];
      root.querySelector("[data-rail]").innerHTML = rail(ch);
      root.querySelector("[data-film-title]").textContent = ch.title;
      root.querySelector("[data-film-years]").textContent = yearsOf(ch);
      root.querySelectorAll(".vy-cbar > span").forEach((b, i) => { if (i === s.chapter) b.setAttribute("data-progress", ""); else { b.removeAttribute("data-progress"); b.style.setProperty("--p", 0); } });
    },
  };
})();
