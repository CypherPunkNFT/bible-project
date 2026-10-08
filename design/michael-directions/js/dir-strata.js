// Direction C, "Strata": the evidence itself is the picture. A cross-section from the surface down to bedrock:
// scholars' readings, later tradition, early church writers, Jewish writings outside the Bible, and Scripture at the
// bottom. A drill core descends through it (the ticker steps it); every find is a specimen that opens beside it.
(() => {
  const LAYERS = [
    { id: "scholars", name: "Scholars' readings", dates: "1551–1906", note: "commentaries and lexicons", icon: "feather" },
    { id: "later", name: "Later tradition", dates: "AD 300s onward", note: "ranks, feasts, shrines, rabbinic sayings", icon: "landmark" },
    { id: "church", name: "Early church writers", dates: "about AD 200–230", note: "Clement, Origen", icon: "scroll" },
    { id: "jewish", name: "Jewish writings outside the Bible", dates: "pre-Maccabean to AD 30 (Charles)", note: "1 Enoch, the Assumption of Moses", icon: "book" },
    { id: "scripture", name: "Scripture", dates: "the text itself", note: "the five passages, King James Version", icon: "gem" },
  ];
  const SCHOLARS = { "calvin-dan": "Calvin", "calvin-jude": "Calvin", hengstenberg: "Hengstenberg", "keil-dan": "Keil", fausset: "Fausset", "charles-asm": "Charles", bdb: "BDB", strong: "Strong", thayer: "Thayer", easton: "Easton", hitchcock: "Hitchcock" };
  const layerOfCite = (id) => (id in SCHOLARS ? "scholars" : id === "clement" || id === "origen" ? "church" : "later");

  // Every find, by layer. Scholars are gathered by person, with every place their words appear on the page.
  function finds() {
    const out = { scripture: [], jewish: [], church: [], later: [], scholars: [] };
    M.passages.forEach((p) => out.scripture.push({ id: `p-${p.id}`, kind: "passage", title: p.short, sub: p.title, when: "Scripture", sort: p.n, p }));
    M.tradition.forEach((t) => out[t.stratum].push({ id: `t-${t.id}`, kind: "trad", title: t.title, when: t.when.replace(/\s\([^()]*\)$/, ""), sort: t.sort, t }));
    const people = {};
    const add = (who, year, sort, item) => { const k = who === "J. A. Bengel" ? "Bengel" : who; (people[k] ??= { who: k, years: new Set(), sort, items: [] }); people[k].years.add(year); people[k].sort = Math.min(people[k].sort, sort); people[k].items.push(item); };
    M.questions.forEach((q) => q.views.forEach((v) => v.holders.forEach((h) => { if (layerOfCite(h.cite) === "scholars" || h.who.includes("Bengel")) add(h.who.replace(/^(John|E\. W\.|C\. F\.|A\. R\.|R\. H\.) /, ""), h.when, Number(h.when.replace(/\D/g, "").slice(0, 4)), { q: q.q, view: v.view, h }); })));
    [...M.name.meanings, M.name.outlier].forEach((m) => add(m.who.split(", on ")[0], m.when, Number(m.when), { meaning: m }));
    Object.values(people).forEach((s) => out.scholars.push({ id: `s-${s.who.replace(/\W/g, "")}`, kind: "scholar", title: s.who, when: [...s.years].sort().join(", "), sort: s.sort, s }));
    Object.values(out).forEach((l) => l.sort((a, b) => a.sort - b.sort));
    return out;
  }

  const findBtn = (f, layer) => `<button type="button" class="s-find" data-find="${f.id}" data-layer="${layer}">
      <span class="s-spec">${icon(layer === "scripture" ? "gem" : LAYERS.find((l) => l.id === layer).icon, layer === "scripture" ? 26 : 20, 1.5)}</span>
      <span class="s-find-t"><b>${esc(f.title)}</b><small>${esc(layer === "scripture" ? f.sub : f.when)}</small></span></button>`;

  function panel(f) {
    if (!f) return `<div class="s-empty">${icon("drill", 40, 1.2)}<h3>Choose a find</h3><p>Every specimen in the section opens here: what it says, when it was written, and where to read it.</p></div>`;
    const L = (id) => LAYERS.find((l) => l.id === id);
    if (f.kind === "passage") {
      const p = f.p;
      return `<span class="layer" data-layer="scripture">Scripture · bedrock</span><h3>${esc(p.short)} · ${esc(p.title)}</h3><p class="s-where">${esc(p.where)} · ${esc(p.when)}</p>${passageBody(p)}<div class="s-says">${passageSays(p)}</div>`;
    }
    if (f.kind === "trad") {
      const t = f.t;
      return `${chip(t.layer, STRATUM[t.stratum])}<p class="s-when">${esc(t.when)}</p><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p>${t.quote ? `<blockquote class="s-quote">${esc(t.quote)}</blockquote>` : ""}
        <footer class="s-foot">${t.refs ? refList(t.refs) + '<span class="ref-sep">·</span>' : ""}${cites(t.cites)}</footer>${t.stratum !== "later" ? `<p class="s-warn">${icon("shield", 14)}${esc(L(t.stratum === "jewish" ? "jewish" : "church").name)}: tradition with a date, never evidence for what Scripture says.</p>` : ""}`;
    }
    const s = f.s;
    return `<span class="layer" data-layer="scholars">Scholars' reading</span><p class="s-when">${esc([...s.years].join(", "))}</p><h3>${esc(s.who)}</h3>
      ${s.items.map((it) => it.meaning ? `<div class="s-item"><small>On the name</small><blockquote class="s-quote">${esc(it.meaning.text)}</blockquote><footer class="s-foot">${cites(it.meaning.cites)}</footer></div>`
        : `<div class="s-item"><small>${esc(it.q)} · view: ${esc(it.view)}</small><blockquote class="s-quote">${esc(it.h.quote)}</blockquote>${it.h.note ? `<p class="s-note">${esc(it.h.note)}</p>` : ""}<footer class="s-foot">${citeLink(it.h.cite)}</footer></div>`).join("")}`;
  }

  const section = (F) => `<section class="s-section" aria-label="The evidence as layers">
      <div class="s-axis" aria-hidden="true"><span class="s-surface">surface · later readers</span><span class="s-bed">bedrock · the text</span></div>
      <div class="s-stack">${LAYERS.map((l, i) => `<div class="s-band" data-layer="${l.id}" style="--i:${i}">
          <header class="s-band-head"><span class="badge badge-sm">${icon(l.icon, 24, 1.5)}</span><div><b data-dates="${esc(l.dates)}">${esc(l.name)}</b><small>${esc(l.dates)} · ${esc(l.note)}</small></div><em>${F[l.id].length} ${F[l.id].length === 1 ? "find" : "finds"}</em></header>
          <div class="s-finds">${F[l.id].map((f) => findBtn(f, l.id)).join("")}</div></div>`).join("")}
        <span class="s-shaft" aria-hidden="true"></span><span class="s-bit" aria-hidden="true">${icon("drill", 22, 1.6)}</span></div>
      <aside class="s-panel glass" aria-live="polite">${panel(null)}</aside>
    </section>`;

  // Where each view's holders sit in the layers: a small core beside every view.
  const viewCore = (v) => { const at = new Set(v.holders.map((h) => (h.who.includes("Bengel") ? "scholars" : layerOfCite(h.cite)))); return `<span class="s-vcore" title="Where the holders of this view sit">${LAYERS.map((l) => `<i data-layer="${l.id}" class="${at.has(l.id) ? "on" : ""}"></i>`).join("")}</span>`; };

  // The drill: its depth runs linearly down the whole stack; each band's core segment fills as the bit passes it.
  function frame(root, p) {
    const stack = root.querySelector(".s-stack"), y = easeInOut(p) * stack.offsetHeight;
    stack.style.setProperty("--bit", `${y.toFixed(1)}px`);
    stack.querySelectorAll(".s-band").forEach((b) => { const f = clamp01((y - b.offsetTop) / b.offsetHeight); b.style.setProperty("--fill", f.toFixed(3)); b.classList.toggle("is-reached", f > .25 || p >= 1); });
  }

  function mount(main) {
    const F = finds();
    const all = Object.values(F).flat();
    main.innerHTML = `<div class="wrap">${topline()}
      <header class="s-hero"><div><span class="kicker">${icon("layers", 14)}The unseen · Angels</span><h1>Michael</h1><p class="s-sub">the archangel, layer by layer</p></div>
        <p class="s-lede">Five short passages are the bedrock. Everything said about Michael since lies in layers above them, each with its date. The drill goes down; the layers never mix.</p></header>
      ${section(F)}
      <p class="s-law">${icon("hourglass", 18)}<span><b>Age is not the layer.</b> 1 Enoch is older than Jude and Revelation, but it sits in its own layer because it is not Scripture. What decides the layer is the kind of witness, not its age.</span></p>
      <section class="section">${secHead("gem", "Bedrock", "The five passages", "The only layer that is Scripture. Quoted word for word from the King James Version.")}<div class="s-bedrock">${M.passages.map((p) => `<article class="s-crystal"><span class="s-facet">${p.n}</span><h3>${esc(p.short)}</h3><p class="s-where">${esc(p.title)} · ${esc(p.where)}</p>${passageBody(p)}${passageSays(p)}</article>`).join("")}</div></section>
      <section class="section">${secHead("layers", "From the text", "What the bedrock adds up to")}<div class="grid-2"><div class="glass s-plate">${fromTextList()}</div><div class="glass s-plate"><h3 class="s-h3">${icon("x", 18)}Not in the bedrock</h3>${notSaidList()}</div></div></section>
      <section class="section">${secHead("river", "Context", "Beside the bedrock", "Other Scripture the five passages lean on. Still the bottom layer.")}<div class="grid-3">${contextCards("s-ctx")}</div></section>
      <section class="section">${secHead("help", "Questions", "Where readers differ", "Each view shows a small core: the layers its holders come from.")}<div class="s-qs">${questionRows()}</div></section>
      <section class="section">${secHead("hourglass", "Tradition", "The upper layers, in order", "Everything above the bedrock that is not a scholar's reading, layer by layer and by date.")}${tradRule()}
        ${["jewish", "church", "later"].map((id) => `<div class="s-trad-layer" data-layer="${id}"><h3>${esc(LAYERS.find((l) => l.id === id).name)} <small>${esc(LAYERS.find((l) => l.id === id).dates)}</small></h3><div class="grid-3">${M.tradition.filter((t) => t.stratum === id).sort((a, b) => a.sort - b.sort).map((t) => tradCard(t)).join("")}</div></div>`).join("")}</section>
      <section class="section" id="sources">${secHead("library", "Sources", "Where every find comes from")}${sourcesBlock()}</section></div>`;
    main.querySelectorAll(".s-qs .view").forEach((el) => { const q = M.questions.find((x) => x.q === el.closest(".xp").querySelector(".xp-head span").textContent); const v = q?.views[Number(el.dataset.side)]; if (v) el.querySelector("h4").insertAdjacentHTML("beforeend", viewCore(v)); });
    const root = main.querySelector(".s-section");
    Clock.run({ label: "The drill core: surface to bedrock", duration: 9000, frame: (p) => frame(root, p), moving: (p) => { const b = [...root.querySelectorAll(".s-band")].filter((x) => x.classList.contains("is-reached")).pop(); return [`the drill${b ? `, in ${LAYERS.find((l) => l.id === b.dataset.layer).name}` : ""}`]; } });
    const onClick = (e) => {
      const b = e.target.closest("[data-find]");
      if (!b) return;
      root.querySelectorAll(".s-find.is-on").forEach((x) => x.classList.remove("is-on"));
      b.classList.add("is-on");
      const pane = root.querySelector(".s-panel");
      pane.innerHTML = `<div class="s-slide">${panel(all.find((f) => f.id === b.dataset.find))}</div>`;
      if (innerWidth < 900) pane.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    root.addEventListener("click", onClick);
    // Open the first passage so the panel is never empty on arrival.
    root.querySelector(".s-panel").innerHTML = `<div class="s-slide">${panel(all.find((f) => f.id === "p-dan-10-13"))}</div>`;
    root.querySelector('[data-find="p-dan-10-13"]').classList.add("is-on");
  }

  DIRECTIONS.strata = { name: "Strata", swatch: "var(--gold)", mount };
})();
