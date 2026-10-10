// D · The ledger. Every list of the tribes in the data set out as a score: one row per list, one column per tribe,
// so who is present, missing, doubled or moved shows at a glance (each cell linked to its verse). "Braid" re-sets
// each row by position, so every tribe becomes a thread through the lists. Below: the two blessings as a duet,
// and a fingerprint card for each tribe.
(() => {
  const COLS = () => {
    const birth = listById("birth")?.order ?? tribeList().map((t) => t.id);
    const out = [];
    birth.forEach((id) => { out.push(id); if (id === "joseph") out.push("ephraim", "manasseh"); });
    tribeList().forEach((t) => { if (!out.includes(t.id)) out.push(t.id); });
    return out;
  };
  let LABEL_W = 300, CELL = 56;
  const ROW = 40, TOP = 74;
  const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  const words = (s) => (s ? s.trim().split(/\s+/).length : 0);

  // Every position a tribe holds in a list (1-based); [] when absent.
  const positions = (list, id) => list.order.map((x, i) => (x === id ? i + 1 : 0)).filter(Boolean);

  function score(host) {
    const cols = COLS(), lists = T.lists ?? [], narrow = host.clientWidth < 760;
    LABEL_W = narrow ? 150 : 300; CELL = narrow ? 46 : 56;
    const maxLen = Math.max(...lists.map((l) => l.order.length), cols.length);
    const W = LABEL_W + Math.max(cols.length, maxLen) * CELL + 20, H = TOP + lists.length * ROW + 20;
    const cx = (k) => LABEL_W + k * CELL + CELL / 2, cy = (r) => TOP + r * ROW + ROW / 2;
    // Each tribe's cells: [row, position index, column index].
    const cells = [];
    lists.forEach((l, r) => cols.forEach((id, c) => positions(l, id).forEach((pos, k) => cells.push({ r, c, pos, id, second: k > 0, span: l.cells?.filter((x) => x.tribe === id)[k]?.span, asNamed: l.cells?.filter((x) => x.tribe === id)[k]?.asNamed }))));
    host.innerHTML = `${narrow ? `<p class="ld-swipe">${icon("arrowRight", 14)}Swipe sideways for every tribe</p>` : ""}<div class="ld-scroll"><svg class="ld-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="The lists of the tribes, one row per list">
      <g class="ld-colheads">${cols.map((id, c) => `<g class="ld-colhead" data-c="${c}" transform="translate(${cx(c)} ${TOP - 14})" style="--tone:${tone(id)}"><text transform="rotate(-40)">${esc(tribeName(id))}</text><circle r="3" cy="6"/></g>`).join("")}
        ${Array.from({ length: maxLen }, (_, k) => `<text class="ld-poshead" x="${cx(k)}" y="${TOP - 10}">${k + 1}</text>`).join("")}</g>
      <g class="ld-rows">${lists.map((l, r) => `<g class="ld-row" data-r="${r}"><rect class="ld-rowbg" x="0" y="${TOP + r * ROW}" width="${W}" height="${ROW}"/>
        <text class="ld-label" x="12" y="${cy(r) - 2}"><title>${esc(l.label)}</title>${esc(narrow ? clip(l.label, 19) : l.label)}</text><text class="ld-ref" x="12" y="${cy(r) + 12}">${esc(refText(l.span))}</text></g>`).join("")}</g>
      <g class="ld-gaps">${lists.map((l, r) => cols.map((id, c) => (positions(l, id).length ? "" : `<line class="ld-gap" data-c="${c}" x1="${cx(c) - 7}" x2="${cx(c) + 7}" y1="${cy(r)}" y2="${cy(r)}" style="--tone:${tone(id)}"/>`)).join("")).join("")}</g>
      <g class="ld-threads">${cols.map((id) => `<path class="ld-thread" data-id="${id}" style="--tone:${tone(id)}"/>`).join("")}</g>
      <g class="ld-cells">${cells.map((e, i) => `<a href="${refHref(e.span ?? lists[e.r].span)}" class="ld-cell ${e.second ? "is-second" : ""}" data-i="${i}" data-r="${e.r}" data-id="${e.id}" style="--tone:${tone(e.id)}"><title>${esc(tribeName(e.id))}${e.asNamed && e.asNamed !== tribeName(e.id) ? ` (“${esc(e.asNamed)}”)` : ""} · ${ordinal(e.pos)} in ${esc(lists[e.r].label)} · ${esc(refText(e.span ?? lists[e.r].span))}</title>
        <circle r="13"/><text dy="4">${e.pos}</text></a>`).join("")}</g>
    </svg></div>`;
    const svg = host.querySelector(".ld-svg");
    const cellEls = [...svg.querySelectorAll(".ld-cell")], gaps = [...svg.querySelectorAll(".ld-gap")], threads = [...svg.querySelectorAll(".ld-thread")];
    // p: 0 = score (by tribe), 1 = braid (by position). Cells slide along their row; threads draw in.
    const set = (p) => {
      const k = easeInOut(p);
      const at = (e) => [cx(e.c) + (cx(e.pos - 1) - cx(e.c)) * k, cy(e.r)];
      cellEls.forEach((el, i) => { const [x, y] = at(cells[i]); el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`); });
      gaps.forEach((g) => g.style.opacity = String(1 - k));
      svg.querySelectorAll(".ld-colhead").forEach((g) => g.style.opacity = String(1 - k));
      svg.querySelectorAll(".ld-poshead").forEach((g) => g.style.opacity = String(k));
      threads.forEach((th) => {
        const id = th.dataset.id, mine = cells.filter((e) => e.id === id && !e.second);
        // A thread breaks where the tribe is missing from a list.
        let d = "", prev = -2;
        mine.forEach((e) => { const [x, y] = at(e); d += `${e.r === prev + 1 ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; prev = e.r; });
        th.setAttribute("d", d);
        th.style.opacity = String(k);
      });
      svg.dataset.mode = k > .5 ? "braid" : "score";
    };
    set(0);
    svg.addEventListener("mouseover", (e) => { const c = e.target.closest(".ld-cell"); svg.classList.toggle("is-tracing", !!c); svg.querySelectorAll(".ld-cell, .ld-thread").forEach((x) => x.classList.toggle("is-on", !!c && x.dataset.id === c.dataset.id)); });
    svg.addEventListener("mouseleave", () => svg.classList.remove("is-tracing"));
    return { set, svg };
  }

  // The duet: Jacob's order on the left, Moses' on the right, the same tribe joined across; choose a pair to read both.
  function duet(host, current) {
    const J = listById("gen49")?.order ?? [], Mo = listById("deut33")?.order ?? [];
    const all = [...new Set([...J, ...Mo])];
    host.innerHTML = `<div class="ld-duet">
      <div class="ld-duet-cols">
        <div class="ld-dcol">${J.map((id) => `<button type="button" class="ld-dn" data-id="${id}" style="--tone:${tone(id)}">${esc(tribeName(id))}</button>`).join("")}</div>
        <svg class="ld-dlines" aria-hidden="true"></svg>
        <div class="ld-dcol is-right">${Mo.map((id) => `<button type="button" class="ld-dn" data-id="${id}" style="--tone:${tone(id)}">${esc(tribeName(id))}</button>`).join("")}${all.filter((id) => !Mo.includes(id)).map((id) => `<span class="ld-dn is-none" data-id="${id}" style="--tone:${tone(id)}">${esc(tribeName(id))}: none</span>`).join("")}</div>
      </div>
      <div class="ld-duet-stage glass"></div>
    </div>`;
    const svg = host.querySelector(".ld-dlines"), stage = host.querySelector(".ld-duet-stage");
    const draw = () => {
      const b = svg.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
      svg.innerHTML = all.map((id) => {
        const l = host.querySelector(`.ld-dcol:not(.is-right) [data-id="${id}"]`), r = host.querySelector(`.ld-dcol.is-right [data-id="${id}"]`);
        if (!l || !r) return "";
        const a = l.getBoundingClientRect(), c = r.getBoundingClientRect(), y0 = a.top + a.height / 2 - b.top, y1 = c.top + c.height / 2 - b.top;
        return `<path class="ld-dline" data-id="${id}" style="--tone:${tone(id)}" d="M0,${y0.toFixed(1)} C${b.width / 2},${y0.toFixed(1)} ${b.width / 2},${y1.toFixed(1)} ${b.width},${y1.toFixed(1)}" pathLength="1"/>`;
      }).join("");
    };
    const pick = (id) => {
      const t = T.byId[id];
      host.querySelectorAll(".ld-dn, .ld-dline").forEach((x) => x.classList.toggle("is-on", x.dataset.id === id));
      stage.style.setProperty("--tone", tone(id));
      stage.innerHTML = t ? `<span class="kicker">${esc(t.name)}</span>${SECTION("blessings", t)}<p class="ld-wc">${chip("ours")} Words: Jacob ${words(t.blessings?.jacob?.text)} · Moses ${t.blessings?.moses ? words(t.blessings.moses.text) : 0}</p>` : pendingTribe(id);
    };
    host.addEventListener("click", (e) => { const b = e.target.closest(".ld-dn"); if (b) pick(b.dataset.id); });
    draw(); const ro = new ResizeObserver(draw); ro.observe(host);
    pick(current ?? J[0]);
    return { pick, ids: J, destroy: () => ro.disconnect() };
  }

  // A tribe's fingerprint: presence across every list (a barcode), the two censuses, blessing lengths, land, people, fate.
  function fingerprint(id, big = false) {
    const t = T.byId[id], lists = T.lists ?? [];
    if (!t) return `<a class="ld-fp glass is-pending" href="#ledger/${id}" style="--tone:${tone(id)}"><b>${esc(tribeName(id))}</b>${pend()}</a>`;
    const max = censusMax(), towns = townsOf(t).length;
    const north = T.kingdom?.north?.includes(id), south = T.kingdom?.south?.includes(id);
    const bars = lists.map((l) => { const p = positions(l, id); return `<i class="${p.length ? "" : "is-out"} ${p.length > 1 ? "is-two" : ""}" style="--h:${p.length ? 1 - (p[0] - 1) / Math.max(l.order.length, 1) * .6 : .15}" title="${esc(l.label)}: ${p.length ? p.map(ordinal).join(" and ") : "absent"}"></i>`; }).join("");
    return `<${big ? "div" : "a"} class="ld-fp glass ${big ? "is-big" : ""}" ${big ? "" : `href="#ledger/${id}"`} style="--tone:${tone(id)}">
      <header><b>${esc(t.name)}</b><span>${t.son?.order ? `son ${t.son.order} · ${esc(t.son.mother?.name ?? "")}` : `Joseph's son · ${esc(t.son?.mother?.name ?? "")}`}</span></header>
      <div class="ld-bars" aria-label="Present in ${lists.filter((l) => positions(l, id).length).length} of ${lists.length} lists">${bars}</div>
      <p class="ld-bars-cap">In ${lists.filter((l) => positions(l, id).length).length} of ${lists.length} lists · taller bar = earlier in the list</p>
      <dl>
        <div><dt>Numbers 1 → 26</dt><dd><span class="ld-mini"><i style="--w:${(t.census?.first?.n ?? 0) / max}"></i><i style="--w:${(t.census?.second?.n ?? 0) / max}"></i></span>${fmt(t.census?.first?.n) || "—"} → ${fmt(t.census?.second?.n) || "—"}</dd></div>
        <div><dt>Blessing words</dt><dd>Jacob ${words(t.blessings?.jacob?.text)} · Moses ${t.blessings?.moses ? words(t.blessings.moses.text) : "none"}</dd></div>
        <div><dt>Towns placed</dt><dd>${towns || "—"}</dd></div>
        <div><dt>People (our data)</dt><dd>${typeof t.people?.tagged === "number" ? fmt(t.people.tagged) : "pending"}</dd></div>
        <div><dt>Kingdom</dt><dd>${north ? "North" : south ? "Judah" : T.kingdom ? "Unclear" : "pending"}</dd></div>
        <div><dt>Revelation 7</dt><dd>${t.revelation7?.n ? fmt(t.revelation7.n) : listById("rev7") ? (positions(listById("rev7"), id).length ? "Named" : "Absent") : "pending"}</dd></div>
      </dl>
      ${big ? "" : `<span class="ld-fp-go">${icon("arrowRight", 15)}</span>`}
    </${big ? "div" : "a"}>`;
  }
  const ours = `<p class="ld-ours">${chip("ours")} Word counts, list counts and bar heights are our own arithmetic from the data.</p>`;

  function guide(main) {
    const lists = T.lists ?? [];
    main.innerHTML = `<section class="wrap ld-stage">
      ${topline(false)}
      <header class="ld-hero">
        <div><span class="kicker">${icon("layers", 14)}The twelve tribes · the ledger</span>
        <h1>${lists.length || "The"} lists, <em>never the same twice</em></h1>
        <p>Scripture names the tribes again and again, and the list keeps changing. Each row is one list; each circle is a tribe's place in it. Missing, doubled, reordered: it shows at a glance.</p></div>
        <div class="ld-modes"><div class="cp-seg ld-seg" role="group" aria-label="Arrange by"><button type="button" data-mode="0" aria-pressed="true">Score · by tribe</button><button type="button" data-mode="1" aria-pressed="false">Braid · by place</button><i></i></div>
          <p class="ld-hint">Hover a circle to trace that tribe through every list; click it to read the verse.</p></div>
      </header>
      <div class="ld-score glass"></div>
      <div class="ld-notes">${lists.map((l) => expander(`<p>${esc(l.notes ?? "")}</p><p class="ld-note-meta">${has(l.absent) ? `Absent: ${l.absent.map(tribeName).join(", ")}. ` : ""}${has(l.doubled) ? `Twice: ${l.doubled.map(tribeName).join(", ")}. ` : ""}${refLink(l.span)}</p>`, { cls: "ld-note", closed: l.label, opened: l.label })).join("")}</div>
    </section>
    <section class="wrap ld-duet-sec">
      <header class="sec-head"><div><h2>The two blessings, a duet</h2><p>Jacob's order (Genesis 49) on the left, Moses' (Deuteronomy 33) on the right. Choose a tribe to hear both.</p></div></header>
      <div class="ld-duet-host"></div>
    </section>
    <section class="wrap ld-fps">
      <header class="sec-head"><div><h2>Fingerprints</h2><p>Each tribe at a glance: where it stands in every list, its numbers, its words, its land and its end.</p></div></header>
      <div class="ld-fp-grid">${COLS().map((id) => fingerprint(id)).join("")}</div>${ours}
    </section>`;
    const sc = score(main.querySelector(".ld-score"));
    const dt = duet(main.querySelector(".ld-duet-host"));
    let mode = 0;
    main.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
      const to = Number(b.dataset.mode), from = mode; mode = to;
      main.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      main.querySelector(".ld-seg").dataset.on = String(to);
      Clock.run({ label: to ? "Score → braid: every tribe a thread" : "Braid → score", duration: 3200, frame: (q) => sc.set(from + (to - from) * q), moving: () => ["Circles sliding to their place in each list", "Threads drawing through the rows"] });
    }));
    // Opening: the score fills row by row.
    const rows = [...sc.svg.querySelectorAll(".ld-row")];
    const cellsEl = [...sc.svg.querySelectorAll(".ld-cell")];
    Clock.run({ label: "The ledger fills, list by list", duration: 2600, frame: (q) => { const n = rows.length * q; rows.forEach((row, i) => row.classList.toggle("is-in", n >= i)); cellsEl.forEach((c) => c.style.setProperty("--in", easeOut(clamp01(n - Number(c.dataset.r))).toFixed(3))); },
      moving: (q) => [`Row ${Math.min(rows.length, Math.floor(q * rows.length) + 1)} of ${rows.length}`] });
    return () => dt.destroy();
  }

  function tribePage(main, id) {
    const t = T.byId[id];
    if (!t) { main.innerHTML = `<div class="wrap">${topline(true)}${picker(id)}${pendingTribe(id)}</div>`; return null; }
    const lists = T.lists ?? [];
    main.innerHTML = `<section class="wrap ld-t" style="--tone:${tone(id)}">
      ${topline(true)}
      <div class="ld-pick">${picker(id)}</div>
      <div class="ld-t-hero">
        <div><span class="kicker">The ledger of a tribe</span><h1>${esc(t.name)}</h1>${t.son?.nameQuote ? quote(t.son.nameQuote, "q-big") : ""}</div>
        ${fingerprint(id, true)}
      </div>
      <section class="ld-entries glass">
        <header class="sx-head"><span class="sx-ico">${icon("layers", 20)}</span><div><span class="sx-n">LISTS</span><h3>${esc(t.name)} in every list</h3><p>Its place in each, as the text names it</p></div></header>
        <div class="ld-entry-rows">${lists.map((l) => { const p = positions(l, id), cell = l.cells?.find((c) => c.tribe === id);
          return `<div class="ld-entry ${p.length ? "" : "is-out"}"><span class="ld-e-pos">${p.length ? p.join(" · ") : "—"}</span><div><b>${esc(l.label)}</b><small>${p.length ? `${p.map(ordinal).join(" and ")} of ${l.order.length}${cell?.asNamed && cell.asNamed !== t.name ? ` · named “${esc(cell.asNamed)}”` : ""}` : "Absent"}</small></div>${refLink(cell?.span ?? l.span)}
            <span class="ld-e-strip">${l.order.map((x, i) => `<i class="${x === id ? "is-me" : ""}" style="--tone:${tone(x)}" title="${i + 1}. ${esc(tribeName(x))}"></i>`).join("")}</span></div>`; }).join("")}</div>
      </section>
      <div class="ld-grid">${["birth", "blessings", "numbers", "camp", "land", "people", "story", "fate", "visions", "tradition"].map((k) => sec(k, t)).join("")}</div>
      ${ours}
    </section>`;
    const host = main.querySelector(".ld-sec-map");
    let off = null;
    if (host) {
      const mp = LandMap(host, { labels: false, tribes: [...new Set([...landTribes(), id])], townLabels: [id], outlines: true });
      mp.focus(id);
      const fit = () => mp.setView(mp.fit(mp.cons[id]?.box ?? landBox()));
      fit(); const ro = new ResizeObserver(fit); ro.observe(host);
      off = () => { ro.disconnect(); mp.destroy(); };
    }
    const rows = [...main.querySelectorAll(".ld-entry")];
    Clock.run({ label: `${t.name}: entering the ledger`, duration: 2000, frame: (q) => rows.forEach((r, i) => r.style.setProperty("--in", easeOut(clamp01(q * (rows.length + 4) / 4 - i / 4)).toFixed(3))), moving: () => ["Ledger rows writing in"] });
    return off;
  }
  const sec = (key, t) => {
    const s = SECTIONS.find((x) => x.key === key);
    return `<section class="ld-sec ld-sec-${key} glass">
      <header class="sx-head"><span class="sx-ico">${icon(s.icon, 20)}</span><div><span class="sx-n">${String(s.n).padStart(2, "0")}</span><h3>${s.title}</h3><p>${s.sub}</p></div></header>
      ${SECTION(key, t, { limit: 9 })}${key === "land" ? `${landKey()}<div class="ld-sec-map"></div>` : ""}</section>`;
  };

  DIRECTIONS.ledger = { name: "The ledger", swatch: "var(--t-issachar)", mount: (main, r) => (r.tribe ? tribePage(main, r.tribe) : guide(main)) };
})();
