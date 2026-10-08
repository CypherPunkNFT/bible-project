// The reign: the 34 events gathered into large cards, as the Atlas's Ancient Cities gathers its cities. A card opens in
// place (the grid gives way and the card wipes down): its events as a rich sequence, each with the KJV words of its key
// verse, its claim and evidence, the Chronicles telling beside it where the two differ, the prophet, the world stage,
// outside records and open questions that belong to it; and the land as the card's bottom half, showing its places.
(() => {
  const CAT_TONE = { crown: "anointing", wars: "battle", city: "building", worship: "worship", word: "word", sin: "sin", sword: "family" };
  const kindOf = (id) => DV.kinds.find((k) => k.id === id);
  const DATA_KIND = { personal: "personal", battle: "battle", alliance: "alliance", worship: "worship", prophecy: "prophecy", building: "building", other: "other" };
  const S = { open: null, map: null, root: null };

  function cardHtml(c) {
    const kinds = [...new Set(c.events.map((i) => DV.moments[i].kind))];
    return `<button type="button" class="rg-card" data-cat="${c.id}" style="--c: var(--k-${CAT_TONE[c.id]})">
      <span class="rg-ico">${icon(c.icon, 40, 1.25)}</span>
      <span class="rg-txt"><strong>${esc(c.title)}</strong><small>${esc(c.lead)}</small></span>
      <span class="rg-foot"><b>${c.events.length} event${c.events.length > 1 ? "s" : ""}</b><span class="rg-gems">${kinds.map((k) => `<i style="--c: var(--k-${k})" title="${esc(kindOf(k).label)}">${Crystals.svg(k, 18)}</i>`).join("")}</span>${icon("arrowUpRight", 16)}</span></button>`;
  }
  const allCard = () => `<button type="button" class="rg-card rg-all" data-cat="all" style="--c: var(--accent)">
      <span class="rg-ico">${icon("rows", 40, 1.25)}</span>
      <span class="rg-txt"><strong>Every event, in order</strong><small>All ${DV.moments.length} as the ruler page tells them, from Hebron to his death; each opens in its card.</small></span>
      <span class="rg-foot"><b>${DV.moments.length} events</b><span></span>${icon("arrowUpRight", 16)}</span></button>`;

  // ── One event, drawn as a passage of the card ──
  function eventHtml(e) {
    const k = kindOf(e.kind), place = e.placeId ? DV.atlas[e.placeId] : null;
    const two = e.two.map((i) => { const a = DV.twoAccounts[i]; return `<div class="ev-two"><p class="ev-sub">${icon("split", 14)}Told differently · ${esc(a.topic)}</p><div class="ribbon"><div class="rb-a"><span>${a.first.text.startsWith("1 Kings") ? "1 Kings" : "Samuel"}</span>${claim(a.first)}</div><div class="rb-b"><span>Chronicles</span>${claim(a.second)}</div></div></div>`; }).join("");
    const pr = e.prophet !== null ? (() => { const p = DV.prophets[e.prophet]; return `<div class="ev-prophet"><span class="medal">${esc(p.person.name[0])}</span><div><p class="ev-sub">The prophet · ${esc(p.person.name)}</p><blockquote>“${esc(p.quote.text)}”<footer>${refLink(p.quote.span)}</footer></blockquote></div></div>`; })() : "";
    const pw = e.power !== null ? (() => { const w = DV.worldStage[e.power]; return `<div class="ev-aside"><p class="ev-sub">${icon("globe", 14)}On the world stage · ${esc(w.power)}${w.rulers.length ? ` · ${w.rulers.map((r) => esc(r.name)).join(", ")}` : ""}</p>${claim(w.claim)}</div>`; })() : "";
    const out = e.outside !== null ? (() => { const o = DV.outside[e.outside]; return `<div class="ev-outside"><p class="ev-sub">${icon("landmark", 14)}Outside the Bible · ${esc(o.name)} · ${esc(o.date)}</p>${claim(o.claim)}</div>`; })() : "";
    const q = e.question ? (() => { const x = DV.questionById[e.question]; return `<div class="ev-q"><p class="ev-sub">${icon("help", 14)}An open question</p><p class="ev-qq">${esc(x.question)}</p><ul>${x.views.map((v) => `<li><b>${esc(v.label)}</b><small>${esc(v.holders)}</small></li>`).join("")}</ul><a class="ev-more" href="#codex" data-codex="questions">The views in full, in the codex</a></div>`; })() : "";
    return `<article class="ev" id="ev-${e.i}" data-ev="${e.i}" style="--c: var(--k-${e.kind})">
      <header class="ev-head"><span class="ev-n">${String(e.i + 1).padStart(2, "0")}</span><div>
        <p class="ev-k"><span class="ev-gem">${Crystals.svg(e.kind, 18)}</span>${esc(k.label)}<span>·</span>${e.year ? `Reign year ${e.year}` : "Year not given"}${place ? `<span>·</span><button type="button" class="ev-place" data-map-ev="${e.i}">${icon("pin", 13)}${esc(place.name)}</button>` : ""}</p>
        <h3>${esc(e.label)}</h3></div></header>
      ${e.verse ? `<blockquote class="ev-kjv"><p>${esc(DV.verses[e.verse])}</p><footer><span>${esc(refText(e.verse))} · KJV</span><a class="read" href="${refHref(e.verse)}">${icon("open", 13)}Read the passage</a></footer></blockquote>` : ""}
      ${claim(e.claim)}
      <p class="ev-datakind">The ruler page files it as “${esc(DATA_KIND[e.dataKind] ?? e.dataKind)}”.</p>
      ${two}${pr}${pw}${out}${q}
    </article>`;
  }

  function aroundHtml(c) {
    const items = [...c.nation.map((x) => claim(x)), ...c.verdict.map((i) => claim(DV.verdictNotes[i])), ...(c.notSaid ?? []).map((i) => `<p class="ev-not">${icon("info", 14)}${esc(DV.notSaid[i])}</p>`)];
    if (c.reign) items.unshift(claim({ text: DV.reign.text, layer: "scripture", refs: DV.reign.refs }), claim({ ...DV.records[1].death, src: "His death, as Kings tells it" }), claim({ ...DV.records[2].death, src: "His death, as Chronicles tells it" }));
    if (c.capital) items.unshift(`<div class="claim"><p><b>Capital: ${esc(DV.person.capital.name)}.</b> ${esc(DV.person.capital.note)}</p><footer>${chip("scripture")}<span class="refs">${refList(DV.person.capital.refs)}</span></footer></div>`);
    return items.length ? `<section class="rg-around"><h4>Around these events</h4><div class="rg-around-in">${items.join("")}</div></section>` : "";
  }

  function openHtml(c) {
    const quote = c.quoteVerse ? `<blockquote class="rg-quote"><p>“${esc(DV.verses[c.quoteVerse])}”</p><footer>${refLink(c.quoteVerse)} · KJV</footer></blockquote>` : "";
    return `<article class="rg-open" style="--c: var(--k-${CAT_TONE[c.id]})">
      <div class="rg-open-in">
        <nav class="rg-nav"><button type="button" class="rg-back" data-cat-close>${icon("arrowLeft", 15)}All of the reign</button><span>/</span><span>${esc(c.title)}</span></nav>
        <header class="rg-head"><span class="rg-ico">${icon(c.icon, 46, 1.2)}</span><div><h3>${esc(c.title)}</h3><p>${esc(c.lead)}</p></div></header>
        ${quote}
        <div class="rg-events">${c.events.map((i) => eventHtml(DV.moments[i])).join("")}</div>
        ${aroundHtml(c)}
      </div>
      <section class="rg-map" aria-label="${esc(c.title)} on the land"><header><h4>${icon("map", 15)}${esc(c.title)} on the land</h4><p class="ld-legend">${matchMedia("(pointer: coarse)").matches ? "Drag to move · Pinch to zoom · Twist to turn" : "Scroll to zoom · Drag to move · Right-drag to turn"}</p></header><div class="rg-table"></div></section>
    </article>`;
  }
  function allHtml() {
    return `<article class="rg-open" style="--c: var(--accent)"><div class="rg-open-in">
      <nav class="rg-nav"><button type="button" class="rg-back" data-cat-close>${icon("arrowLeft", 15)}All of the reign</button><span>/</span><span>Every event, in order</span></nav>
      <header class="rg-head"><span class="rg-ico">${icon("rows", 46, 1.2)}</span><div><h3>Every event, in order</h3><p>As the ruler page tells them. Scripture dates only three: his first year at Hebron, the move to all Israel after seven and a half years, and his death in the fortieth.</p></div></header>
      <ol class="rg-order">${DV.moments.map((e) => { const c = DV.cats.find((x) => x.id === e.cat); return `<li style="--c: var(--k-${e.kind})"><button type="button" data-cat="${c.id}" data-at="${e.i}"><span class="ev-n">${String(e.i + 1).padStart(2, "0")}</span><span class="ev-gem">${Crystals.svg(e.kind, 18)}</span><b>${esc(e.label)}</b><small>${esc(c.title)} · ${esc(refText(e.claim.refs[0]))}</small></button></li>`; }).join("")}</ol>
    </div></article>`;
  }

  // ── The card's land: its events as crystals at their places ──
  function mountMap(c, host) {
    const t = LandTable(host, { compact: true });
    const xyOf = (id) => DV.atlas[id]?.xy;
    const evs = c.events.map((i) => DV.moments[i]).filter((e) => e.placeId);
    const crystals = evs.map((e, i) => ({ key: `ev-${e.i}`, label: e.label, kind: e.kind, x: xyOf(e.placeId)[0], y: xyOf(e.placeId)[1], rise: 1, active: true, seed: i * 2.3 }));
    const ids = [...new Set(evs.map((e) => e.placeId))];
    const pins = ids.map((id) => ({ key: id, x: xyOf(id)[0], y: xyOf(id)[1], state: "all", role: "place", label: esc(DV.atlas[id].name) }));
    const region = () => { const r = host.getBoundingClientRect(); return { x: 20, y: 30, w: r.width - 40, h: r.height - 50 }; };
    const pts = ids.map(xyOf);
    let focus = t.viewFor(pts, region(), { yaw: -8 * Math.PI / 180, pitch: 48 * Math.PI / 180, minSpan: 160 });
    t.setCam(focus);
    t.setScene({ crystals, pins, peakLabels: true });
    t.onResize = () => { focus = t.viewFor(pts, region(), { minSpan: 160 }); t.setCam(focus); };
    t.onRecentre = () => t.controls.glideTo(focus);
    t.onCrystal = (key) => select(key);
    function select(key) {
      crystals.forEach((x) => { x.selected = x.key === key; });
      const e = DV.moments[Number(key.slice(3))];
      t.controls.glideTo(t.viewFor([xyOf(e.placeId)], region(), { minSpan: 70 }));
      t.setScene({ crystals, pins, peakLabels: true });
      S.root.querySelectorAll(".ev").forEach((el) => el.classList.toggle("is-on", el.id === key));
    }
    return { t, select };
  }

  function open(id, at = null) {
    const stage = S.root.querySelector(".rg-stage"), grid = stage.querySelector(".rg-grid"), slot = stage.querySelector(".rg-slot");
    S.map?.t.destroy(); S.map = null;
    const c = id === "all" ? null : DV.cats.find((x) => x.id === id);
    const h0 = stage.offsetHeight;
    slot.innerHTML = c ? openHtml(c) : allHtml();
    grid.hidden = true; slot.hidden = false;
    S.open = id;
    if (c) S.map = mountMap(c, slot.querySelector(".rg-table"));
    const h1 = stage.offsetHeight;
    if (!reduced()) {
      stage.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: 520, easing: "cubic-bezier(.65,0,.35,1)" });
      slot.animate([{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }], { duration: 520, easing: "cubic-bezier(.65,0,.35,1)" });
    }
    const target = at !== null && c ? slot.querySelector(`#ev-${at}`) : S.root;
    requestAnimationFrame(() => target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: at !== null && c ? "center" : "start" }));
    if (at !== null && c) target.classList.add("is-on");
  }
  function close() {
    const stage = S.root.querySelector(".rg-stage"), grid = stage.querySelector(".rg-grid"), slot = stage.querySelector(".rg-slot");
    const was = S.open;
    S.map?.t.destroy(); S.map = null; S.open = null;
    slot.hidden = true; slot.innerHTML = ""; grid.hidden = false;
    const btn = grid.querySelector(`[data-cat="${was}"]`);
    S.root.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    btn?.focus({ preventScroll: true });
  }

  window.Reign = {
    mount(root) {
      S.root = root;
      root.innerHTML = `${sectionHead("02", `${icon("swords", 14)}${DV.moments.length} events of the reign`, "The reign", "Seven parts of one reign, each a card. Open one to read its events in full, with the land beneath them.", "reign-h")}
        <div class="rg-stage"><div class="rg-grid">${DV.cats.map(cardHtml).join("")}${allCard()}</div><div class="rg-slot" hidden></div></div>`;
      root.addEventListener("click", (e) => {
        if (e.target.closest("[data-cat-close]")) { close(); return; }
        const card = e.target.closest("[data-cat]");
        if (card) { open(card.dataset.cat, card.dataset.at !== undefined ? Number(card.dataset.at) : null); return; }
        const m = e.target.closest("[data-map-ev]");
        if (m && S.map) { S.map.select(`ev-${m.dataset.mapEv}`); m.closest(".rg-open").querySelector(".rg-map").scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" }); }
      });
    },
    open: (id, at = null) => open(id, Number.isFinite(at) ? at : null),
  };
})();
