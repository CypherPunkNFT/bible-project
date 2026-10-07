// More charts across all twenty-one letters, for the four ways in (window.CH3). Same kit, same behaviour as CH and CH2.
window.CH3 = (() => {
  const { st, keepX, refsLine, tip, caption } = CH.kit;
  const O = LETTERS.overview, S = LETTERS.supers, G = LETTERS.groups;
  const ALL = Object.fromEntries(Object.values(G).flatMap((g) => g.letters).map((l) => [l.code, l]));
  const tone = (code) => `var(--${CH2.toneOfLetter(code)})`;
  const name = (code) => O.names[code];
  const pad = (n) => String(n).padStart(2, "0");

  // A list of choices on the left and the chosen one's detail on the right; detail is any HTML.
  function choose(key, items, { title, detail, count }) {
    const s = st(key), i = Math.min(Number(s.choice ?? 0), items.length - 1), x = items[i];
    return `<div class="panel q-layout"><ol class="q-list">${items.map((it, n) => `<li><button type="button" data-act="cchoose" data-arg="${key}|${n}" aria-pressed="${n === i}">${title(it)}${count ? `<span class="q-count">${count(it)}</span>` : ""}</button></li>`).join("")}</ol>
      <article class="detail">${detail(x)}</article></div>`;
  }
  // The twenty-one as buttons, for parts that show one letter at a time.
  function letterPicker(key) {
    const s = st(key); s.choice ??= "ROM";
    return `<div class="compare-letters" style="margin-bottom:.9rem">${O.order.map((c) => `<button type="button" class="chip" style="--tone: ${tone(c)}" data-act="cchoose" data-arg="${key}|${c}" aria-pressed="${c === s.choice}">${name(c)}</button>`).join("")}</div>`;
  }

  // ── Christ in the letters: Torrey's topics, keeping only the passages in the letters ──────
  function topics(key, sid) {
    const sub = S.christ[sid];
    return choose(key, sub.topics, { title: (t) => t.title, count: (t) => t.n,
      detail: (t) => `<h4>${t.title}</h4><ul class="point-list">${t.points.map((p) => `<li><span>${p.text}</span>${refsLine(p.refs, 12)}</li>`).join("")}</ul>
        <p class="detail-refs"><a class="open-chart" href="/topics/${t.id}">The whole topic, across the Bible →</a></p>` })
      + `<p class="caption">From Torrey's New Topical Textbook (public domain), "${sub.title}", keeping only the passages in the twenty-one letters.</p>`;
  }
  const theme = (title) => { const t = O.themes.find((x) => x.title === title);
    return `<div class="panel"><article class="detail"><h4>${t.title}</h4><p>${t.claim}</p>${CH2.letterChips(t.letters)}<p class="detail-refs">${refsLine(t.refs, 14)}</p></article></div>`; };

  // ── In time: the order they were written against their order in the Bible ───────────────
  function order(key) {
    const s = st(key), bible = O.order, dated = bible.filter((c) => ALL[c].date.from).sort((a, b) => ALL[a].date.from - ALL[b].date.from || ALL[a].date.to - ALL[b].date.to);
    const byDate = [...dated, ...bible.filter((c) => !ALL[c].date.from)], W = 1000, ROW = 26, H = bible.length * ROW + 30, L = 300, R = 700;
    const y = (i) => 30 + i * ROW, kept = s.kept;
    return `<div class="panel"><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="The order the letters were written, against their order in the Bible">
      <text x="${L}" y="14" text-anchor="end" style="font: 600 11px var(--sans); letter-spacing: .14em; fill: var(--muted)">IN THE BIBLE</text>
      <text x="${R}" y="14" style="font: 600 11px var(--sans); letter-spacing: .14em; fill: var(--muted)">BY EARLIEST DATE PROPOSED</text>
      ${bible.map((c, i) => { const j = byDate.indexOf(c), on = !kept || kept === c;
        return `<g style="cursor:pointer" data-act="ckeep" data-arg="${key}|${c}" opacity="${on ? 1 : .2}"><path d="M${L + 10} ${y(i)}C${(L + R) / 2} ${y(i)} ${(L + R) / 2} ${y(j)} ${R - 10} ${y(j)}" stroke="${tone(c)}" stroke-width="${kept === c ? 3 : 1.6}" fill="none"/>
          <text x="${L}" y="${y(i) + 4}" text-anchor="end" style="font: 12px var(--sans); fill: var(--ink)">${pad(i + 1)} ${name(c)}</text>
          <text x="${R}" y="${y(j) + 4}" style="font: 12px var(--sans); fill: var(--ink)">${name(c)} · ${ALL[c].date.from ? `AD ${ALL[c].date.from}–${ALL[c].date.to}` : "not dated"}</text></g>`; }).join("")}
    </svg>${tip(kept ? `<b style="color:var(--ink)">${name(kept)}</b>${keepX(key)} · ${bible.indexOf(kept) + 1} in the Bible, ${byDate.indexOf(kept) + 1} by earliest date proposed · ${ALL[kept].facts.date}` : "", "The Bible puts Paul's letters first, longest to shortest. By the earliest date proposed, James comes first (AD 40), then 1 Thessalonians and Galatians (AD 48). Click a letter.")}</div>`;
  }
  const facts = (key, field, heading) => choose(key, O.order.map((c) => ALL[c]), { title: (l) => l.name, detail: (l) => `<h4>${l.name}: ${heading}</h4><p>${l.facts[field]}</p>` });

  // ── On the road: each of Paul's letters from where it was written to where it went ───────
  function travels(key) {
    const from = G.paul.maps["written-from"].pts, to = G.paul.maps["letter-destinations"].pts;
    const routes = O.order.filter((c) => O.groupOf[c] === "paul").map((c) => { const a = from.find((p) => p[4] === c), b = to.find((p) => p[4] === c);
      return a && b ? { id: `travel-${c}`, title: name(c), route: true, pts: [a, b], claim: `${name(c)}: from ${a[0]} to ${b[0]}.` } : null; }).filter(Boolean);
    return CH.map(key, routes);
  }

  // ── Letters that mention letters ─────────────────────────────────────────────────────────
  const letterLinks = () => `<div class="panel"><ul class="ot-list">${O.letterLinks.map((l) => `<li><a>${name(l.from) ?? l.from}</a> <span>→</span> <a>${name(l.to) ?? l.to}</a> <span>· ${l.label}</span><small>${l.claim}</small></li>`).join("")}</ul></div>`;

  // ── Scripture: verses quoted again and again, the Old Testament people, who quotes most ──
  const quotes = () => O.order.flatMap((c) => ALL[c].otQuotes.map((q) => ({ ...q, code: c })));
  function repeated(key) {
    const by = new Map(); quotes().forEach((q) => by.set(q.from, [...(by.get(q.from) ?? []), q]));
    const list = [...by].filter(([, qs]) => qs.length > 1).sort((a, b) => b[1].length - a[1].length);
    return choose(key, list, { title: ([from]) => from, count: ([, qs]) => qs.length,
      detail: ([from, qs]) => `<h4>${from}</h4><ul class="point-list">${qs.map((q) => `<li><span><b>${q.at}</b>${q.note ? ` · ${q.note}` : ""}</span></li>`).join("")}</ul>${CH2.letterChips([...new Set(qs.map((q) => q.code))])}` })
      + `<p class="caption">${list.length} Old Testament passages are quoted in more than one place in the letters.</p>`;
  }
  const OT_PEOPLE = ["Adam", "Cain", "Enoch", "Noah", "Abraham", "Sarah", "Esau", "Moses", "Rahab", "Elijah (Elias)"];
  const otPeople = (key) => choose(key, O.sharedPeople.filter((p) => OT_PEOPLE.includes(p.name)).sort((a, b) => OT_PEOPLE.indexOf(a.name) - OT_PEOPLE.indexOf(b.name)),
    { title: (p) => p.name, count: (p) => p.letters.length, detail: (p) => `<h4>${p.name}</h4><p>${p.claim}</p>${CH2.letterChips(p.letters)}` });
  function quoteCounts(key) {
    const s = st(key), most = Math.max(...O.order.map((c) => ALL[c].otQuotes.length)), kept = s.kept;
    return `<div class="panel"><div class="bar-list">${O.order.map((c) => { const n = ALL[c].otQuotes.length;
      return `<button type="button" data-act="ckeep" data-arg="${key}|${c}" aria-pressed="${kept === c}" style="--tone: ${tone(c)}"><span>${name(c)}</span><i style="width:${(n / most) * 100}%"></i><em>${n}</em></button>`; }).join("")}</div>
      ${tip(kept ? `<b style="color:var(--ink)">${name(kept)}</b>${keepX(key)} · ${ALL[kept].otQuotes.length ? ALL[kept].otQuotes.map((q) => `${q.at} quotes ${q.from}`).join(" · ") : "no Old Testament quotation"}` : "", "Quotations in each letter. Click a letter to list them.")}</div>`;
  }

  // ── Words: one letter's words, words in only one letter, words every collection uses ─────
  const letterWords = (key) => { const s = st(key); s.choice ??= "ROM"; return letterPicker(key) + CH.words(`${key}-${s.choice}`, ALL[s.choice]); };
  function onlyHere(key) {
    const s = st(key); s.choice ??= "HEB"; const list = S.onlyHere[s.choice];
    return `${letterPicker(key)}<div class="panel"><p class="panel-label">${list.length} Greek words used in ${name(s.choice)} and nowhere else in the New Testament</p>
      <div class="only-grid">${list.slice(0, 60).map((w) => `<div><b lang="grc">${w.greek}</b><small>${w.strongs}${w.count > 1 ? ` · ${w.count} times` : ""}</small>${refsLine(w.refs, 2)}</div>`).join("")}</div>
      ${list.length > 60 ? `<p class="tip">The first 60 of ${list.length}, most used first.</p>` : ""}${caption("Counted in the Byzantine Greek text by Strong's number; a word counts as \"only here\" when no other New Testament book uses that number.")}</div>`;
  }

  // ── Threads: the places the letters name; the Topics that draw most on them ───────────────
  function places(key) {
    const by = new Map();
    O.order.forEach((c) => ALL[c].places.forEach((p) => { const k = p.name.replace(/ \(.*\)$/, ""); by.set(k, [...(by.get(k) ?? []), { ...p, code: c }]); }));
    const list = [...by].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    return choose(key, list, { title: ([n]) => n, count: ([, xs]) => xs.length,
      detail: ([n, xs]) => `<h4>${n}</h4><ul class="point-list">${xs.map((x) => `<li><span><b>${name(x.code)}</b>${x.implied ? " (implied)" : ""}${x.note ? ` · ${x.note}` : ""}</span>${refsLine(x.refs, 3)}</li>`).join("")}</ul>` });
  }
  function topicsTop(key) {
    const s = st(key), most = S.topicsTop[0].total, kept = s.kept ? S.topicsTop.find((t) => t.id === s.kept) : null;
    const groupsOf = (t) => Object.entries(t.letters).reduce((m, [c, n]) => ({ ...m, [O.groupOf[c]]: (m[O.groupOf[c]] ?? 0) + n }), {});
    return `<div class="panel"><div class="bar-list stacked">${S.topicsTop.map((t) => { const g = groupsOf(t);
      return `<button type="button" data-act="ckeep" data-arg="${key}|${t.id}" aria-pressed="${s.kept === t.id}"><span>${t.title}</span><span class="stack" style="width:${(t.total / most) * 100}%">${["paul", "hebrews", "general", "john"].map((k) => (g[k] ? `<i style="flex-grow:${g[k]}; background: var(--${{ paul: "epistles", hebrews: "gospels", general: "acts", john: "revelation" }[k]})"></i>` : "")).join("")}</span><em>${t.total}</em></button>`; }).join("")}</div>
      ${tip(kept ? `<b style="color:var(--ink)">${kept.title}</b>${keepX(key)} · ${Object.entries(kept.letters).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${name(c)} ${n}`).join(" · ")} · <a class="refs-link" href="/topics/${kept.id}">Open the topic →</a>` : "", "The Topics that cite the letters most, coloured by collection. Click one.")}</div>`;
  }

  // ── Side by side: all nine pairings; the most-linked letters; the letters and the Gospels ──
  const allParallels = (key) => CH.ribbon(key, Object.entries(G).flatMap(([g, data]) => Object.entries(data.parallels).map(([id, p]) => ({ ...p, id: `${g}-${id}` }))));
  function grid(key) {
    const s = st(key), codes = O.order, max = Math.max(...Object.values(S.grid)), [ka, kb] = s.kept ? s.kept.split("-") : [];
    const cell = (a, b) => { if (a === b) return `<td class="self"></td>`; const n = S.grid[`${a}|${b}`] ?? 0, on = (ka === a && kb === b) || (ka === b && kb === a);
      return `<td><button type="button" title="${name(a)} and ${name(b)}: ${n}" data-act="ckeep" data-arg="${key}|${a}-${b}" aria-pressed="${on}" style="background: color-mix(in srgb, var(--epistles) ${Math.round(Math.sqrt(n / max) * 100)}%, transparent)"></button></td>`; };
    return `<div class="panel"><div class="canon-wrap"><table class="heat"><thead><tr><th></th>${codes.map((c) => `<th><span>${name(c)}</span></th>`).join("")}</tr></thead>
      <tbody>${codes.map((a) => `<tr><th>${name(a)}</th>${codes.map((b) => cell(a, b)).join("")}</tr>`).join("")}</tbody></table></div>
      ${tip(ka ? `<b style="color:var(--ink)">${name(ka)} and ${name(kb)}</b>${keepX(key)} · ${S.grid[`${ka}|${kb}`]} cross-reference links` : "", "Each square: how many cross-references join two letters; darker means more. Click a square.")}
      ${caption("Cross references from OpenBible.info (CC BY), counted in both directions.")}</div>`;
  }
  function gospels(key) {
    const s = st(key), g = Object.keys(S.gospelNames), max = Math.max(...O.order.flatMap((c) => g.map((b) => S.gospels[c][b]))), [kc, kb] = s.kept ? s.kept.split("-") : [];
    return `<div class="panel"><div class="canon-wrap"><table class="heat heat-wide"><thead><tr><th></th>${g.map((b) => `<th>${S.gospelNames[b]}</th>`).join("")}</tr></thead>
      <tbody>${O.order.map((c) => `<tr><th>${name(c)}</th>${g.map((b) => { const n = S.gospels[c][b];
        return `<td><button type="button" data-act="ckeep" data-arg="${key}|${c}-${b}" aria-pressed="${kc === c && kb === b}" style="background: color-mix(in srgb, var(--gospels) ${Math.round(Math.sqrt(n / max) * 100)}%, transparent)">${n}</button></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
      ${tip(kc ? `<b style="color:var(--ink)">${name(kc)} and ${S.gospelNames[kb]}</b>${keepX(key)} · ${S.gospels[kc][kb]} cross-reference links` : "", "Cross-references from each letter to the four Gospels and Acts. Click a square.")}</div>`;
  }

  // ── Shape: what each letter's parts do; lengths in Greek words; key verses ───────────────
  const KIND_TONES = { teaching: "prophets", practice: "poetry", personal: "acts", praise: "epistles", defence: "history", appeal: "acts", "church order": "gospels", charge: "revelation",
    answer: "prophets", worship: "epistles", encouragement: "poetry", correction: "history", warning: "revelation", prayer: "gospels" };
  function kinds(key) {
    const s = st(key), longest = Math.max(...O.order.map((c) => ALL[c].verses));
    const shown = [...new Set(O.order.flatMap((c) => ALL[c].outline.map((o) => o.kind ?? "not classed")))];
    return `<div class="panel"><div class="legend">${shown.map((k) => `<span><i style="background: var(--${KIND_TONES[k] ?? "line"})"></i>${k}</span>`).join("")}</div>
      <div class="shape-bars">${O.order.map((c) => `<div class="shape-row"><span>${name(c)}</span><div class="shape-bar kind-bar" style="width:${(ALL[c].verses / longest) * 100}%">${ALL[c].outline.map((o, i) =>
        `<button type="button" style="flex-grow:${o.verses}; background: var(--${KIND_TONES[o.kind] ?? "line"})" data-act="ckeep" data-arg="${key}|${c}:${i}" aria-pressed="${s.kept === `${c}:${i}`}" title="${o.title}"></button>`).join("")}</div><em>${ALL[c].verses}</em></div>`).join("")}</div>
      ${tip(s.kept ? (([c, i]) => { const o = ALL[c].outline[Number(i)]; return `<b style="color:var(--ink)">${o.title}</b>${keepX(key)} · ${o.ref} · ${o.verses} verses · ${o.kind ?? "not classed"}`; })(s.kept.split(":")) : "", "Each letter's parts, coloured by what they do. Click a part.")}</div>`;
  }
  function greek(key) {
    const s = st(key), count = (c) => ALL[c].greekWords ?? S.greekWords[c], most = Math.max(...O.order.map(count));
    return `<div class="panel"><div class="bar-list">${O.order.map((c) => `<button type="button" data-act="ckeep" data-arg="${key}|${c}" aria-pressed="${s.kept === c}" style="--tone: ${tone(c)}"><span>${name(c)}</span><i style="width:${(count(c) / most) * 100}%"></i><em>${count(c).toLocaleString("en-US")}</em></button>`).join("")}</div>
      ${tip(s.kept ? `<b style="color:var(--ink)">${name(s.kept)}</b>${keepX(key)} · ${count(s.kept).toLocaleString("en-US")} Greek words in ${ALL[s.kept].verses} verses` : "", "Greek words in each letter, counted in the Byzantine text (Hebrews counted by us the same way). Click a letter.")}</div>`;
  }
  function keyVerses(key) {
    const s = st(key); s.choice ??= "ROM"; const l = ALL[s.choice];
    return `${letterPicker(key)}<div class="panel"><div class="verse-cards">${l.keyVerses.map((v) => `<blockquote class="quote">“${v.text}”<cite>${v.ref} · KJV</cite><small>${v.why}</small></blockquote>`).join("")}</div></div>`;
  }

  // ── How they were read: every open question; the gathering; one verse in every translation ─
  const GROUP_NAMES = { paul: "Paul's letters", hebrews: "Hebrews", general: "James, Peter & Jude", john: "The letters of John" };
  const allQuestions = (key) => CH.questions(key, [...O.questions.map((q) => ({ ...q, question: `All the letters · ${q.question}` })),
    ...Object.entries(G).flatMap(([g, data]) => data.questions.map((q) => ({ ...q, question: `${GROUP_NAMES[g]} · ${q.question}` })))]);
  const gathered = () => `<div class="panel"><div class="gathered">${O.collection.map((p) => `<p>${p}</p>`).join("")}</div></div>`;
  function translations(key) {
    const s = st(key); s.choice ??= "ROM"; const c = s.choice, list = S.translations.filter((t) => t.verses[c]);
    return `${letterPicker(key)}<div class="panel"><p class="panel-label">${S.keyRefs[c]} in ${list.length} of the site's translations</p>
      <div class="translations">${list.map((t) => `<div><p class="t-name"><b>${t.abbr}</b> ${t.name}${t.year ? ` · ${t.year}` : ""} <span>${t.lang}</span></p><p dir="${t.dir}" lang="${t.lang}">${t.verses[c]}</p></div>`).join("")}</div></div>`;
  }

  return { topics, theme, order, facts, travels, letterLinks, repeated, otPeople, quoteCounts, letterWords, onlyHere, places, topicsTop, allParallels, grid, gospels, kinds, greek, keyVerses, allQuestions, gathered, translations };
})();
