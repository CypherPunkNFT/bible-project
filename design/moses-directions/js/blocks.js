// Shared content blocks every direction uses (each direction lays them out and styles them its own way).
(() => {
  window.SCENE_ICON = { river: "basket", palace: "landmark", well: "well", bush: "flame", staff: "staff", plagues: "darkness", sea: "waves", rock: "drop", sinai: "mountain", tent: "tent", stars: "sparkle", nebo: "eye" };
  ICON.landmark = '<path d="M10 18v-7M14 18v-7M18 18v-7M6 18v-7M3 22h18"/><path d="M11.12 2.2a2 2 0 0 1 1.76 0l7.87 3.85c.47.23.31.95-.22.95H3.47c-.53 0-.69-.72-.22-.95z"/>';

  // The three forties and the end of the life (Acts 7:23, 7:30, 7:36; Deuteronomy 34:7).
  window.fortiesCards = (cls = "") => M.forties.map((f) => `<article class="forty ${cls}" style="--tone:${ACT_TONE[f.act]}" data-act="${f.act}">
      <div class="forty-top"><span class="forty-n">${f.act === 1 ? "I" : f.act === 2 ? "II" : "III"}</span><span class="forty-years">${f.from}–${f.to}</span></div>
      <h3>${esc(f.name)}</h3><p>${esc(f.verse.text)}</p><footer>${refLink(f.verse.ref)} · KJV</footer></article>`).join("");

  // The ten plagues: a grid of glyphs; a tile opens in place to its verse.
  window.plaguesGrid = (cls = "") => `<div class="plagues ${cls}">${M.plagues.map((p) => `<div class="plague xp" data-n="${p.n}">
      <button type="button" class="plague-btn" data-xp aria-expanded="false"><span class="plague-n">${p.n}</span>${glyph(p.word, 40)}<b>${esc(p.word)}</b></button>
      <div class="xp-body"><div class="xp-inner">${kjv(p.verse, "kjv-sm")}</div></div></div>`).join("")}</div>`;

  // The people around him, from the family list (TIPNR), his companions and those who withstood him.
  window.peopleList = () => {
    const comp = Object.fromEntries(M.companions.map((c) => [c.id, c]));
    const prophetsWith = Object.fromEntries(M.prophetsWith.map((p) => [p.person.personId, p.claim]));
    const fam = M.family.map((f) => ({ ...f, claim: comp[f.id]?.claim, also: prophetsWith[f.id] }));
    const rest = M.companions.filter((c) => !fam.some((f) => f.id === c.id)).map((c) => ({ ...c, group: /korah|jannes/.test(c.id) ? "against" : "with", role: /korah|jannes/.test(c.id) ? "withstood him" : "beside him", also: prophetsWith[c.id] }));
    const against = M.opponents.map((o) => ({ ...o, group: "against", role: o.power ? `${o.power}` : "king of Egypt" }));
    return [...fam, ...rest, ...against];
  };
  window.personDetail = (p) => `<div class="person-detail" style="--tone:${p.group === "family" ? "var(--egypt)" : p.group === "with" ? "var(--wild)" : "var(--midian)"}">
      <div class="pd-head"><span class="pd-mono">${esc(p.name[0])}</span><div><h4>${esc(p.name)}</h4><small>${esc(p.role)}${p.note ? ` · ${esc(p.note)}` : ""}</small></div></div>
      ${p.claim ? claim(p.claim) : `<p class="pd-plain">Named as his ${esc(p.role)} in the family list (TIPNR, STEP Bible).</p>`}${p.also ? claim(p.also) : ""}${p.quote ? quoteSpan(p.quote) : ""}</div>`;
  // A small network: Moses in the middle, family to the left, companions above right, those against him below right.
  window.peopleNet = (cls = "") => {
    const people = peopleList(), W = 640, H = 420, cx = W / 2, cy = H / 2;
    const groups = { family: [150, 250], with: [-60, 20], against: [30, 120] };
    const pos = {};
    for (const [g, [a0, a1]] of Object.entries(groups)) {
      const list = people.filter((p) => p.group === g);
      list.forEach((p, i) => {
        const a = ((a0 + ((a1 - a0) * (i + .5)) / list.length) * Math.PI) / 180, r = g === "family" ? 165 : 175 + (i % 2) * 22;
        pos[p.id] = [cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * .92];
      });
    }
    const tone = (g) => (g === "family" ? "var(--egypt)" : g === "with" ? "var(--wild)" : "var(--midian)");
    return `<div class="net ${cls}" data-net><svg viewBox="0 0 ${W} ${H}" class="net-svg" role="group" aria-label="The people around Moses">
      ${people.map((p) => `<line class="net-edge" data-for="${p.id}" style="--tone:${tone(p.group)}" x1="${cx}" y1="${cy}" x2="${pos[p.id][0]}" y2="${pos[p.id][1]}"/>`).join("")}
      <g class="net-me"><circle cx="${cx}" cy="${cy}" r="40" class="net-me-halo"/><circle cx="${cx}" cy="${cy}" r="30"/><text x="${cx}" y="${cy + 6}">Moses</text></g>
      ${people.map((p, i) => `<g class="net-node" data-person="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}" style="--tone:${tone(p.group)};--i:${i}">
        <circle cx="${pos[p.id][0]}" cy="${pos[p.id][1]}" r="17"/><text class="net-ini" x="${pos[p.id][0]}" y="${pos[p.id][1] + 5}">${esc(p.name[0])}</text>
        <text class="net-name" x="${pos[p.id][0]}" y="${pos[p.id][1] + 34}">${esc(p.name.replace(/, one of five kings of Midian/, " (Midian)").replace(/ of the Exodus/, ""))}</text></g>`).join("")}
      </svg><ul class="net-key"><li style="--tone:var(--egypt)">Family</li><li style="--tone:var(--wild)">Beside him</li><li style="--tone:var(--midian)">Against him</li></ul>
      <div class="net-detail">${personDetail(people.find((p) => p.id === "aaron-exo-4-14"))}</div></div>`;
  };
  const choosePerson = (node) => {
    const net = node.closest("[data-net]"), id = node.dataset.person, p = peopleList().find((x) => x.id === id);
    net.querySelectorAll(".net-node").forEach((n) => n.classList.toggle("is-on", n === node));
    net.querySelectorAll(".net-edge").forEach((l) => l.classList.toggle("is-on", l.dataset.for === id));
    net.querySelector(".net-detail").innerHTML = personDetail(p);
  };
  document.addEventListener("click", (e) => { const n = e.target.closest("[data-person]"); if (n) choosePerson(n); });
  document.addEventListener("keydown", (e) => { const n = e.target.closest?.("[data-person]"); if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); choosePerson(n); } });

  // The word: the call, the signs and what came of the word, with the rest one click away.
  window.callSteps = () => M.word.call.map((c, i) => `<article class="call-step"><span class="call-n">${i + 1}</span><div><h4>${esc(c.label)}</h4>${quoteSpan(c.quote)}${claim(c.claim)}</div></article>`).join("");
  const SIGN_ICON = ["staff", "sparkle", "waves", "drop", "sun", "staff"];
  window.signTiles = () => M.word.signs.map((s, i) => `<div class="sign xp"><button type="button" class="sign-btn" data-xp aria-expanded="false">${glyph(SIGN_ICON[i], 34)}<b>${esc(s.label)}</b>${icon("plus", 15)}</button>
      <div class="xp-body"><div class="xp-inner">${claim(s.claim)}</div></div></div>`).join("");
  window.fulfilPairs = () => M.word.fulfilment.map((f) => `<div class="fulfil"><div class="fulfil-word"><small>The word</small>${claim(f.word)}</div><div class="fulfil-link" aria-hidden="true"><i></i>${icon("arrowRight", 16)}</div><div class="fulfil-came"><small>What Scripture reports</small>${claim(f.reported)}</div></div>`).join("");
  window.wordMore = () => [
    ["How the word came", M.word.how.map((c) => claim(c)).join("")],
    ["The message", M.word.message.map((m) => claim({ theme: m.theme, ...m.claim, quotes: m.quotes })).join("")],
    ["Words to people", M.word.words.map((w) => `<div class="word-to"><b>To ${esc(w.to)}</b>${quoteSpan(w.quote)}${w.claim ? claim(w.claim) : ""}</div>`).join("")],
  ].map(([t, body]) => expander(`<button type="button" class="xp-head" data-xp aria-expanded="false"><span>${esc(t)}</span>${icon("chevronDown", 16)}</button>`, body, { cls: "xp-row" })).join("");

  // Questions people ask, the two accounts, the dates, and what Scripture does not say.
  window.questionList = () => M.questions.map((q) => expander(`<button type="button" class="xp-head q-head" data-xp aria-expanded="false">${icon("help", 18)}<span>${esc(q.question)}</span><em>${q.views.length} views</em>${icon("chevronDown", 16)}</button>`,
    `<div class="views">${q.views.map((v) => `<article class="view"><h5>${esc(v.label)}</h5><small>${esc(v.holders)}</small>${claim(v.argument)}</article>`).join("")}</div>`, { cls: "xp-row xp-q" })).join("");
  window.twoAccounts = () => M.leader.twoAccounts.map((t) => `<div class="two"><h4>${esc(t.topic)}</h4><div class="two-cols">${claim(t.first)}${claim(t.second)}</div></div>`).join("");
  window.datesBlock = () => `<div class="dates">${M.leader.dates.map((d) => `<div class="date" data-system="${d.system}"><b>${d.from ? `${d.approx ? "c. " : ""}${d.from}${d.to ? `–${d.to}` : ""} BC` : "No year BC"}</b><span>${esc(d.label)}</span><p>${esc(d.note)}</p>${d.cites ? `<footer>${chip("scholars")}<span class="refs">${cites(d.cites)}</span></footer>` : ""}</div>`).join("")}</div>`;
  window.notSaid = () => `<ul class="not-said">${M.notSaid.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  window.saysList = () => M.leader.scriptureSays.map((c) => claim(c, "says")).join("");
  window.worldStage = () => M.leader.worldStage.map((w) => `<div class="stage"><b>${esc(w.power)}</b>${w.rulers.length ? `<small>${esc(w.rulers.map((r) => r.name).join(", "))}</small>` : ""}${claim(w.claim)}</div>`).join("");

  window.sourcesBlock = () => `<div class="sources">
      <div><h4>${icon("library", 16)}Scholars and writers cited</h4><ol class="cites">${M.citations.map((c) => `<li><b>${esc(c.author)}</b>, <i>${esc(c.title)}</i> (${esc(c.year)})${c.where ? `, ${esc(c.where)}` : ""} <a href="${esc(c.url)}" target="_blank" rel="noreferrer">${icon("arrowUp", 12)}</a></li>`).join("")}</ol></div>
      <div><h4>${icon("book", 16)}Passages read for these pages</h4><p class="passages">${[...M.passages.leader, ...M.passages.prophet].filter((r, i, all) => all.findIndex((x) => x[0] === r[0] && x[1] === r[1]) === i).map(refLink).join(" ")}</p>
        <h4>${icon("scroll", 16)}Outside the Bible</h4>${M.leader.outside.map((o) => `<div class="outside"><b>${esc(o.name)}</b><small>${esc(o.date)}</small>${claim(o.claim)}</div>`).join("")}
        <p class="credit">${esc(M.credit)} Verse text: King James Version.</p></div></div>`;

  // A scene's own content: the key verse, the few lines, and the full sourced detail one click away.
  window.sceneMore = (s) => {
    const extra = [...s.more.map((c) => claim(c)), s.burial ? `<blockquote class="q"><p>${esc(s.burial.text)}</p><footer>${refLink(s.burial.span)} · KJV</footer></blockquote>` : "",
      ...(s.tradition ?? []).map((c) => claim(c))].join("");
    return extra ? expander(null, extra, { closed: `The full detail · ${s.more.length + (s.tradition?.length ?? 0) + (s.burial ? 1 : 0)} sourced notes`, opened: "Show less" }) : "";
  };
  window.sceneLines = (s) => `${s.quote ? quoteSpan(s.quote, "q-call") : ""}${s.lines.map((c) => claim(c)).join("")}`;
  window.placeTag = (s) => `<span class="place-tag">${icon("map", 13)}${esc(s.placeName)}</span>`;
})();
