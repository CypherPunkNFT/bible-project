// The second page of B: everyone and everything around the apostle on one sky. He is at the centre; around him four
// rings: the people named beside him, the places, his moments in story order (clockwise from the top), and his own
// words. Choosing any point draws its links (the verses that put them together) and opens it beside the sky.
(() => {
  const params = new URLSearchParams(location.search);
  const who = WHO.includes(params.get("who")) ? params.get("who") : "peter";
  const from = ["a", "b", "c"].includes(params.get("from")) ? params.get("from") : "b";
  const main = Frame.mount();
  const RINGS = [["people", "People", .36], ["places", "Places", .53], ["moments", "Moments", .71], ["words", "His words", .89]];

  function build(d) {
    const nodes = [], links = [];
    const add = (n) => { n.i = nodes.length; nodes.push(n); return n; };
    const centre = add({ ring: "centre", label: d.short });
    const moments = d.scripture.filter((e) => e.type !== "fact");
    const mNode = {};
    moments.forEach((e, k) => { mNode[e.key] = add({ ring: "moments", label: e.title, e, k, n: moments.length }); });
    const people = d.rows.slice().sort((a, b) => moments.findIndex((e) => e.with[a.key]) - moments.findIndex((e) => e.with[b.key]));
    people.forEach((r, k) => { const n = add({ ring: "people", label: r.name, r, k, n: people.length }); moments.forEach((e) => { if (e.with[r.key]) links.push([n.i, mNode[e.key].i]); }); links.push([centre.i, n.i, "c"]); });
    const places = d.places.filter((p) => p.entries.some((k) => mNode[k]) || p.tradition);
    places.forEach((p, k) => { const n = add({ ring: "places", label: p.name.replace(/\s*\(.*\)$/, ""), p, k, n: places.length }); p.entries.forEach((key) => mNode[key] && links.push([n.i, mNode[key].i])); });
    const words = d.words.filter((w) => mNode[w.entry]);
    words.forEach((w, k) => { const n = add({ ring: "words", label: `“${w.t}”`, w, k, n: words.length }); links.push([n.i, mNode[w.entry].i]); });
    return { nodes, links, counts: { people: people.length, places: places.length, moments: moments.length, words: words.length } };
  }

  function render(d) {
    const g = build(d);
    main.innerHTML = `<div class="wrap"><div class="topline"><a class="back" href="./?d=${from}&who=${who}">${icon("arrowLeft", 14)}Back to ${esc(d.short)}</a>
        <nav class="who-switch" aria-label="Apostle">${WHO.map((w) => `<a href="?who=${w}&from=${from}" ${w === who ? 'aria-current="page"' : ""}>${WHO_NAME[w]}</a>`).join("")}</nav></div>
      <section class="intro"><div><p class="kicker rule">Second page · everyone around him</p><h1>${esc(d.short)}, <em>on one sky.</em></h1>
        <p class="lede">He is at the centre. Around him, in four rings: the people named beside him, the places, his moments in story order (clockwise from the top), and his own words. Choose any point to see what joins it to the rest.</p></div>
        <dl class="figures"><div><dt>People</dt><dd>${g.counts.people}</dd></div><div><dt>Places</dt><dd>${g.counts.places}</dd></div><div><dt>Moments</dt><dd>${g.counts.moments}</dd></div><div><dt>His own words</dt><dd>${g.counts.words}<small> lines</small></dd></div></dl></section>
      <div class="sky-tools"><div class="seg" role="group" aria-label="Show">${[["all", "Everything"], ...RINGS.map(([k, l]) => [k, l])].map(([k, l], i) => `<button type="button" data-ring="${k}" aria-pressed="${i === 0}">${l}</button>`).join("")}</div></div>
      <div class="sky"><div class="sky-art"></div><aside class="sky-panel" aria-live="polite"></aside></div></div>`;
    const art = main.querySelector(".sky-art"), panel = main.querySelector(".sky-panel");
    let sel = 0, show = "all";
    const S = 760, C = S / 2, R = S / 2 - 18;
    const pos = (n) => {
      if (n.ring === "centre") return [C, C];
      const r = R * RINGS.find(([k]) => k === n.ring)[2], a = -Math.PI / 2 + (n.k / n.n) * Math.PI * 2 + (n.ring === "people" ? .2 : n.ring === "places" ? .45 : n.ring === "words" ? .05 : 0);
      return [C + Math.cos(a) * r, C + Math.sin(a) * r, a];
    };
    g.nodes.forEach((n) => { [n.x, n.y, n.a] = pos(n); });
    const linked = (i) => new Set(g.links.filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a)));
    function draw() {
      const near = linked(sel);
      const o = [`<g class="rings">${RINGS.map(([k, l, f]) => `<circle cx="${C}" cy="${C}" r="${R * f}" class="${show === "all" || show === k ? "" : "faint"}"/><text x="${C}" y="${C - R * f - 6}" text-anchor="middle">${l.toUpperCase()}</text>`).join("")}</g>`];
      o.push(`<g class="links">${g.links.filter(([a, b]) => a === sel || b === sel).map(([a, b]) => { const p = g.nodes[a], q = g.nodes[b], mx = (p.x + q.x) / 2 + (C - (p.x + q.x) / 2) * .35, my = (p.y + q.y) / 2 + (C - (p.y + q.y) / 2) * .35; return `<path d="M${p.x.toFixed(1)} ${p.y.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}"/>`; }).join("")}</g>`);
      for (const n of g.nodes) {
        if (n.ring === "centre") { o.push(`<g class="pt centre ${sel === 0 ? "on" : ""}" data-i="0"><circle cx="${C}" cy="${C}" r="34"/><text x="${C}" y="${C + 5}" text-anchor="middle">${esc(d.short)}</text></g>`); continue; }
        const on = n.i === sel, lit = near.has(n.i), dim = (show !== "all" && show !== n.ring) || (sel && !on && !lit);
        const lab = n.ring === "people" || n.ring === "places" || on || (lit && n.ring !== "words");
        const out = Math.cos(n.a) >= 0, lx = n.x + (out ? 8 : -8), txt = n.label.length > 34 ? n.label.slice(0, 32) + "…" : n.label;
        const shape = n.ring === "places" ? `<rect x="${n.x - 4}" y="${n.y - 4}" width="8" height="8" transform="rotate(45 ${n.x} ${n.y})" class="${n.p.tradition ? "trad" : ""}"/>` : n.ring === "words" ? `<circle cx="${n.x}" cy="${n.y}" r="3"/>` : `<circle cx="${n.x}" cy="${n.y}" r="${n.ring === "people" ? 5.5 : 4}" style="${n.e ? `--tone:${PERIOD_TONE[n.e.period]}` : ""}"/>`;
        o.push(`<g class="pt ${n.ring} ${on ? "on" : ""} ${lit ? "lit" : ""} ${dim ? "dim" : ""}" data-i="${n.i}">${shape}<circle class="hit" cx="${n.x}" cy="${n.y}" r="9"/>${lab ? `<text x="${lx.toFixed(1)}" y="${(n.y + 4).toFixed(1)}" text-anchor="${out ? "start" : "end"}">${esc(txt)}</text>` : ""}</g>`);
      }
      art.innerHTML = `<svg viewBox="-120 0 ${S + 240} ${S}" role="img" aria-label="${esc(d.short)} and everyone around him">${o.join("")}</svg>`;
      panel.innerHTML = panelHTML(d, g, sel, near);
    }
    function panelHTML(d, g, i, near) {
      const n = g.nodes[i], list = [...near].map((j) => g.nodes[j]).filter((m) => m.ring !== "centre");
      const linkList = list.length ? `<h4 class="sheet-h">Joined to ${plural(list.length, "point")}</h4><ul class="sky-links">${list.slice(0, 14).map((m) => `<li><button type="button" data-i="${m.i}"><i class="k-${m.ring}"></i>${esc(m.label.length > 70 ? m.label.slice(0, 68) + "…" : m.label)}</button></li>`).join("")}${list.length > 14 ? `<li class="muted">and ${list.length - 14} more</li>` : ""}</ul>` : "";
      if (n.ring === "centre") return `<p class="kicker">The centre</p><h3>${esc(d.name)}</h3><p class="sky-text">${esc(d.story ?? d.tagline)}</p><p class="plain-line">${d.otherNames.map(esc).join(" · ")}</p>${linkList}`;
      if (n.ring === "people") return `<p class="kicker">Named beside him · ${plural(n.r.n, "record")}</p><h3>${esc(n.r.name)}</h3>${d.companions.find((c) => c.person.personId === n.r.id) ? `<p class="sky-text">${esc(d.companions.find((c) => c.person.personId === n.r.id).claim.text)}</p>` : ""}<a class="ref" href="${personHref(n.r.id)}">Open ${esc(n.r.name)}’s page</a>${linkList}`;
      if (n.ring === "places") return `<p class="kicker">${n.p.tradition ? "Known from tradition" : "A place in his story"}</p><h3>${esc(n.p.name)}</h3>${n.p.from ? `<p class="plain-line">${n.p.from.km.toLocaleString("en-GB")} km ${n.p.from.dir} of Jerusalem</p>` : ""}${n.p.note ? `<p class="sky-text">${esc(n.p.note)}</p>` : ""}${claimFoot({ layer: n.p.tradition ? "tradition" : "scripture", refs: n.p.refs })}${linkList}`;
      if (n.ring === "words") return `<p class="kicker">His own words</p><blockquote class="sky-q">${esc(n.w.t)}<footer>${refLink([n.w.v, n.w.v])} · KJV</footer></blockquote>${linkList}`;
      const e = n.e;
      return `<p class="kicker">${ROMAN[e.period]} · ${esc(d.periods[e.period - 1].title)}</p><h3>${esc(e.title)}</h3>${e.lead ? `<blockquote class="sky-q">${markNames(vtext(e.lead))}<footer>${refLink([e.lead, e.lead])} · KJV</footer></blockquote>` : ""}${claimFoot(e)}${linkList}`;
    }
    main.addEventListener("click", (e) => {
      const p = e.target.closest("[data-i]"); if (p) { sel = Number(p.dataset.i); draw(); return; }
      const r = e.target.closest("[data-ring]"); if (r) { show = r.dataset.ring; main.querySelectorAll("[data-ring]").forEach((b) => b.setAttribute("aria-pressed", String(b === r))); draw(); }
    });
    art.addEventListener("pointermove", (e) => { const p = e.target.closest("[data-i]"); if (!p) { Tip.hide(); return; } const n = g.nodes[Number(p.dataset.i)]; Tip.show(`<b>${esc(n.label)}</b><small>${esc(RINGS.find(([k]) => k === n.ring)?.[1] ?? "")}</small>`, e.clientX, e.clientY); });
    art.addEventListener("pointerleave", () => Tip.hide());
    draw();
  }

  (async () => {
    try { await loadBooks(); const d = await loadApostle(who); window.D = d; document.title = `${d.short} on one sky · Bible Project`; render(d); }
    catch (error) { console.error("constellation: could not load", error); main.innerHTML = `<div class="wrap"><p class="plain-line">This page could not load its data (${esc(error.message)}).</p></div>`; }
  })();
})();
