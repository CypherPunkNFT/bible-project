// Direction B · Cinema. A full-screen opening where three witnesses' lines send threads into one variation unit, cycling
// slowly through the three cases; then one chapter per case with a giant numeral, a sky of faint dots, a line-art
// landscape along the foot, and scenes that slide sideways. Side dots with a pill keep the place.
window.Directions = window.Directions || {};
(() => {
  const { HERO, INTRO, LAYERS, CASES, readings, EDITIONS } = PM;
  const { sectionHead, figures, reasoning, closing } = PMX;

  // ── The opening: three lines, threads, one variation unit ──
  const HERO_ROWS = {
    galatians: [["p46", false, "papyrus"], ["sbl", false, "print"], ["na", false, "print"]],
    romans: [["sin", false, "parchment"], ["vat", false, "parchment"], ["sbl", false, "print"]],
    mark: [["sin", false, "parchment"], ["alex", false, "parchment"], ["p45", false, "papyrus"]],
  };
  function heroSvg() {
    const strip = (i) => {
      const y = 70 + i * 104;
      return `<g class="bh-strip" data-i="${i}">
        <path class="bh-mat bh-papyrus" d="M24 ${y - 30}l290 -4 8 14 -6 16 8 20 -10 14 -290 4 -6 -18 8 -22z"/>
        <path class="bh-mat bh-parchment" d="M24 ${y - 32}h296v60h-296z"/>
        <path class="bh-mat bh-print" d="M24 ${y - 28}h296"/><path class="bh-mat bh-print" d="M24 ${y + 26}h296"/>
        <text class="bh-sig" x="40" y="${y - 12}"></text>
        <text class="bh-line" x="40" y="${y + 14}" lang="grc"><tspan class="bh-before"></tspan><tspan class="bh-var"></tspan><tspan class="bh-after"></tspan></text>
      </g>`;
    };
    return `<svg class="bh-svg" viewBox="0 0 660 340" aria-hidden="true">
      <ellipse class="bh-unit" cx="540" cy="174" rx="98" ry="150"/>
      <ellipse class="bh-unit bh-unit-2" cx="540" cy="174" rx="112" ry="162"/>
      <text class="bh-unit-label" x="540" y="14">ONE VARIATION UNIT</text>
      <g class="bh-threads"></g>
      ${[0, 1, 2].map(strip).join("")}
      <g class="bh-reads"></g>
      <path class="ms-mark" d="M18 330h10m-5-5v10M640 20h10m-5-5v10"/>
    </svg>`;
  }
  function heroCycle(root) {
    const svg = root.querySelector(".bh-svg"), numeral = root.querySelector(".bh-numeral"), cap = root.querySelector(".bh-caption");
    let k = 0;
    const show = () => {
      const c = CASES[k], all = readings(c.id, false), rows = HERO_ROWS[c.id].map(([id, , mat]) => [all.find((r) => r.id === id), mat]);
      svg.classList.remove("is-in"); void svg.getBBox();
      numeral.textContent = c.num; cap.innerHTML = `<b>${esc(c.passage)}</b> · ${esc(c.title)} · ${rows.map(([r]) => esc(r.siglum)).join(", ")}`;
      root.style.setProperty("--tone", `var(${c.tone})`);
      const reads = [...new Set(rows.map(([r]) => (r.layer === "No surviving text" ? "no reading" : r.difference)))];
      rows.forEach(([r, mat], i) => {
        const g = svg.querySelector(`.bh-strip[data-i="${i}"]`);
        g.dataset.mat = mat; g.classList.toggle("is-lost", r.layer === "No surviving text");
        g.querySelector(".bh-sig").textContent = `${r.siglum} · ${r.name}`;
        g.querySelector(".bh-before").textContent = r.before ?? "";
        g.querySelector(".bh-var").textContent = r.difference;
        g.querySelector(".bh-after").textContent = r.after ?? "";
      });
      svg.querySelector(".bh-reads").innerHTML = reads.map((t, j) => `<text class="bh-read${t === "no reading" ? " is-lost" : ""}" x="540" y="${174 + (j - (reads.length - 1) / 2) * 70}"${c.id !== "mark" ? ' lang="grc"' : ""}>${esc(t)}</text>`).join("");
      // Threads from each variant to its reading, measured once the words are laid out.
      svg.querySelector(".bh-threads").innerHTML = rows.map(([r], i) => {
        const v = svg.querySelector(`.bh-strip[data-i="${i}"] .bh-var`).getBBox();
        const t = r.layer === "No surviving text" ? "no reading" : r.difference, j = reads.indexOf(t);
        const x1 = v.x + v.width / 2, y1 = v.y + v.height + 4, y2 = 174 + (j - (reads.length - 1) / 2) * 70 - 6, x2 = 540 - 70;
        const lost = r.layer === "No surviving text";
        return `<path class="bh-thread${lost ? " is-lost" : ""}${r.layer === "Critical edition" ? " is-ed" : ""}" d="M${x1} ${y1}C${x1} ${y1 + 40} ${x2 - 80} ${y2} ${lost ? x2 - 40 : x2} ${y2}"/>`;
      }).join("");
      requestAnimationFrame(() => svg.classList.add("is-in"));
      k = (k + 1) % CASES.length;
    };
    show();
    setInterval(show, 7000);
  }

  function landing(sec) {
    sec.innerHTML = `<div class="bh">
      <span class="bh-numeral" aria-hidden="true">I</span>
      <div class="bh-copy"><p class="hc-crumb"><a href="/study">Study</a><span>/</span><a href="/study/academic?area=texts">The Bible: formation &amp; transmission</a><span>/</span>02</p>
        <h1>A passage through<em>the manuscripts</em></h1>
        <p class="pm-hero-lead">${esc(HERO.lead)}</p>
        <p class="hc-lede">${esc(HERO.kicker)}, in three chapters: a spelling and a word order in Galatians, one vowel in Romans, and the ending of Mark. Each chapter is one screen; its scenes slide sideways.</p>
        <a class="pm-action" href="#b-prologue">Begin <span aria-hidden="true">↓</span></a></div>
      <figure class="bh-art">${heroSvg()}<figcaption class="bh-caption" aria-live="off"></figcaption><small class="bh-note">Typeset extracts, normalized · not facsimiles</small></figure>
    </div>${figures()}`;
    heroCycle(sec);
  }

  // ── Chapter landscapes along the foot, each slowly alive ──
  const LAND = {
    galatians: `<path class="bl-hill" d="M0 96C120 60 220 70 330 88S560 50 700 76 960 98 1200 70"/><path class="bl-hill bl-far" d="M0 70C160 40 300 56 420 48S700 24 860 44 1080 30 1200 40"/>
      <path class="bl-road" d="M610 120C600 104 660 98 640 86S600 74 630 64"/><path class="bl-stone" d="M720 92v-12h6v12M716 92h14"/><path class="bl-stone" d="M520 98v-9h5v9"/>
      <g class="bl-walker"><circle cx="0" cy="-14" r="2.4"/><path d="M0 -11v8l-3 6M0 -3l3 6M0 -9l-4 4M0 -9l5 2l2 -10"/></g>
      <g class="bl-cloud"><path d="M180 30c4-8 16-8 20 0 8-2 12 6 6 10h-30c-6-2-4-10 4-10z"/></g><g class="bl-cloud bl-cloud-2"><path d="M880 22c4-7 14-7 18 0 7-2 10 5 5 8h-27c-5-2-3-8 4-8z"/></g>`,
    romans: `<path class="bl-hill" d="M0 100C140 80 260 90 380 84S640 70 800 86 1040 92 1200 80"/>
      <g class="bl-arches">${Array.from({ length: 9 }, (_, i) => `<path d="M${120 + i * 34} 92v-30a17 17 0 0 1 34 0v30"/>`).join("")}<path d="M116 62h314"/></g>
      <g class="bl-temple"><path d="M760 92V58M778 92V58M796 92V58M814 92V58M832 92V58M850 92V58"/><path d="M752 58h106l-53-22z"/><path d="M748 92h114"/></g>
      <g class="bl-bird"><path d="M600 30q5-5 10 0q5-5 10 0"/></g><g class="bl-bird bl-bird-2"><path d="M650 22q4-4 8 0q4-4 8 0"/></g>
      <g class="bl-cloud"><path d="M980 30c4-8 16-8 20 0 8-2 12 6 6 10h-30c-6-2-4-10 4-10z"/></g>`,
    mark: `<path class="bl-hill" d="M0 100C200 86 380 96 520 90S820 80 1000 92 1120 96 1200 90"/>
      <path class="bl-rock" d="M560 100V60C560 40 590 26 640 26S720 40 724 60V100"/><path class="bl-door" d="M612 100V74a16 16 0 0 1 32 0V100"/>
      <circle class="bl-stoneround" cx="680" cy="84" r="16"/><path class="bl-stoneround" d="M672 84h16"/>
      <g class="bl-olive"><path d="M420 100V74M420 80c-10-4-18 0-22 -6M420 76c8-6 18-4 22-10"/><ellipse cx="406" cy="66" rx="12" ry="7"/><ellipse cx="436" cy="62" rx="12" ry="7"/></g>
      <g class="bl-sun"><circle cx="960" cy="70" r="16"/><g class="bl-rays">${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<path d="M${960 + Math.cos(a) * 22} ${70 + Math.sin(a) * 22}L${960 + Math.cos(a) * 30} ${70 + Math.sin(a) * 30}"/>`; }).join("")}</g></g>`,
    editions: `<path class="bl-hill" d="M0 100H1200"/>${Array.from({ length: 16 }, (_, i) => { const x = 340 + i * 30 + (i > 7 ? 30 : 0), h = 48 + ((i * 13) % 22); return `<path class="bl-book" d="M${x} 100v-${h}h22v${h}M${x + 4} ${100 - h + 8}h14"/>`; }).join("")}
      <g class="bl-lamp"><path d="M900 100h40M906 100l6-18h16l6 18M920 82v-8"/><path class="bl-flame" d="M920 74c-5-6 0-14 0-18 0 4 5 12 0 18z"/></g>`,
  };
  const land = (k) => `<svg class="bl" viewBox="0 0 1200 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${LAND[k]}</svg>`;
  const sky = () => `<svg class="bsky" viewBox="0 0 1200 90" preserveAspectRatio="none" aria-hidden="true">${Array.from({ length: 46 }, (_, i) => `<circle cx="${(i * 263) % 1200}" cy="${(i * 37) % 86 + 2}" r="${i % 5 === 0 ? 1.4 : 0.8}" style="--d:${(i % 7) * 0.9}s"/>`).join("")}</svg>`;

  // ── A chapter: numeral, heading, strip of copies, list of scenes; the stage slides between them ──
  function chapter(sec, { num, id, kicker, title, lead, book, keys, scenes, landKey }) {
    sec.classList.add("bc");
    sec.innerHTML = `${sky()}<span class="bc-numeral" aria-hidden="true">${num}</span>
      <div class="bc-grid">
        <div class="bc-side"><p class="kicker">Chapter ${num} · ${kicker}</p><h2>${title}</h2><p class="bc-lead">${lead}</p>
          ${book != null ? `<div class="bc-strip"></div>` : ""}
          <ol class="bc-scenes" role="group" aria-label="Scenes">${scenes.map((s, i) => `<li><button type="button" data-scene="${i}" aria-pressed="${i === 0}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(s.title)}</button></li>`).join("")}</ol>
          <div class="bc-arrows"><button type="button" data-step="-1" aria-label="Previous scene">${icon("arrowLeft", 16)}</button><button type="button" data-step="1" aria-label="Next scene">${icon("arrowRight", 16)}</button></div></div>
        <div class="bc-stage"><div class="bc-track">${scenes.map((s, i) => `<div class="bc-scene" data-i="${i}" aria-hidden="${i !== 0}"></div>`).join("")}</div></div>
      </div>${land(landKey)}`;
    if (book != null) Lane.strip(sec.querySelector(".bc-strip"), { book, keys });
    const sceneEls = [...sec.querySelectorAll(".bc-scene")];
    scenes.forEach((s, i) => { try { s.mount(sceneEls[i]); } catch (error) { console.error(`Direction B: chapter ${num} scene "${s.title}" failed`, error); sceneEls[i].innerHTML = `<p class="t-failed">This scene could not be drawn.</p>`; } });
    const track = sec.querySelector(".bc-track"), stage = sec.querySelector(".bc-stage");
    let at = 0;
    const go = (i) => {
      at = (i + scenes.length) % scenes.length;
      track.style.transform = `translateX(${-at * 100}%)`;
      sceneEls.forEach((el, j) => { el.setAttribute("aria-hidden", String(j !== at)); el.inert = j !== at; });
      sec.querySelectorAll("[data-scene]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.scene) === at)));
      stage.style.height = `${sceneEls[at].scrollHeight}px`;
    };
    sec.addEventListener("click", (e) => {
      const b = e.target.closest("[data-scene]"); if (b) go(Number(b.dataset.scene));
      const s = e.target.closest("[data-step]"); if (s && sec.contains(s) && s.closest(".bc-arrows")) go(at + Number(s.dataset.step));
    });
    new ResizeObserver(() => { stage.style.height = `${sceneEls[at].scrollHeight}px`; }).observe(sceneEls[0].parentElement);
    sceneEls.forEach((el) => new ResizeObserver(() => { if (el === sceneEls[at]) stage.style.height = `${el.scrollHeight}px`; }).observe(el));
    go(0);
  }
  const deskScene = (id) => ({ title: "The readings", mount: (el) => Desk.mount(el, { caseId: id, menu: false }) });
  const reasonScene = (id) => ({ title: "How an editor reasons", mount: (el) => { el.innerHTML = reasoning(id); } });
  const keyList = (pairs) => pairs.map(([rec, label]) => ({ rec, label }));

  function prologue(sec) {
    sec.classList.add("bp");
    sec.innerHTML = `${sectionHead("", "Prologue · Before comparing", "Keep the layers <em>apart.</em>", esc(INTRO))}
      <ol class="bp-layers">${LAYERS.map(([t, d], i) => `<li><svg viewBox="0 0 80 60" aria-hidden="true">${["<path d='M14 50l10-40 30-4 14 12-4 30z'/><path d='M22 20h30M20 28h34M19 36h26' opacity='.5'/>", "<path d='M10 12h60v40H10z'/><path d='M18 22h20M42 22l2 6M18 32h14M36 32h4M44 32h12M18 42h26' opacity='.6'/>", "<path d='M10 12h60v40H10z'/><path d='M18 22h44M18 30h44M18 38h30'/><path d='M18 46h24' stroke-dasharray='2 2' opacity='.6'/>"][i]}</svg><span>0${i + 1}</span><b>${esc(t)}</b><small>${esc(d)}</small></li>`).join("")}</ol>`;
  }

  function mount(wrap) {
    const add = (id, cls = "") => { const s = document.createElement("section"); s.id = id; s.className = `t-sec pm-sec ${cls}`; wrap.append(s); return s; };
    const run = (name, fn) => { try { fn(); } catch (error) { console.error(`Direction B: ${name} failed`, error); } };
    run("landing", () => landing(add("b-landing", "b-landing")));
    run("prologue", () => prologue(add("b-prologue")));
    run("chapter I", () => chapter(add("b-gal"), { num: "I", kicker: "Galatians 1:3–4", title: "Spelling &amp; order. <em>Small differences, different kinds.</em>", lead: esc(CASES[0].context), book: 47,
      keys: keyList([["Q1513469", "P46"], ["Q209285", "B"], ["Q152962", "א"]]), landKey: "galatians",
      scenes: [deskScene("galatians"), { title: "Read the apparatus", mount: (el) => CloseReading.apparatus(el) },
        { title: "At the broken edge", mount: (el) => { el.innerHTML = `<p class="kicker">Galatians 1:4</p><h3 class="b-scene-h">${PM.EDGE.title}</h3><p class="cr-lead">${esc(PM.EDGE.lead)}</p><div></div>`; Evidence.edge(el.lastElementChild); } },
        reasonScene("galatians")] }));
    run("chapter II", () => chapter(add("b-rom"), { num: "II", kicker: "Romans 5:1", title: "A changed vowel. <em>One letter, a different force.</em>", lead: esc(CASES[1].context), book: 44,
      keys: keyList([["Q1513469", "P46"], ["Q209285", "B"], ["Q152962", "א"]]), landKey: "romans",
      scenes: [deskScene("romans"), { title: "Three questions", mount: (el) => CloseReading.lenses(el) }, reasonScene("romans")] }));
    run("chapter III", () => chapter(add("b-mark"), { num: "III", kicker: "Mark 16:8–20", title: "A disputed ending. <em>Twelve verses, several histories.</em>", lead: esc(CASES[2].context), book: 40,
      keys: keyList([["Q697885", "P45"], ["Q209285", "B"], ["Q152962", "א"], ["Q318233", "A"], ["Q6870196", "304"]]), landKey: "mark",
      scenes: [deskScene("mark"), { title: "Read the join", mount: (el) => CloseReading.endings(el) },
        { title: "An unfinished book? GA 304", mount: (el) => { el.innerHTML = `<p class="kicker">When scholarship changes the evidence</p><h3 class="b-scene-h">${PM.GA304.title}</h3><div></div>`; Evidence.ga304(el.lastElementChild, { loop: true }); } },
        { title: "Try the distinction: P45", mount: (el) => Evidence.quiz(el) }, reasonScene("mark")] }));
    run("chapter IV", () => chapter(add("b-eds"), { num: "IV", kicker: "The work behind the printed line", title: "An edition is an argument <em>that can be revised.</em>", lead: esc(EDITIONS.lead), book: null, landKey: "editions",
      scenes: [{ title: "The editions, 1857 → 2021", mount: (el) => Evidence.editions(el) }, { title: "Why counting cannot decide", mount: (el) => Evidence.copying(el) }] }));
    run("closing", () => { const s = add("b-close", "b-close"); s.innerHTML = closing(""); });
    run("rail", () => rail(wrap));
  }

  // Side dots with a pill that slides to the chapter in view.
  const STOPS = [["b-landing", "Opening"], ["b-prologue", "Prologue"], ["b-gal", "I · Galatians"], ["b-rom", "II · Romans"], ["b-mark", "III · Mark"], ["b-eds", "IV · The editions"], ["b-close", "Sources"]];
  function rail(wrap, stops = STOPS) {
    const nav = document.createElement("nav");
    nav.className = "mg-rail b-rail"; nav.setAttribute("aria-label", "Chapters");
    nav.innerHTML = `<i class="mg-rail-pill" aria-hidden="true"></i>${stops.map(([id, label]) => `<a href="#${id}"><i></i><span>${esc(label)}</span></a>`).join("")}`;
    document.body.append(nav);
    const pill = nav.querySelector(".mg-rail-pill"), links = [...nav.querySelectorAll("a")];
    const set = (i) => { links.forEach((a, j) => (j === i ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"))); pill.style.transform = `translateY(${links[i].offsetTop - 6}px)`; };
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (vis) set(stops.findIndex(([id]) => id === vis.target.id));
    }, { rootMargin: "-40% 0px -50% 0px" });
    stops.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    set(0);
  }
  window.Directions.b = { mount, parts: { prologue, chapter, deskScene, reasonScene, keyList, rail } };
})();
