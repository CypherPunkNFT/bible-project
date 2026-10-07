// Charts across all twenty-one letters, for the Letters home's other three rows (window.CH2). They use CH's kit, so they
// look and behave like every other chart: clicking keeps an item, ✕ lets it go.
window.CH2 = (() => {
  const { st, keepX, refsLine, tip, caption, splitArg } = CH.kit;
  const O = LETTERS.overview;
  const GROUP_TONE = { paul: "epistles", hebrews: "gospels", general: "acts", john: "revelation" };
  const toneOfLetter = (code) => GROUP_TONE[O.groupOf[code]] ?? "epistles";
  const letterChips = (codes) => `<div class="letter-chips">${codes.map((c) => `<span style="--tone: var(--${toneOfLetter(c)})">${O.names[c] ?? c}</span>`).join("")}</div>`;
  const vlabel = (code, c, v) => `${O.names[code]} ${c}:${v}`;

  // ── The Old Testament behind all four groups: books on the left, groups on the right ─────
  function flow(key) {
    const s = st(key), links = O.flows, W = 1000, L = 170, R = 830, gap = 6;
    const total = (k) => { const m = new Map(); links.forEach((l) => m.set(l[k], (m.get(l[k]) ?? 0) + l.value)); return m; };
    const left = [...total("source")].sort((a, b) => b[1] - a[1]), right = [...total("target")];
    const sum = links.reduce((a, l) => a + l.value, 0), unit = Math.min(4, (560 - left.length * gap) / sum);
    const stack = (list) => { let y = 12; return new Map(list.map(([n, t]) => { const h = Math.max(3, t * unit), at = { y, h, t }; y += h + gap; return [n, at]; })); };
    const lp = stack(left), rp = stack(right), used = new Map(), kept = s.kept;
    const bands = links.map((l) => {
      const a = lp.get(l.source), b = rp.get(l.target), h = l.value * unit, sy = a.y + (used.get(l.source) ?? 0), ty = b.y + (used.get(`>${l.target}`) ?? 0);
      used.set(l.source, (used.get(l.source) ?? 0) + h); used.set(`>${l.target}`, (used.get(`>${l.target}`) ?? 0) + h);
      const on = !kept || l.source === kept || l.target === kept;
      return `<path d="M${L + 12},${sy}C500,${sy} 500,${ty} ${R},${ty}L${R},${ty + h}C500,${ty + h} 500,${sy + h} ${L + 12},${sy + h}Z" fill="var(--epistles)" opacity="${on ? (kept ? .55 : .26) : .06}"/>`;
    }).join("");
    const nodes = (m, x, side) => [...m].map(([n, { y, h, t }]) => `<g style="cursor:pointer" data-act="ckeep" data-arg="${key}|${n}"><rect x="${x}" y="${y}" width="12" height="${h}" rx="3" fill="var(--epistles)"/>
      <text x="${side ? x + 20 : x - 8}" y="${y + h / 2 + 4}" text-anchor="${side ? "start" : "end"}" style="font: ${n === kept ? "600 12.5px" : "11.5px"} var(--sans); fill: ${n === kept ? "var(--ink)" : "var(--muted)"}">${n} · ${t}</text></g>`).join("");
    const height = Math.max(...[...lp.values(), ...rp.values()].map((n) => n.y + n.h)) + 12;
    const focus = kept ? links.filter((l) => l.source === kept || l.target === kept).sort((a, b) => b.value - a.value) : [];
    return `<div class="panel"><svg class="chart" viewBox="0 0 ${W} ${height}" role="img" aria-label="The Old Testament behind the letters">${bands}${nodes(lp, L, false)}${nodes(rp, R, true)}</svg>
      ${tip(kept ? `<b style="color:var(--ink)">${kept}</b>${keepX(key)} · ${focus.reduce((a, l) => a + l.value, 0)}<ul class="flow-list">${focus.map((l) => `<li><b>${l.source === kept ? l.target : l.source} · ${l.value}</b>${refsLine(l.refs, 99)}</li>`).join("")}</ul>` : "",
        `${sum} quotations. Click a book or a group of letters to see every passage.`)}
      ${caption("Every Old Testament passage the letters quote, traced from the book it comes from to the letters that quote it. John's letters quote no Old Testament passage; their one band is 1 John's allusion to Cain (Genesis 4:8).")}</div>`;
  }

  // ── The words each group leans on: a star per word per group, sized by uses ──────────────
  function wordTable(key, minGroups = 1) {
    const s = st(key), groups = Object.entries(LETTERS.groups);
    const sums = groups.map(([g, data]) => { const m = new Map(); data.letters.flatMap((l) => l.words.map((w) => ({ ...w, letter: l.name }))).forEach((w) => {
      const p = m.get(w.strongs) ?? { ...w, count: 0, letters: [] }; p.count += w.count; p.letters.push(`${w.letter} ${w.count}`); m.set(w.strongs, p); }); return [g, m]; });
    const all = new Map(); sums.forEach(([, m]) => m.forEach((w, k) => all.set(k, Math.max(all.get(k) ?? 0, w.count))));
    const inGroups = (k) => sums.filter(([, m]) => m.has(k)).length;
    const rows = [...all].filter(([k]) => inGroups(k) >= minGroups).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k]) => k), most = Math.max(...all.values());
    const word = (k) => sums.map(([, m]) => m.get(k)).find(Boolean);
    const [kg, kk] = s.kept ? s.kept.split(":") : [];
    const kw = kk ? sums.find(([g]) => g === kg)[1].get(kk) : null;
    return `<div class="panel"><div class="canon-wrap"><table class="word-table"><thead><tr><th></th>${groups.map(([g, d]) => `<th style="color: var(--${GROUP_TONE[g]})">${d.title}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((k) => `<tr><th><b>${word(k).gloss}</b><small>${word(k).greek} ${word(k).translit}</small></th>${sums.map(([g, m]) => { const w = m.get(k); if (!w) return "<td></td>";
        const r = 3 + 13 * Math.sqrt(w.count / most), on = s.kept === `${g}:${k}`;
        return `<td><button type="button" data-act="ckeep" data-arg="${key}|${g}:${k}" aria-pressed="${on}"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="${r + 4}" fill="var(--${GROUP_TONE[g]})" opacity=".15"/><circle cx="20" cy="20" r="${r}" fill="var(--${GROUP_TONE[g]})"/></svg><span>${w.count}</span></button></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
      ${tip(kw ? `<b style="color:var(--ink)">${kw.gloss}</b> (${kw.greek}, ${kw.translit}) in ${LETTERS.groups[kg].title}${keepX(key)} · ${kw.count} uses · ${kw.letters.join(" · ")}` : "", "Each group's key Greek words added together; a bigger star means more uses. Click a star.")}</div>`;
  }

  // ── A list on the left, the chosen item's detail on the right (letter parts, themes, people) ─
  function listDetail(key, items, { title, body, letters, refs, count }) {
    const s = st(key), i = Number(s.choice ?? 0), x = items[i];
    return `<div class="panel q-layout"><ol class="q-list">${items.map((it, n) => `<li><button type="button" data-act="cchoose" data-arg="${key}|${n}" aria-pressed="${n === i}">${count ? `<span class="q-n">${String(n + 1).padStart(2, "0")}</span> ` : ""}${title(it)}</button></li>`).join("")}</ol>
      <article class="detail"><h4>${title(x)}</h4><p>${body(x)}</p>${letters ? letterChips(letters(x)) : ""}${refs ? `<p class="detail-refs">${refsLine(refs(x), 12)}</p>` : ""}</article></div>`;
  }

  // ── Who wrote and carried them, and where one letter mentions another ───────────────────
  const ROLES = [["secretary", "Secretaries"], ["carrier", "Carriers"], ["co-sender", "Co-senders"], ["own-hand", "In the writer's own hand"]];
  function hands(key, roles = ROLES.map(([r]) => r), withLinks = true) {
    const s = st(key), kept = s.kept !== null ? O.hands[Number(s.kept)] : null;
    return `<div class="panel"><div class="hands-grid${roles.length === 2 ? " hands-2" : ""}">${ROLES.filter(([r]) => roles.includes(r)).map(([role, name]) => `<div><p class="panel-label">${name}</p><ul class="hand-list">${O.hands.map((h, i) => (h.role === role ? `<li><button type="button" data-act="ckeep" data-arg="${key}|${i}" aria-pressed="${String(i) === s.kept}" style="--tone: var(--${toneOfLetter(h.letter)})"><b>${h.name}</b><span>${O.names[h.letter]}</span></button></li>` : "")).join("")}</ul></div>`).join("")}</div>
      ${tip(kept ? `<b style="color:var(--ink)">${kept.name}</b>${keepX(key)} · ${O.names[kept.letter]}${kept.note ? ` · ${kept.note}` : ""}${refsLine(kept.refs)}` : "", "Click a name to read what the letter says.")}</div>
      ${withLinks ? `<div class="panel" style="margin-top:1rem"><p class="panel-label">Where one letter mentions another · ${O.letterLinks.length}</p>
        <ul class="ot-list">${O.letterLinks.map((l) => `<li><a>${O.names[l.from] ?? l.from}</a> <span>→</span> <a>${O.names[l.to] ?? l.to}</a> <span>· ${l.label}</span><small>${l.claim}</small></li>`).join("")}</ul></div>` : ""}`;
  }

  // ── All twenty-one, as long as each one is, cut into its section headings ───────────────
  function shape(key) {
    const s = st(key), longest = Math.max(...O.order.map((c) => O.sections[c].verses));
    const [kc, ki] = s.kept ? s.kept.split(":") : [], kept = kc ? O.sections[kc].sections[Number(ki)] : null;
    return `<div class="panel"><div class="shape-bars">${O.order.map((c) => `<div class="shape-row"><span>${O.names[c]}</span><div class="shape-bar" style="width:${(O.sections[c].verses / longest) * 100}%; --tone: var(--${toneOfLetter(c)})">
      ${O.sections[c].sections.map((x, i) => `<button type="button" style="flex-grow:${x.verses}" data-act="ckeep" data-arg="${key}|${c}:${i}" aria-pressed="${s.kept === `${c}:${i}`}" title="${x.title}"></button>`).join("")}</div><em>${O.sections[c].verses}</em></div>`).join("")}</div>
      ${tip(kept ? `<b style="color:var(--ink)">${kept.title}</b>${keepX(key)} · ${kept.ref} · ${kept.verses} verses` : "", "Section headings from the Berean Standard Bible (public domain). Click a segment to see its passage.")}</div>`;
  }

  // ── Compare any two letters: cross-references from OpenBible.info, read from the site ────
  const pairs = new Map(); // "GAL|JAS" → links, or "loading"
  const cmp = { chosen: ["GAL", "JAS"] };
  ACTIONS.ccompare = (code) => { const c = cmp.chosen; cmp.chosen = c.includes(code) ? c.filter((x) => x !== code) : c.length < 2 ? [...c, code] : [c[0], code]; st("compare").kept = null; };
  ACTIONS.cswap = () => { cmp.chosen = [cmp.chosen[1], cmp.chosen[0]]; st("compare").kept = null; };
  async function loadPair(a, b) {
    const pull = async (from, to, flip) => {
      const files = await Promise.all(O.chapters[from].map((_, i) => fetch(`/data/xref/${from}/${i + 1}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))));
      const found = [];
      files.forEach((file, i) => { for (const [k, targets] of Object.entries(file)) { const v = Number(k.split(":")[1]);
        for (const [start, end, votes] of targets) { if (Math.floor(start / 1e6) !== O.nums[to]) continue;
          const there = [[Math.floor(start / 1e3) % 1e3, start % 1e3], [Math.floor((end || start) / 1e3) % 1e3, (end || start) % 1e3]], here = [[i + 1, v], [i + 1, v]];
          found.push(flip ? { l: there, r: here, votes } : { l: here, r: there, votes }); } } });
      return found;
    };
    const merged = new Map();
    for (const l of [...(await pull(a, b, false)), ...(await pull(b, a, true))]) { const k = `${l.l[0]}-${l.r[0]}`; if (!merged.has(k) || merged.get(k).votes < l.votes) merged.set(k, l); }
    return [...merged.values()].sort((x, y) => y.votes - x.votes);
  }
  function compare(key) {
    const [a, b] = cmp.chosen;
    const picker = `<div class="compare-letters">${O.order.map((c) => `<button type="button" class="chip" style="--tone: var(--${toneOfLetter(c)})" data-act="ccompare" data-arg="${c}" aria-pressed="${cmp.chosen.includes(c)}">${O.names[c]}</button>`).join("")}</div>
      ${b ? `<button type="button" class="chip" style="--tone: var(--ink); margin-top:.6rem" data-act="cswap" data-arg="">⇅ Swap top and bottom</button>` : ""}`;
    if (!b) return `<div class="panel">${picker}<p class="tip">${a ? `${O.names[a]} chosen. Choose one more letter to compare it with.` : "Choose two letters to compare."}</p></div>`;
    const id = `${a}-${b}`, links = pairs.get(id);
    if (!links) { pairs.set(id, "loading"); loadPair(a, b).then((l) => { pairs.set(id, l); draw(); }).catch((e) => { console.error("compare: could not read cross-references", e); pairs.set(id, []); draw(); }); }
    if (!Array.isArray(links)) return `<div class="panel">${picker}<p class="tip">Reading the cross-references…</p></div>`;
    const rail = (c) => ({ label: O.names[c], start: [1, 1], end: [O.chapters[c].length, O.chapters[c].at(-1)], chapters: O.chapters[c], verses: O.chapters[c].reduce((x, y) => x + y, 0) });
    const shown = links.slice(0, 60);
    const par = { id, title: `${O.names[a]} and ${O.names[b]}`, left: rail(a), right: rail(b), claim: `${links.length} cross-reference links join these letters; the ${shown.length} with the most reader votes are drawn. Cross references from OpenBible.info (CC BY).`,
      pairs: shown.map((l) => ({ l: l.l, r: l.r, left: vlabel(a, ...l.l[0]) + (l.l[1][1] !== l.l[0][1] ? `–${l.l[1][1]}` : ""), right: vlabel(b, ...l.r[0]) + (l.r[1][1] !== l.r[0][1] || l.r[1][0] !== l.r[0][0] ? `–${l.r[1][1]}` : ""), weight: l.votes, kind: "", note: "", lt: "", rt: "" })) };
    return `<div class="panel" style="margin-bottom:1rem">${picker}</div>${CH.ribbon(`${key}-${id}`, [par], { weightLabel: "reader votes" })}`;
  }

  return { flow, wordTable, listDetail, hands, shape, compare, letterChips, toneOfLetter };
})();
