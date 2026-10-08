// H · the sections around the chapters: the Atlas (the whole road on one quiet map, with a way into the Atlas), the
// man (his life and his family as a small tree of words), the word (the call, how the word came, the message, "mouth to
// mouth", the prophet "like unto me" and its use in Acts), and the people around him (the shared constellation field).
(() => {
  const vtext = (X, ref) => X.kjv[ref[0] === ref[1] ? String(ref[0]) : `${ref[0]}-${ref[1]}`] ?? "";
  const kv = (X, ref, cls = "") => `<blockquote class="mx-v ${cls}"><p>${esc(vtext(X, ref))}</p><footer>${refLink(ref)} · KJV</footer></blockquote>`;
  const secHead = (n, kick, title, lead) => `<header class="mx-head"><span class="mx-n">${n}</span><div><span class="mg-kick">${esc(kick)}</span><h2>${title}</h2>${lead ? `<p>${esc(lead)}</p>` : ""}</div></header>`;

  // ── The Atlas ──
  function atlas(X) {
    const A = X.atlas;
    return `<section class="mx mx-atlas" id="mg-atlas" data-sec="atlas" aria-label="Moses in the Atlas">
      <div class="wrap">${secHead("01", "In the Atlas", "The whole road, <em>Egypt to Nebo</em>", `${M.map.route.length} stops from the Atlas, with how sure it is of each place. The way between stops is reconstructed.`)}</div>
      <div class="mx-mapband"><div class="mx-map"></div><svg class="mx-leads" aria-hidden="true"></svg>
        ${A.stretches.map((s) => `<div class="mx-stretch" data-act="${s.act}" style="--tone:${ACT_TONE[s.act]}"><b>${esc(s.label)}</b><small>${esc(s.years)}</small><span>${esc(s.line)}</span></div>`).join("")}</div>
      <div class="wrap mx-atlas-foot"><a class="mx-go" href="${esc(A.href)}">${icon("route", 18)}<span><b>Follow Moses in the Atlas</b><small>Moses' journey in the Atlas is coming: so far only Paul's journey is built. The link opens the Atlas journeys page, where Moses already has a card.</small></span>${icon("arrowRight", 16)}</a>
        <p class="mx-key">${esc(M.map.key)}</p></div></section>`;
  }
  // The map fills the band; each stretch's name floats beside its part of the road, joined to it by a fine line.
  function wireAtlas(root, X) {
    const host = root.querySelector(".mx-map"), band = root.querySelector(".mx-mapband"), leads = root.querySelector(".mx-leads");
    const m = MosesMap(host, { mini: false });
    const place = () => {
      const r = band.getBoundingClientRect(); if (!r.width) return;
      const narrow = r.width < 760;
      const mh = host.getBoundingClientRect().height;
      m.setView(m.fit(m.viewFor(0), narrow ? { x: 14, y: 30, w: r.width - 96, h: mh - 60 } : { x: r.width * .2, y: 30, w: r.width * .6, h: r.height - 60 }));
      m.setProgress(15);
      const ctm = m.svg.getScreenCTM(), pt = m.svg.createSVGPoint();
      const toBand = ([x, y]) => { pt.x = x; pt.y = y; const p = pt.matrixTransform(ctm); return [p.x - r.left, p.y - r.top]; };
      const lines = [];
      root.querySelectorAll(".mx-stretch").forEach((el, k) => {
        const s = X.atlas.stretches[k], stops = s.stops.length > 1 && s.act === 3 ? [Math.round((s.stops[0] + s.stops[1]) / 2) + 3] : [s.stops[Math.floor(s.stops.length / 2)]];
        const [ax, ay] = toBand(M.map.route[stops[0]].xy);
        // Labels sit in the free margins: Egypt and Midian to the left and below, the wilderness to the right.
        const spots = narrow ? [[12, r.height - 128], [r.width / 2 + 6, r.height - 128], [12, r.height - 64]] : [[r.width * .04, r.height * .2], [r.width * .06, r.height * .7], [r.width * .8, r.height * .3]];
        const [lx, ly] = spots[k];
        if (narrow) return; // on a phone the names sit under the map (css)
        el.style.transform = `translate(${lx.toFixed(0)}px, ${ly.toFixed(0)}px)`;
        if (!narrow) { const w = el.offsetWidth, h = el.offsetHeight, ex = lx < ax ? lx + w + 8 : lx - 8, ey = ly + h / 2;
          lines.push(`<path style="--tone:${ACT_TONE[s.act]}" d="M${ex.toFixed(0)} ${ey.toFixed(0)}L${ax.toFixed(0)} ${ay.toFixed(0)}"/><circle style="--tone:${ACT_TONE[s.act]}" cx="${ax.toFixed(0)}" cy="${ay.toFixed(0)}" r="4"/>`); }
      });
      leads.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`); leads.innerHTML = lines.join("");
    };
    const ro = new ResizeObserver(() => requestAnimationFrame(place)); ro.observe(band);
    return () => { ro.disconnect(); m.destroy(); };
  }

  // ── The man ──
  const ROLE = { parent: "parents", "brother or sister": "siblings", wife: "spouse", husband: "spouse", son: "children", daughter: "children" };
  // The family as words joined by fine lines: parents over the children, the spouse beside him, their children below.
  function familyTree(X) {
    const fam = M.family, by = (r) => fam.filter((f) => ROLE[f.role] === r), W = 640, H = 330;
    const parents = by("parents"), sibs = by("siblings"), spouse = by("spouse"), kids = by("children");
    const row = [...sibs, { id: "me", name: M.person.name, role: "" }], pos = {};
    const rowX = (n, i, x0, x1) => (n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1));
    parents.forEach((p, i) => { pos[p.id] = [rowX(parents.length, i, 200, 400), 46]; });
    row.forEach((p, i) => { pos[p.id] = [rowX(row.length, i, 90, 380), 168]; });
    spouse.forEach((p, i) => { pos[p.id] = [540, 168 + i * 50]; });
    kids.forEach((p, i) => { pos[p.id] = [rowX(kids.length, i, 400, 580), 290]; });
    const me = pos.me, lines = [];
    if (parents.length) { const [a, b] = [pos[parents[0].id], pos[parents[parents.length - 1].id]], mx = (a[0] + b[0]) / 2;
      lines.push(`M${a[0] + 46} ${a[1]}H${b[0] - 52}`, `M${mx} ${a[1]}V112`, `M${pos[row[0].id][0]} 112H${me[0]}`, ...row.map((p) => `M${pos[p.id][0]} 112V${pos[p.id][1] - 26}`)); }
    if (spouse.length) { const s = pos[spouse[0].id], mx = (me[0] + s[0]) / 2 + 10;
      lines.push(`M${me[0] + 44} ${me[1] - 6}H${s[0] - 54}`);
      if (kids.length) lines.push(`M${mx} ${me[1] - 6}V236`, `M${pos[kids[0].id][0]} 236H${pos[kids[kids.length - 1].id][0]}`, ...kids.map((k) => `M${pos[k.id][0]} 236V${pos[k.id][1] - 24}`)); }
    const roleWord = (f) => (f.role === "brother or sister" ? (/miriam/.test(f.id) ? "sister" : "brother") : f.role);
    return `<svg class="mx-tree" viewBox="0 0 ${W} ${H}" role="group" aria-label="His family"><path class="mx-tree-l" d="${lines.join("")}"/>
      ${[...parents, ...row, ...spouse, ...kids].map((f) => { const [x, y] = pos[f.id];
        return f.id === "me" ? `<g class="mx-tw is-me"><text x="${x}" y="${y + 6}">${esc(f.name)}</text></g>`
          : `<g class="mx-tw" data-fam="${f.id}" tabindex="0" role="button" aria-label="${esc(f.name)}, his ${esc(roleWord(f))}"><rect x="${x - 56}" y="${y - 24}" width="112" height="44" rx="6"/><text x="${x}" y="${y}">${esc(f.name)}</text><text class="mx-tw-r" x="${x}" y="${y + 15}">${esc(roleWord(f))}</text></g>`; }).join("")}</svg>`;
  }
  const famDetail = (X, id) => {
    const f = M.family.find((x) => x.id === id), c = [...M.companions].find((x) => x.id === id), w = M.prophetsWith.find((x) => x.person.personId === id);
    return `<b class="mx-fd-n">${esc(f.name)}</b>${(X.family[id] ?? []).map((r) => kv(X, r, "is-sm")).join("")}${c ? claim(c.claim) : ""}${w ? claim(w.claim) : ""}${!c && !w ? `<p class="lg-muted">Named as his ${esc(f.role)} in the family list (TIPNR, STEP Bible); Scripture says no more of ${esc(f.name)} beside him than the verse above.</p>` : ""}`;
  };
  function man(X) {
    const ages = [[0, "Born under the decree", [2001022, 2002002]], [40, "Visits his brethren; flees", [44007023, 44007023]], [80, "Before Pharaoh", [2007007, 2007007]], [120, "Dies on Nebo", [5034007, 5034007]]];
    return `<section class="mx mx-man wrap" id="mg-man" data-sec="man" aria-label="The man">
      ${secHead("02", "The man", "His life, <em>and his house</em>", M.person.short)}
      <ol class="mx-ages">${ages.map(([a, t, r]) => `<li><b>${a}</b><span>${esc(t)}</span>${refLink(r)}</li>`).join("")}</ol>
      <div class="mx-man-grid">
        <div class="mx-life"><h4 class="lg-h">${glyph("book", 22, 1.2)}<span>His life, told from Scripture</span></h4><div class="mx-cols">${M.story.map((c) => claim(c)).join("")}</div></div>
        <div class="mx-fam"><h4 class="lg-h">${glyph("users", 22, 1.2)}<span>His family</span><small>Choose a name</small></h4>${familyTree(X)}<div class="mx-fd" aria-live="polite">${famDetail(X, "aaron-exo-4-14")}</div>
          ${kv(X, X.man.sons, "is-sm")}</div>
      </div>
      <div class="mx-says"><h4 class="lg-h">${glyph("quote", 22, 1.2)}<span>How Scripture remembers him</span><small>${M.leader.scriptureSays.length} sayings</small></h4>
        <div class="mx-says-row">${M.leader.scriptureSays.map((c) => claim(c)).join("")}</div></div>
      <div class="mx-man-foot"><div><h4 class="lg-h">${glyph("sparkle", 22, 1.2)}<span>By faith</span><small>Hebrews 11</small></h4>${kv(X, X.man.faith)}</div>
        <div><h4 class="lg-h">${glyph("help", 22, 1.2)}<span>What Scripture does not say of the man</span></h4><ul class="lg-not">${[1, 2].map((i) => `<li>${esc(M.notSaid[i])}</li>`).join("")}</ul></div></div>
    </section>`;
  }

  // ── The word ──
  function word(X) {
    const W = X.word, fl = M.word.fulfilment[4];
    return `<section class="mx mx-word" id="mg-word" data-sec="word" aria-label="The word">
      <div class="wrap">${secHead("03", "The word", "A prophet spoken with <em>mouth to mouth</em>", M.person.prophetTagline)}
        <figure class="mx-mouth"><blockquote><p>“${esc(vtext(X, W.mouth))}”</p></blockquote><figcaption>${refLink(W.mouth)} · KJV · the LORD, to Aaron and Miriam</figcaption></figure>
        <div class="mx-word-cols">
          <div><h4 class="lg-h">${glyph("flame", 22, 1.2)}<span>The call</span><small>${M.word.call.length} tellings</small></h4>${M.word.call.map((s, k) => `<div class="lg-call"><span>${k + 1}</span><div><b>${esc(s.label)}</b><blockquote>“${esc(s.quote.text)}”</blockquote><span class="lg-src">${refLink(s.quote.span)}<span class="lg-kjv">KJV</span></span>${claim(s.claim)}</div></div>`).join("")}</div>
          <div><h4 class="lg-h">${glyph("message", 22, 1.2)}<span>How the word came</span></h4>${M.word.how.map((c) => claim(c)).join("")}</div>
          <div><h4 class="lg-h">${glyph("scroll", 22, 1.2)}<span>The message</span><small>${M.word.message.length} themes</small></h4>${M.word.message.map((m) => claim({ theme: m.theme, ...m.claim, quotes: m.quotes })).join("")}</div>
        </div>
        <div class="mx-like"><h4 class="lg-h">${glyph("arrowRight", 22, 1.2)}<span>“A Prophet … like unto me”</span><small>Deuteronomy 18:15, and how Acts uses it</small></h4>
          <ol class="mx-chain">
            <li><span class="mx-dot"></span><small>Moses says</small>${kv(X, W.like)}</li>
            <li><span class="mx-dot"></span><small>Peter, in the temple</small>${kv(X, W.nt[0])}</li>
            <li><span class="mx-dot"></span><small>Stephen, before the council</small>${kv(X, W.nt[1])}</li>
          </ol>
          <div class="mx-like-foot">${claim(fl.reported)}<a class="mg-link" href="#mg-ask" data-askq="moses-prophet-like-me">${icon("help", 15)}Who is the prophet? Three views, with who holds them</a></div></div>
        <div class="mx-close"><figure class="mx-mouth is-end"><blockquote><p>“${esc(vtext(X, W.none))}”</p></blockquote><figcaption>${refLink(W.none)} · KJV</figcaption></figure>
          <ul class="lg-not">${[4, 6].map((i) => `<li>${esc(M.notSaid[i])}</li>`).join("")}</ul></div>
      </div></section>`;
  }

  // ── The people around him (the shared constellation field, rings by kind of person) ──
  const peopleData = (X) => ({ ...X.people, stagger: .47 /* chosen so no label meets another label or point, at desktop and phone sizes */, nodes: X.people.nodes.map((n) => ({ ...n, mark: n.ring === "speak" ? "solid" : "initial", short: n.label.replace(/ king of Moab| of Heshbon| of Bashan/, "") })) });
  function people(X, data) {
    const counts = data.rings.map((r) => `${data.nodes.filter((n) => n.ring === r.key).length} ${r.label.toLowerCase()}`).join(" · ");
    return `<section class="mx mx-people" id="mg-people" data-sec="people" aria-label="The people around him">
      <div class="wrap">${secHead("04", "The people around him", "Everyone <em>around Moses</em>", `Rings by kind of person: ${counts}. Colour tells when each first stands beside him. Choose anyone; lines show who their own words name.`)}
        <div class="mx-pfilters" role="group" aria-label="Show">${[{ key: "all", label: "Everyone" }, ...data.rings].map((r) => `<button type="button" data-ring="${r.key}" aria-pressed="${r.key === "all"}">${esc(r.label)}</button>`).join("")}</div>
        <div class="mx-pstage"><div class="mx-pfield">${Constellation.field(data, { cls: "cs-people" })}${Constellation.legend(data, { marks: { family: "initial", with: "initial", against: "initial", speak: "solid" } })}</div>
          <aside class="mx-ppanel" aria-live="polite"></aside></div></div></section>`;
  }
  const personPanel = (n, field) => {
    const verses = n.verses.map((v) => (Array.isArray(v) ? { ref: v, text: null } : v));
    const ringName = n.ring === "speak" ? "Who speaks of him" : n.ring === "family" ? "Family" : n.ring === "with" ? "Beside him" : "Against him";
    return `<span class="mg-kick">${esc(ringName)}${n.role.toLowerCase() === ringName.toLowerCase() ? "" : ` · ${esc(n.role)}`}</span><h3>${esc(n.label)}</h3>
      ${n.claims.map((c) => claim(c)).join("")}${n.quote ? quoteSpan(n.quote) : ""}
      ${verses.map((v) => `<blockquote class="mx-v is-sm"><p>${esc(v.text ?? vtextCache(v.ref))}</p><footer>${refLink(v.ref)} · KJV${v.basis ? ` · <span class="lg-muted">${esc(v.basis)}</span>` : ""}</footer></blockquote>`).join("")}
      ${n.ring === "speak" ? `<p class="lg-muted">${n.count} verse${n.count === 1 ? "" : "s"} in all; the long memory lists every one.</p>` : ""}
      ${n.linked.length ? `<p class="mx-rel"><small>Their words name</small>${n.linked.map((m) => `<button type="button" data-pnode="${esc(m.id)}" style="--tone:${m.tone}">${esc(m.label)}</button>`).join("")}</p>` : ""}`;
  };
  let vtextCache = () => "";

  window.MergedSections = {
    atlas, wireAtlas, man, word, people, peopleData,
    famDetail,
    // The people field: choose, links, filters; the bloom plays on the page's clock when the section comes into view.
    wirePeople(root, X, data) {
      vtextCache = (ref) => vtext(X, ref);
      const panel = root.querySelector(".mx-ppanel"), svg = root.querySelector(".cs-svg");
      const core = () => `<span class="mg-kick">The centre</span><h3>Moses</h3><p class="mx-plain">${esc(M.person.leaderTagline)} ${esc(M.person.prophetTagline)}</p>
        ${data.rings.map((r) => `<p class="mx-rel"><small>${esc(r.label)} · ${data.nodes.filter((n) => n.ring === r.key).length}</small>${data.nodes.filter((n) => n.ring === r.key).map((n) => `<button type="button" data-pnode="${esc(n.id)}" style="--tone:${n.tone}">${esc(n.label)}</button>`).join("")}</p>`).join("")}`;
      const field = Constellation.wire(svg, data, { panel, panelHtml: (n) => personPanel(n, field), coreHtml: core, scrollPanel: () => innerWidth < 960 });
      const onClick = (e) => {
        const b = e.target.closest("[data-pnode]"); if (b) { field.select(b.dataset.pnode, true); return; }
        const r = e.target.closest("[data-ring]"); if (r && !r.closest(".cs-svg")) { root.querySelectorAll(".mx-pfilters [data-ring]").forEach((x) => x.setAttribute("aria-pressed", String(x === r))); field.setRing(r.dataset.ring); }
      };
      root.addEventListener("click", onClick);
      field.select("core"); field.fitLabels();
      return { field, destroy() { field.destroy(); root.removeEventListener("click", onClick); } };
    },
  };
})();
