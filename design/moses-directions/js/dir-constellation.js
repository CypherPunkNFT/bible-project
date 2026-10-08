// D · Constellation. Moses at the centre of a field: rings of people, places, moments and words, in story order
// clockwise. Choose any point and its panel opens beside it, with the lines to everything it touches.
(() => {
  const C = 500, RING = { person: 165, place: 270, moment: 375, word: 465 };
  const TYPE = { person: "People", place: "Places", moment: "Moments", word: "Words" };
  const ICONS = { person: "users", place: "map", moment: "sparkle", word: "message" };
  const short = (s, n = 26) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  function buildNodes() {
    const nodes = [];
    const add = (n) => { nodes.push(n); return n; };
    const actOfPerson = (id) => (/amram|jochebed|aaron|miriam/.test(id) ? 1 : /zipporah|jethro|gershom|eliezer/.test(id) ? 2 : 3);
    peopleList().forEach((p) => add({ id: `p:${p.id}`, type: "person", label: p.name.replace(/, one of five kings of Midian/, " (Midian)").replace(/ of the Exodus/, ""), act: actOfPerson(p.id), data: p, words: [p.name.split(" ")[0]] }));
    const seen = new Set();
    M.map.route.forEach((s) => { if (seen.has(s.placeId)) return; seen.add(s.placeId); add({ id: `l:${s.placeId}`, type: "place", label: s.name, act: s.act, data: { ...s }, placeId: s.placeId }); });
    M.map.markers.forEach((m) => { if (seen.has(m.placeId)) return; seen.add(m.placeId); add({ id: `l:${m.placeId}`, type: "place", label: m.name, act: 3, data: { ...m }, placeId: m.placeId }); });
    M.scenes.forEach((s) => add({ id: `s:${s.id}`, type: "moment", big: true, label: s.title, act: s.act, data: s, placeId: s.place }));
    M.leader.events.forEach((e, i) => add({ id: `e:${i}`, type: "moment", label: e.label, act: 3, data: e, placeId: e.placeId }));
    M.word.message.forEach((m, i) => add({ id: `m:${i}`, type: "word", label: m.theme, act: i === 0 ? 2 : 3, data: { kind: "The message", claim: { theme: m.theme, ...m.claim, quotes: m.quotes } } }));
    M.word.signs.forEach((s, i) => add({ id: `g:${i}`, type: "word", label: s.label, act: i === 0 ? 2 : 3, data: { kind: "A sign", claim: s.claim }, placeId: s.placeId }));
    M.word.words.forEach((w, i) => add({ id: `w:${i}`, type: "word", label: `To ${w.to}`, act: 3, data: { kind: "His words", quote: w.quote, claim: w.claim, person: w.person?.personId }, placeId: w.placeId }));
    M.word.fulfilment.forEach((f, i) => add({ id: `f:${i}`, type: "word", label: short(f.word.text.replace(/^"|"$/g, ""), 30), act: 3, data: { kind: "What came of the word", word: f.word, reported: f.reported } }));
    // Links: shared places, people named in a text, and a word spoken to a person.
    const text = (n) => JSON.stringify(n.data).toLowerCase();
    for (const n of nodes) n.links = new Set();
    const link = (a, b) => { if (a !== b) { a.links.add(b.id); b.links.add(a.id); } };
    for (const a of nodes) for (const b of nodes) {
      if (a.placeId && b.type === "place" && b.placeId === a.placeId) link(a, b);
      if (a.type === "person" && b.type !== "person" && b.type !== "place" && a.words[0].length > 3 && text(b).includes(a.words[0].toLowerCase())) link(a, b);
      if (a.data?.person && b.type === "person" && b.data.id === a.data.person) link(a, b);
    }
    // The shape the shared field reads: rings by type, groups by act, a mark per kind of point.
    for (const n of nodes) { n.ring = n.type; n.group = String(n.act); n.mark = n.big ? "numeral" : n.type === "person" ? "initial" : n.type === "place" ? "diamond" : "dot"; n.numeral = ["I", "II", "III"][n.act - 1]; n.links = [...n.links]; }
    return { center: "Moses", rings: Object.entries(RING).map(([key, r]) => ({ key, label: TYPE[key], r })),
      groups: M.forties.map((f) => ({ key: String(f.act), label: `${["I", "II", "III"][f.act - 1]} ${f.name}`, tone: ACT_TONE[f.act] })), nodes };
  }
  const relatedChips = (n) => [...n.linked].sort((a, b) => a.type.localeCompare(b.type)).map((m) => `<button type="button" class="cs-chip" data-node="${m.id}" style="--tone:${ACT_TONE[m.act]}">${icon(ICONS[m.type], 13)}${esc(short(m.label, 30))}</button>`).join("");
  function panelHtml(n) {
    const d = n.data, head = (k, t) => `<div class="cs-ph"><span class="badge">${icon(ICONS[n.type], 28, 1.4)}</span><div><span class="kicker">${k}</span><h3>${esc(t)}</h3></div></div>`;
    let body = "";
    if (n.type === "person") body = head(`Person · ${esc(d.role)}`, n.label) + (d.claim ? claim(d.claim) : `<p class="pd-plain">Named as his ${esc(d.role)} in the family list (TIPNR, STEP Bible).</p>`) + (d.also ? claim(d.also) : "") + (d.quote ? quoteSpan(d.quote) : "");
    else if (n.type === "place") body = head(`Place · ${esc(d.type)} · Atlas confidence ${Math.round(d.confidence * 100)}%`, n.label) + (d.verse ? kjv(d.verse, "kjv-sm") : "");
    else if (n.big) body = `<div class="cs-art">${art(d.art)}</div>` + head(`Act ${["I", "II", "III"][d.act - 1]} · ${esc(d.placeName)}`, d.title) + kjv(d.verse, "kjv-sm") + `<div class="cs-lines">${sceneLines(d)}</div>` + (d.plagues ? plaguesGrid() : "") + sceneMore(d);
    else if (n.type === "moment") body = head("Moment · from the leader page", d.label) + claim(d.claim);
    else body = head(esc(d.kind), n.label) + (d.word ? `<div class="fulfil-word"><small>The word</small>${claim(d.word)}</div><div class="cs-arrow">${icon("arrowRight", 16)}</div><div class="fulfil-came"><small>What Scripture reports</small>${claim(d.reported)}</div>` : `${d.quote ? quoteSpan(d.quote) : ""}${d.claim ? claim(d.claim) : ""}`);
    const rel = n.linked.length ? `<div class="cs-rel"><span class="kicker">Linked in the field · ${n.linked.length}</span><div class="cs-chips">${relatedChips(n)}</div></div>` : "";
    return `<div class="cs-pbody">${body}${rel}</div>${n.type === "place" ? `<div class="cs-pmap"></div>` : ""}`;
  }

  DIRECTIONS.constellation = {
    name: "Constellation", swatch: "#18716a",
    mount(main) {
      const data = buildNodes(), nodes = data.nodes;
      const p = M.person;
      main.innerHTML = `
        <section class="wrap cs-top">${topline()}
          <div class="cs-hero"><div><span class="kicker">${esc(p.describe)}</span><h1>Moses</h1><p class="cs-lede">Everyone and everything around him in one field: ${nodes.filter((n) => n.type === "person").length} people, ${nodes.filter((n) => n.type === "place").length} places, ${nodes.filter((n) => n.type === "moment").length} moments and ${nodes.filter((n) => n.type === "word").length} words. Time runs clockwise from the top.</p></div>
            <div class="cs-forties">${M.forties.map((f) => `<button type="button" data-actf="${f.act}" style="--tone:${ACT_TONE[f.act]}"><b>${["I", "II", "III"][f.act - 1]}</b><span>${esc(f.name)}<small>${f.from}–${f.to} · ${esc(refText(f.verse.ref))}</small></span></button>`).join("")}</div></div>
          <div class="cs-filters"><div class="cs-seg" role="group" aria-label="Show">${["all", ...Object.keys(RING)].map((t) => `<button type="button" data-type="${t}" aria-pressed="${t === "all"}">${t === "all" ? "Everything" : `${icon(ICONS[t], 14)}${TYPE[t]}`}</button>`).join("")}</div>
            <button type="button" class="cs-replay" data-bloom>${icon("replay", 14)}Replay the bloom</button></div>
        </section>
        <section class="wrap cs-stage">
          <div class="cs-field glass" style="--tone:var(--accent)">${Constellation.field(data)}${Constellation.legend(data, { marks: { person: "initial", place: "diamond", word: "solid" } })}</div>
          <aside class="cs-panel glass" style="--tone:var(--accent)"></aside>
        </section>
        <section class="wrap cs-path"><div class="sec-head"><span class="badge badge-lg" style="--tone:var(--accent)">${icon("route", 36, 1.3)}</span><div><span class="kicker" style="--tone:var(--accent)">The story path</span><h2>Twelve scenes, in order</h2><p>Choose one to light it in the field.</p></div></div>
          <div class="cs-strip">${M.scenes.map((s, i) => `<button type="button" class="cs-card glass" data-node="s:${s.id}" style="--tone:${ACT_TONE[s.act]}"><span class="cs-card-art">${art(s.art)}</span><small>${String(i + 1).padStart(2, "0")} · Act ${["I", "II", "III"][s.act - 1]}</small><b>${esc(s.title)}</b><em>${esc(refText(s.verse.ref))}</em></button>`).join("")}</div></section>
        <section class="wrap cs-sec"><div class="cs-grid">
          <div class="glass cs-pad" style="--tone:var(--midian)"><h3 class="cs-h3">${icon("darkness", 20)}The ten plagues</h3>${plaguesGrid()}</div>
          <div class="glass cs-pad" style="--tone:var(--accent)"><h3 class="cs-h3">${icon("quote", 20)}How Scripture remembers him</h3><div class="cs-says">${saysList()}</div></div>
          <div class="glass cs-pad cs-wide" style="--tone:var(--wild)"><h3 class="cs-h3">${icon("flame", 20)}The call</h3><div class="cs-cols">${callSteps()}</div></div>
          <div class="glass cs-pad cs-wide" style="--tone:var(--prophets)"><h3 class="cs-h3">${icon("help", 20)}Open questions</h3>${questionList()}<div class="cs-two">${twoAccounts()}${datesBlock()}</div></div>
          <div class="glass cs-pad cs-wide" style="--tone:var(--accent)"><h3 class="cs-h3">${icon("eye", 20)}What Scripture does not say</h3>${notSaid()}</div>
          <div class="glass cs-pad cs-wide" id="sources" style="--tone:var(--accent)"><h3 class="cs-h3">${icon("library", 20)}Sources</h3>${sourcesBlock()}</div></div></section>`;

      const svg = main.querySelector(".cs-svg"), panel = main.querySelector(".cs-panel");
      const corePanel = () => `<div class="cs-pbody"><div class="cs-ph"><span class="badge">${icon("tablets", 28, 1.4)}</span><div><span class="kicker">The centre</span><h3>Moses</h3></div></div>
        <p class="cs-plain">${esc(p.leaderTagline)} ${esc(p.prophetTagline)}</p>${M.story.slice(0, 1).map((c) => claim(c)).join("")}
        <div class="cs-rel"><span class="kicker">Start anywhere</span><div class="cs-chips">${["p:aaron-exo-4-14", "s:bush", "s:sea", "l:abfba2a", "s:nebo", "f:4"].map((id) => field.byId[id]).filter(Boolean).map((m) => `<button type="button" class="cs-chip" data-node="${m.id}" style="--tone:${ACT_TONE[m.act]}">${icon(ICONS[m.type], 13)}${esc(short(m.label, 30))}</button>`).join("")}</div></div></div>`;
      // A place opens with its own small map under the panel.
      const afterSelect = (n, el) => {
        const host = el.querySelector(".cs-pmap"); if (!host || !n) return null;
        const pmap = MosesMap(host, { mini: true });
        requestAnimationFrame(() => { const r = pmap.size(), [x, y] = n.data.xy; pmap.setView(pmap.fit([x - 150, y - 115, 300, 230], { x: 10, y: 10, w: r.width - 20, h: r.height - 20 })); pmap.setProgress(15); pmap.pulse(n.placeId); });
        return () => pmap.destroy();
      };
      const field = Constellation.wire(svg, data, { panel, panelHtml, coreHtml: corePanel, afterSelect });
      const select = field.select;
      const bloom = () => Clock.run({ label: "The field blooms out from Moses", duration: 2600, frame: field.bloomFrame, moving: field.bloomMoving });
      const setType = (t) => { main.querySelectorAll("[data-type]").forEach((b) => { if (!b.closest(".cs-svg")) b.setAttribute("aria-pressed", String(b.dataset.type === t)); }); field.setRing(t); };
      const setAct = (a) => { const now = field.setGroup(String(a)); main.querySelectorAll("[data-actf]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.actf === now))); };
      const onClick = (e) => {
        const n = e.target.closest("[data-node]"); if (n && !e.target.closest(".plague") && !n.closest(".cs-svg")) { select(n.dataset.node, true); if (n.closest(".cs-strip")) main.querySelector(".cs-stage").scrollIntoView({ behavior: "smooth" }); return; }
        const t = e.target.closest("[data-type]"); if (t && !t.closest(".cs-svg")) { setType(t.dataset.type); return; }
        const a = e.target.closest("[data-actf]"); if (a) { setAct(a.dataset.actf); return; }
        if (e.target.closest("[data-bloom]")) bloom();
      };
      main.addEventListener("click", onClick);
      setType("all"); select("core"); field.fitLabels(); bloom();
      return () => field.destroy();
    },
  };
})();
