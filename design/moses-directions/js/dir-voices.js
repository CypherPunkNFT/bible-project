// E · Face to face. Moses' life told only through the conversations Scripture records (data/voices.json, built word for
// word from the KJV text files). Speakers are presences; the LORD is shown as voice and light, never as a figure.
(() => {
  const TONE = { lord: "var(--fv-light)", moses: "var(--prophets)", pharaoh: "var(--revelation)", aaron: "var(--poetry)", miriam: "var(--gospels)", jethro: "var(--midian)",
    zipporah: "var(--acts)", joshua: "var(--epistles)", caleb: "var(--fv-caleb)", people: "var(--history)", others: "var(--muted)", narr: "var(--muted)" };
  const LANES = ["lord", "moses", "people", "pharaoh", "aaron", "miriam", "jethro", "zipporah", "joshua", "caleb", "others"];
  let V = null;
  const load = async () => { if (V) return V; const res = await fetch("data/voices.json"); if (!res.ok) throw new Error(`voices.json: expected 200, got ${res.status}`); V = await res.json(); return V; };
  const spk = (id) => V.speakers.find((s) => s.id === id);
  const fmt = (n) => n.toLocaleString("en-GB");

  // A presence: the LORD as light (rays and a glow, no figure); everyone else as a ring with an initial.
  const light = (size = 120) => `<svg class="fv-light" viewBox="-60 -60 120 120" width="${size}" height="${size}" aria-hidden="true">
      <defs><radialGradient id="fvg-${size}"><stop offset="0" stop-color="var(--fv-core)"/><stop offset=".35" stop-color="var(--fv-light)" stop-opacity=".9"/><stop offset="1" stop-color="var(--fv-light)" stop-opacity="0"/></radialGradient></defs>
      <circle r="58" fill="url(#fvg-${size})" class="fv-halo"/>
      <g class="fv-rays">${Array.from({ length: 24 }, (_, i) => { const a = (i * 15 * Math.PI) / 180, r0 = i % 2 ? 22 : 18, r1 = i % 2 ? 40 : 54; return `<line x1="${(Math.cos(a) * r0).toFixed(1)}" y1="${(Math.sin(a) * r0).toFixed(1)}" x2="${(Math.cos(a) * r1).toFixed(1)}" y2="${(Math.sin(a) * r1).toFixed(1)}"/>`; }).join("")}</g>
      <circle r="9" class="fv-core"/></svg>`;
  const avatar = (id, cls = "") => id === "lord" ? `<span class="fv-av is-lord ${cls}">${light(40)}</span>` : `<span class="fv-av ${cls}" style="--tone:${TONE[id]}">${esc((spk(id)?.name ?? "?").replace(/^The /, "")[0].toUpperCase())}</span>`;
  const presence = (s) => `<button type="button" class="fv-pres ${s.id === "lord" ? "is-lord" : ""}" data-who="${s.id}" style="--tone:${TONE[s.id]}" aria-pressed="false">
      ${s.id === "lord" ? light(132) : `<span class="fv-ring"><span>${esc(s.name.replace(/^The /, "")[0].toUpperCase())}</span></span>`}
      <b>${s.id === "lord" ? 'the L<small>ORD</small>' : esc(s.name)}</b><small class="fv-count"><span data-count="${s.id}">${fmt(s.words)}</span> words</small></button>`;

  // The score: one lane per speaker, every line a bar placed along the reading (words), episodes as columns.
  function scoreLayout() {
    const GAP = 70; let x = 0; const bars = [], cols = [];
    V.episodes.forEach((e, i) => {
      const start = x;
      V.lines.filter((l) => l.ep === e.id).forEach((l) => { const w = Math.max(l.words, 3); bars.push({ l, x, w }); x += w + 4; });
      cols.push({ e, i, x0: start, x1: x });
      x += GAP;
    });
    return { bars, cols, total: x - GAP };
  }
  const score = () => {
    const { bars, cols, total } = scoreLayout(), pc = (v) => ((v / total) * 100).toFixed(3);
    return `<div class="fv-score" data-score>
      <div class="fv-cols">${cols.map((c) => `<div class="fv-col" style="left:${pc(c.x0)}%;width:${pc(c.x1 - c.x0)}%"><button type="button" data-goto="${c.e.id}" title="${esc(c.e.title)}"><span>${String(c.i + 1).padStart(2, "0")}</span><em>${esc(c.e.title)}</em></button></div>`).join("")}<i class="fv-head" aria-hidden="true"></i></div>
      ${[...LANES, "narr"].map((id) => `<div class="fv-lane" data-lane="${id}" style="--tone:${TONE[id]}"><span class="fv-lane-name">${id === "narr" ? "Narrative" : id === "lord" ? "the L<small>ORD</small>" : esc(spk(id).name)}</span>
        <div class="fv-lane-track">${bars.filter((b) => b.l.who === id).map((b) => `<button type="button" class="fv-bar" data-line="${b.l.n}" data-x="${(b.x / total).toFixed(4)}" data-threads="${b.l.threads.join(" ")}" style="left:${pc(b.x)}%;width:${pc(b.w)}%" title="${esc(refText(b.l.ref))}"></button>`).join("")}</div></div>`).join("")}</div>`;
  };
  const shareStrip = () => {
    const list = V.speakers.filter((s) => s.words).sort((a, b) => b.words - a.words), sum = list.reduce((s, x) => s + x.words, 0);
    return `<div class="fv-share">${list.map((s) => `<span class="fv-seg" data-who="${s.id}" style="--tone:${TONE[s.id]};flex:${s.words}" title="${esc(s.name)}: ${fmt(s.words)} words in ${s.lines} lines">${s.words / sum > .06 ? `<b>${s.id === "lord" ? "the LORD" : esc(s.name)}</b><small>${Math.round((s.words / sum) * 100)}%</small>` : ""}</span>`).join("")}</div>
      <ol class="fv-rank">${list.map((s, i) => `<li data-who="${s.id}" style="--tone:${TONE[s.id]}"><span>${i + 1}</span>${avatar(s.id, "fv-av-sm")}<b>${s.id === "lord" ? 'the L<small>ORD</small>' : esc(s.name)}</b><em>${fmt(s.words)} words · ${s.lines} lines</em></li>`).join("")}</ol>`;
  };

  // The transcript. Moses on the left, the others on the right, the LORD across the middle, narrative between.
  const lineHtml = (l) => {
    const s = spk(l.who), side = l.who === "lord" ? "c" : l.who === "moses" ? "l" : "r";
    const threads = l.threads.map((t) => `<span class="fv-tag" data-t="${t}">${esc(V.threads.find((x) => x.id === t).name)}</span>`).join("");
    if (l.who === "narr") return `<div class="fv-line fv-narr" id="fv-l${l.n}" data-n="${l.n}" data-who="narr" data-threads="${l.threads.join(" ")}"><div class="fv-line-in"><p>${esc(l.text)}</p><footer>${refLink(l.ref)}<span>· the text's narrative</span></footer></div></div>`;
    return `<article class="fv-line" id="fv-l${l.n}" data-n="${l.n}" data-who="${l.who}" data-side="${side}" data-threads="${l.threads.join(" ")}" style="--tone:${TONE[l.who]}"><div class="fv-line-in">
      <header>${avatar(l.who)}<b>${l.who === "lord" ? 'the L<small>ORD</small>' : esc(s.name)}</b>${l.label ? `<span class="fv-lbl">${esc(l.label)}</span>` : ""}</header>
      <p>${esc(l.text)}</p><footer>${refLink(l.ref)}<span>· KJV</span>${threads}</footer></div></article>`;
  };
  const episode = (e, i) => {
    const ls = V.lines.filter((l) => l.ep === e.id), who = LANES.filter((id) => ls.some((l) => l.who === id));
    return `<section class="fv-ep" id="fv-${e.id}" data-ep="${e.id}">
      <header class="fv-ep-head"><span class="fv-ep-n">${String(i + 1).padStart(2, "0")}</span><div><span class="fv-ep-place">${icon("map", 13)}${esc(e.place)} · ${esc(e.refs)}</span><h3>${esc(e.title)}</h3>
        <div class="fv-ep-who">${who.map((id) => avatar(id, "fv-av-xs")).join("")}<span>${ls.filter((l) => l.who !== "narr").length} lines spoken</span></div></div></header>
      <div class="fv-thread">${ls.map(lineHtml).join("")}</div></section>`;
  };

  DIRECTIONS.voices = {
    name: "Face to face", swatch: "#d9a43a",
    mount(main) {
      main.innerHTML = `<div class="wrap fv-wait">${topline()}<p>Gathering the conversations…</p></div>`;
      let alive = true, obs = null;
      const cleanup = [];
      load().then(() => { if (alive) draw(); }).catch((error) => { console.error("voices: could not load data/voices.json", error); main.innerHTML = `<p class="wrap">Could not load the conversations: ${esc(error.message)}</p>`; });
      function draw() {
        const spoken = V.lines.filter((l) => l.who !== "narr");
        const order = ["moses", "pharaoh", "aaron", "miriam", "jethro", "lord", "zipporah", "joshua", "caleb", "people", "others"];
        main.innerHTML = `
          <section class="fv-hero"><div class="wrap">${topline()}
            <div class="fv-frame"><span class="fv-kick">Moses, in his own conversations</span>
              <p class="fv-quote-lead">And the L<small>ORD</small> spake unto Moses</p>
              <h1 class="fv-quote">${esc(V.frame.text.replace(/^And the LORD spake unto Moses /, ""))}</h1>
              <footer class="fv-quote-ref">${refLink(V.frame.ref)} · KJV <span class="fv-sep">/</span> “${esc(V.frame2.text.replace(/,$/, ""))} …” ${refLink(V.frame2.ref)}</footer>
              <p class="fv-lede">His life told only through what Scripture records being said: <b>${spoken.length}</b> spoken lines in <b>${V.episodes.length}</b> places, every word quoted from the King James Version, with the text's own narrative between.</p></div>
            <div class="fv-stage">${order.map((id) => presence(spk(id))).join("")}</div>
            <p class="fv-stage-note">Choose a voice to hear only them. Word counts are for the lines on this page.</p>
          </div></section>
          <section class="wrap fv-sec"><div class="fv-sec-head"><span class="fv-kick">Who speaks, and when</span><h2>The score of a life</h2><p>Every line on this page, in order. Each bar is one line, as long as its words; the gaps are the ten places. Choose a bar to read it.</p></div>
            <div class="fv-score-wrap">${score()}</div>
            <div class="fv-most"><h3>Who speaks most</h3>${shareStrip()}</div></section>
          <div class="fv-bar-wrap"><div class="wrap fv-ctl">
            <div class="fv-ctl-row"><span class="fv-ctl-k">Voices</span><div class="fv-chips">${["all", ...order].map((id) => `<button type="button" class="fv-chip" data-filter="${id}" style="--tone:${TONE[id] ?? "var(--ink)"}" aria-pressed="${id === "all"}"><span>${id === "all" ? "Everyone" : id === "lord" ? "the L<small>ORD</small>" : esc(spk(id).name)}</span></button>`).join("")}</div></div>
            <div class="fv-ctl-row"><span class="fv-ctl-k">Follow</span><div class="fv-chips">${V.threads.map((t) => `<button type="button" class="fv-chip fv-chip-t" data-thread="${t.id}" title="${esc(t.note)}" aria-pressed="false">${esc(t.name)}<em>${t.count}</em></button>`).join("")}</div>
              <div class="fv-nav" hidden><button type="button" data-step="-1" aria-label="Previous line in this thread">${icon("chevronLeft", 16)}</button><span class="fv-nav-n">1 / 1</span><button type="button" data-step="1" aria-label="Next line in this thread">${icon("chevronRight", 16)}</button></div></div>
            <p class="fv-ctl-note" hidden></p></div></div>
          <section class="wrap fv-talk"><nav class="fv-rail" aria-label="Places">${V.episodes.map((e, i) => `<a href="#voices" data-goto="${e.id}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(e.title)}</a>`).join("")}</nav>
            <div class="fv-eps">${V.episodes.map(episode).join("")}</div></section>
          <section class="wrap fv-method"><div class="fv-method-in"><span class="fv-kick">How this is made</span>
            <p>Every line is copied word for word from the King James Version text the site reads from, sliced at the speaker's first word. The speaker is whoever the verse says is speaking; where two speak together (Moses and Aaron, Miriam and Aaron, Joshua and Caleb) the line sits with the first named. Narrative lines are the text's own words. The threads to follow are a reading aid chosen by this site; they add no words.</p>
            <p class="fv-credit">${chip("scripture")} Verse text: King James Version.</p></div></section>`;
        wire();
      }
      function wire() {
        const sc = main.querySelector("[data-score]"), head = sc.querySelector(".fv-head"), bars = [...sc.querySelectorAll(".fv-bar")];
        const counts = [...main.querySelectorAll("[data-count]")], segs = [...main.querySelectorAll(".fv-seg")];
        let filter = "all", thread = null, threadIdx = 0;
        const lineX = Object.fromEntries(bars.map((b) => [b.dataset.line, Number(b.dataset.x)]));
        // The score plays: a playhead runs through the reading, each bar sounds as it passes, the word counts tally up.
        const play = (only = null) => {
          const list = only ? bars.filter((b) => b.dataset.threads.split(" ").includes(only)) : bars;
          Clock.run({ label: only ? `Following "${V.threads.find((t) => t.id === only).name}" through the score` : "The score plays: every line, in order", duration: only ? 2600 : 4200,
            frame: (p) => {
              const x = easeInOut(p);
              head.style.left = `${(x * 100).toFixed(2)}%`;
              bars.forEach((b) => { const on = Number(b.dataset.x) <= x + 1e-4; b.classList.toggle("is-on", on && (!only || list.includes(b))); });
              if (!only) counts.forEach((c) => { const said = V.lines.filter((l) => l.who === c.dataset.count && lineX[l.n] <= x + 1e-4).reduce((t, l) => t + l.words, 0); c.textContent = fmt(said); });
              segs.forEach((s, i) => s.style.setProperty("--in", clamp01(x * 1.6 - i * .06).toFixed(3)));
              sc.style.setProperty("--p", x.toFixed(3));
            },
            moving: (p) => [p < 1 && "playhead", p < 1 && "bars lighting", !only && p < 1 && "word counts", p < .9 && "share strip"].filter(Boolean) });
        };
        const lineEls = () => [...main.querySelectorAll(".fv-line")];
        const apply = () => {
          
          lineEls().forEach((el) => {
            const inThread = thread ? el.dataset.threads.split(" ").includes(thread) : true;
            const byWho = filter === "all" || el.dataset.who === filter;
            el.classList.toggle("is-shut", !(byWho && inThread));
            el.classList.toggle("is-thread", !!thread && inThread);
          });
          bars.forEach((b) => { const l = V.lines[b.dataset.line]; b.classList.toggle("is-muted", (filter !== "all" && l.who !== filter) || (!!thread && !l.threads.includes(thread))); });
          main.querySelectorAll(".fv-pres, [data-filter]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.who ?? b.dataset.filter) === filter)));
          main.querySelectorAll("[data-thread]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.thread === thread)));
          main.querySelectorAll(".fv-ep").forEach((ep) => ep.classList.toggle("is-empty", ![...ep.querySelectorAll(".fv-line")].some((l) => !l.classList.contains("is-shut"))));
          const nav = main.querySelector(".fv-nav"), note = main.querySelector(".fv-ctl-note");
          nav.hidden = !thread;
          const t = V.threads.find((x) => x.id === thread);
          note.hidden = !thread && filter === "all";
          note.textContent = thread ? `${t.note} A reading aid chosen by this site; the words are Scripture's.` : filter !== "all" ? `Showing only ${filter === "lord" ? "the LORD" : spk(filter).name}: ${spk(filter).lines} lines, ${fmt(spk(filter).words)} words.` : "";
          if (thread) { const list = threadList(); nav.querySelector(".fv-nav-n").textContent = `${Math.min(threadIdx + 1, list.length)} / ${list.length}`; }
        };
        const threadList = () => lineEls().filter((el) => !el.classList.contains("is-shut") && el.classList.contains("is-thread"));
        const goLine = (el) => { if (!el) return; el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.remove("is-flash"); void el.offsetWidth; el.classList.add("is-flash"); };
        const onClick = (e) => {
          const who = e.target.closest(".fv-pres, [data-filter]");
          if (who) { const id = who.dataset.who ?? who.dataset.filter; filter = filter === id && id !== "all" ? "all" : id; apply(); if (who.classList.contains("fv-pres")) main.querySelector(".fv-talk").scrollIntoView({ behavior: "smooth" }); return; }
          const th = e.target.closest("[data-thread]");
          if (th) { thread = thread === th.dataset.thread ? null : th.dataset.thread; threadIdx = 0; apply(); if (thread) { play(thread); goLine(threadList()[0]); } else play(); return; }
          const st = e.target.closest("[data-step]");
          if (st) { const list = threadList(); if (!list.length) return; threadIdx = (threadIdx + Number(st.dataset.step) + list.length) % list.length; apply(); goLine(list[threadIdx]); return; }
          const bar = e.target.closest(".fv-bar");
          if (bar) { const el = main.querySelector(`#fv-l${bar.dataset.line}`); if (el?.classList.contains("is-shut")) { filter = "all"; thread = null; apply(); } goLine(main.querySelector(`#fv-l${bar.dataset.line}`)); return; }
          const go = e.target.closest("[data-goto]");
          if (go) { e.preventDefault(); main.querySelector(`#fv-${go.dataset.goto}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }
        };
        main.addEventListener("click", onClick);
        cleanup.push(() => main.removeEventListener("click", onClick));
        // The rail follows the episode in view.
        obs = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) main.querySelectorAll(".fv-rail a").forEach((a) => a.classList.toggle("is-on", a.dataset.goto === en.target.dataset.ep)); }), { rootMargin: "-40% 0px -55% 0px" });
        main.querySelectorAll(".fv-ep").forEach((ep) => obs.observe(ep));
        apply();
        play();
      }
      return () => { alive = false; obs?.disconnect(); cleanup.forEach((f) => f()); };
    },
  };
})();
