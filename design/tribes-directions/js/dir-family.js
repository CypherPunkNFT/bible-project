// C · The family. Jacob's twelve sons in the order of their births, each on his mother's line (Leah, Rachel,
// Bilhah, Zilpah), each name with the words said at the naming; each son flows on into his tribe (Joseph into
// Ephraim and Manasseh) and each tribe into its people.
(() => {
  // The mothers' lanes, in the order Genesis 35:23–26 groups the sons (from data: lists gen35 groups).
  const lanes = () => {
    const g = listById("gen35")?.groups ?? [];
    return g.map((x) => ({ label: x.label, name: x.label.split(",")[0], tribes: x.tribes }));
  };
  const motherOf = (id, L) => L.findIndex((l) => l.tribes.includes(id));
  const births = () => listById("birth")?.order ?? [];
  const MOTHER_TONE = ["var(--t-judah)", "var(--t-benjamin)", "var(--t-dan)", "var(--t-gad)"];
  const named = (t, n = 3) => (t?.people?.named ?? []).filter((p) => p.how === "verse").slice(0, n);

  const tribePill = (id) => {
    const t = T.byId[id];
    return `<a class="fm-tribe" href="#family/${id}" data-tribe="${id}" style="--tone:${tone(id)}"><b>${esc(tribeName(id))}</b>
      <span>${typeof t?.people?.tagged === "number" ? `${fmt(t.people.tagged)} people our data places here` : "people: data pending"}</span></a>`;
  };
  const peopleCell = (ids) => `<div class="fm-people">${ids.map((id) => {
    const t = T.byId[id], ppl = named(t, 4);
    return ppl.length ? ppl.map((p) => `<a class="fm-person" href="${personHref(p.personId)}" style="--tone:${tone(id)}" title="${esc(p.role ?? "")} · ${esc(refText(p.span))}">${esc(p.name)}</a>`).join("") : `<span class="fm-person is-pending" style="--tone:${tone(id)}">${t?.people ? "—" : pend()}</span>`;
  }).join("")}</div>`;

  // The tribes on the right, ordered by how many people our data places in each (most first); the ribbons cross
  // to show how differently the sons' lines carry on.
  const tribeOrder = () => births().flatMap((id) => (id === "joseph" ? ["ephraim", "manasseh"] : [id]))
    .sort((a, b) => (T.byId[b]?.people?.tagged ?? -1) - (T.byId[a]?.people?.tagged ?? -1));
  function river(main) {
    const L = lanes(), B = births();
    const rows = B.map((id, i) => {
      const t = T.byId[id], m = motherOf(id, L), q = t?.son?.nameQuote;
      const into = id === "joseph" ? ["ephraim", "manasseh"] : [id];
      return `<div class="fm-row" data-i="${i}" data-id="${id}" data-into="${into.join(" ")}" style="--tone:${tone(id)}; --mt:${MOTHER_TONE[m] ?? "var(--muted)"}">
        <div class="fm-lanes">${L.map((l, k) => `<span class="fm-lane ${k === m ? "is-mine" : ""}" style="--mt:${MOTHER_TONE[k]}">${k === m ? "<i></i>" : ""}</span>`).join("")}</div>
        <a class="fm-son glass" href="#family/${id}">
          <span class="fm-ord">${String(t?.son?.order ?? i + 1).padStart(2, "0")}</span>
          <div><b>${esc(tribeName(id))}</b><small>${esc(L[m]?.name ?? "")}'s son${t?.son?.namedBy && t.son.namedBy !== L[m]?.name ? ` · named by ${esc(t.son.namedBy)}` : ""}</small>
          ${q?.text ? `<p class="fm-words">“${esc(q.text)}”</p><span class="fm-ref">${esc(refText(q.span))}</span>` : `<p>${pend("nameQuote")}</p>`}</div>
        </a>
        <div class="fm-into fm-inline">${into.map(tribePill).join("")}${peopleCell(into)}</div>
      </div>`;
    }).join("");
    const right = tribeOrder().map((id) => `<div class="fm-dest" data-tribe="${id}" style="--tone:${tone(id)}">${tribePill(id)}${peopleCell([id])}</div>`).join("");
    main.innerHTML = `<div class="fm-river">
      <div class="fm-head">
        <div class="fm-head-left"><div class="fm-lanes fm-lane-heads">${L.map((l, k) => `<span style="--mt:${MOTHER_TONE[k]}" title="${esc(l.label)}"><b>${esc(l.name)}</b></span>`).join("")}</div>
        <div class="fm-h">The sons, in the order of their births ${refLink(listById("birth")?.span)}</div></div><div></div>
        <div class="fm-h">The tribes, most people first <span class="tag-ours">ordered, and the ribbons drawn as wide, by the people our data places in each</span></div>
      </div>
      <div class="fm-body"><div class="fm-left">${rows}</div><div class="fm-gap"></div><div class="fm-right">${right}</div></div>
      <svg class="fm-svg" aria-hidden="true"></svg>
    </div>`;
    const box = main.querySelector(".fm-river"), svg = box.querySelector(".fm-svg");
    const maxTagged = Math.max(1, ...T.tribes.map((x) => x.people?.tagged ?? 0));
    const rowsEl = [...box.querySelectorAll(".fm-row")];
    let last = 1;
    // The births, one by one (the ticker's animation): node, son, ribbon, tribe.
    const frame = (p) => {
      last = p;
      const n = rowsEl.length;
      rowsEl.forEach((row, i) => {
        const f = clamp01(p * (n + 1) - i);
        row.style.setProperty("--b", easeOut(clamp01(f * 1.6)).toFixed(3));
        const rr = easeInOut(clamp01(f * 1.6 - .5));
        row.dataset.into.split(" ").forEach((tid) => box.querySelector(`.fm-dest[data-tribe="${tid}"]`)?.style.setProperty("--r", rr.toFixed(3)));
        svg.querySelectorAll(`.fm-ribbon[data-i="${i}"]`).forEach((path) => (path.style.strokeDashoffset = String(1 - easeInOut(clamp01(f * 1.4 - .3)))));
      });
    };
    // Ribbons from each son to his tribe(s), drawn from the laid-out boxes so they follow any width.
    const draw = () => {
      const b = box.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
      svg.innerHTML = rowsEl.map((row) => {
        const son = row.querySelector(".fm-son").getBoundingClientRect();
        return row.dataset.into.split(" ").map((tid) => {
          const p = box.querySelector(`.fm-dest[data-tribe="${tid}"] .fm-tribe`);
          if (!p) return "";
          const r = p.getBoundingClientRect();
          if (r.left - son.right < 24) return "";
          const x0 = son.right - b.left, y0 = son.top + son.height / 2 - b.top, x1 = r.left - b.left, y1 = r.top + r.height / 2 - b.top, mx = (x0 + x1) / 2;
          const w = 2 + 14 * ((T.byId[tid]?.people?.tagged ?? 0) / maxTagged);
          return `<path class="fm-ribbon" data-i="${row.dataset.i}" data-tribe="${tid}" style="--tone:${tone(tid)}; stroke-width:${w.toFixed(1)}px" d="M${x0.toFixed(1)},${y0.toFixed(1)} C${mx.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}" pathLength="1"/>`;
        }).join("");
      }).join("");
      frame(last);
    };
    // Hover a son or a tribe: its ribbon lights, the others step back.
    box.addEventListener("mouseover", (e) => {
      const el = e.target.closest(".fm-row, .fm-dest");
      const ids = el ? (el.dataset.into ?? el.dataset.tribe).split(" ") : null;
      svg.querySelectorAll(".fm-ribbon").forEach((p) => p.classList.toggle("is-dim", !!ids && !ids.includes(p.dataset.tribe)));
    });
    box.addEventListener("mouseleave", () => svg.querySelectorAll(".fm-ribbon").forEach((p) => p.classList.remove("is-dim")));
    draw();
    const ro = new ResizeObserver(draw); ro.observe(box);
    return { frame, destroy: () => ro.disconnect(), draw };
  }

  function guide(main) {
    main.innerHTML = `<section class="wrap fm-stage">
      ${topline(false)}
      <header class="fm-hero">
        <span class="kicker">${icon("users", 14)}The twelve tribes · the family</span>
        <h1>One father, four mothers, <em>twelve names</em></h1>
        <p>Each tribe begins as a child named by his mother, and each name is a sentence: what she felt the day he was born. Follow a son along to the tribe he became, and the people Scripture names from it.</p>
        <button type="button" class="fm-play">${icon("play", 15)}Play the births</button>
      </header>
      <div class="fm-host"></div>
      ${listById("birth")?.notes ? `<p class="fm-note">${icon("help", 14)}${esc(listById("birth").notes)}</p>` : ""}
    </section>`;
    const r = river(main.querySelector(".fm-host"));
    const run = () => Clock.run({ label: "The twelve births", duration: 12000, frame: r.frame, moving: (p) => { const i = Math.min(11, Math.floor(p * 13)); return [`${tribeName(births()[i])} is born`]; } });
    main.querySelector(".fm-play").addEventListener("click", run);
    run();
    return () => r.destroy();
  }

  // ── The tribe page: a family portrait ──
  function tribePage(main, id) {
    const t = T.byId[id];
    if (!t) { main.innerHTML = `<div class="wrap">${topline(true)}${picker(id)}${pendingTribe(id)}</div>`; return null; }
    const L = lanes(), B = births(), m = motherOf(id, L);
    const isJosephs = id === "ephraim" || id === "manasseh";
    const brothers = B.filter((x) => motherOf(x, L) === m && x !== id);
    const ppl = t.people?.named ?? [];
    const byRole = {};
    ppl.forEach((p) => { const k = roleGroup(p.role); (byRole[k] ??= []).push(p); });
    main.innerHTML = `<section class="wrap fm-t" style="--tone:${tone(id)}">
      ${topline(true)}
      <div class="fm-pick">${picker(id)}</div>
      <div class="fm-portrait">
        <div class="fm-line">
          <div class="fm-node is-jacob"><small>Father</small><b>${isJosephs ? "Joseph" : "Jacob"}</b></div>
          <div class="fm-node is-mother" style="--mt:${MOTHER_TONE[m] ?? "var(--muted)"}"><small>Mother</small><b>${who(t.son?.mother) || "—"}</b>${L[m] && L[m].label !== L[m].name ? `<span>${esc(L[m].label)}</span>` : ""}</div>
          <div class="fm-node is-son glass"><small>${t.son?.order ? `${esc(cap(ordinal(t.son.order)))} of Jacob's sons` : `Named by ${esc(t.son?.namedBy ?? "")}`}</small><h1>${esc(t.name)}</h1>
            ${t.son?.nameQuote ? quote(t.son.nameQuote, "q-big") : pend("nameQuote")}
            <p class="sx-said">${esc(t.son?.namedBy ?? "")}'s words at the naming · ${refLink(t.son?.birth?.span)}</p></div>
        </div>
        <aside class="fm-sibs glass">
          <span class="kicker">${icon("users", 13)}The twelve, in the order of their births</span>
          <div class="fm-sib-row">${B.map((x, i) => `<a href="#family/${x}" class="fm-sib ${x === id || (isJosephs && x === "joseph") ? "is-me" : ""} ${motherOf(x, L) === m && !isJosephs ? "is-full" : ""}" style="--tone:${tone(x)}; --mt:${MOTHER_TONE[motherOf(x, L)]}"><i></i><span>${i + 1}</span><b>${esc(tribeName(x))}</b></a>`).join("")}</div>
          <p class="fm-sib-key">${isJosephs ? `Joseph's son, born in Egypt; counted as a tribe in his own right.` : brothers.length ? `Same mother: ${brothers.map(tribeName).join(", ")}` : ""}</p>
        </aside>
      </div>
      <section class="fm-descent glass">
        <header class="sx-head"><span class="sx-ico">${icon("branch", 20)}</span><div><span class="sx-n">06</span><h3>And his people</h3><p>The son becomes a tribe; these are the people the text ties to it</p></div></header>
        <div class="fm-tree">
          <div class="fm-tree-root"><b>${esc(t.name)}</b><span>${typeof t.people?.tagged === "number" ? `${fmt(t.people.tagged)} people our data places in the tribe` : pend()}</span>${chip("data")}</div>
          <div class="fm-branches">${Object.keys(byRole).length ? Object.entries(byRole).map(([k, list]) => `<div class="fm-branch"><h4>${esc(k)}</h4>${list.map((p) => `<div class="fm-leaf"><a href="${personHref(p.personId)}"><b>${esc(p.name)}</b></a><span>${esc(p.role ?? "")}</span><footer>${p.how === "verse" ? chip("scripture") : chip("data")}${refLink(p.span)}</footer></div>`).join("")}</div>`).join("") : `<p class="sx-muted">${pend("people.named")}</p>`}</div>
        </div>
        ${t.people?.taggedNote ? `<p class="sx-note">${icon("help", 14)}${esc(t.people.taggedNote)}</p>` : ""}
      </section>
      <div class="fm-grid">${["blessings", "numbers", "camp", "land", "story", "fate", "visions", "tradition"].map((k) => sec(k, t)).join("")}</div>
    </section>`;
    const host = main.querySelector(".fm-sec-map");
    let off = null;
    if (host) {
      const mp = LandMap(host, { labels: false, tribes: [...new Set([...landTribes(), id])], townLabels: [id], outlines: true });
      mp.focus(id);
      const fit = () => mp.setView(mp.fit(mp.cons[id]?.box ?? landBox()));
      fit(); const ro = new ResizeObserver(fit); ro.observe(host);
      off = () => { ro.disconnect(); mp.destroy(); };
    }
    // The portrait assembles: father, mother, son (the ticker's animation).
    const nodes = [...main.querySelectorAll(".fm-node, .fm-sib")];
    Clock.run({ label: `${t.name}: the family portrait`, duration: 2400, frame: (p) => nodes.forEach((n, i) => n.style.setProperty("--b", easeOut(clamp01(p * 2.2 - i / nodes.length)).toFixed(3))), moving: () => ["Father, mother, son, brothers"] });
    return off;
  }
  // Grouping of the named people by the first word of their role (the data's own words).
  function roleGroup(role = "") {
    const r = role.toLowerCase();
    if (/\bking|queen\b/.test(r)) return "Kings";
    if (/judge|deliver/.test(r)) return "Judges";
    if (/prophet/.test(r)) return "Prophets";
    if (/prince|chief|captain|head/.test(r)) return "Princes and chiefs";
    if (/priest|levite/.test(r)) return "Priests and Levites";
    if (/spy|divid/.test(r)) return "Spies and dividers";
    return "Others the text names";
  }
  const sec = (key, t) => {
    const s = SECTIONS.find((x) => x.key === key);
    return `<section class="fm-sec fm-sec-${key} glass">
      <header class="sx-head"><span class="sx-ico">${icon(s.icon, 20)}</span><div><span class="sx-n">${String(s.n).padStart(2, "0")}</span><h3>${s.title}</h3><p>${s.sub}</p></div></header>
      ${SECTION(key, t)}${key === "land" ? `${landKey()}<div class="fm-sec-map"></div>` : ""}</section>`;
  };

  DIRECTIONS.family = { name: "The family", swatch: "var(--t-benjamin)", mount: (main, r) => (r.tribe ? tribePage(main, r.tribe) : guide(main)) };
})();
