// The ten sections of a tribe page (Research/People/TRIBES.md), drawn from data/tribes.json only. Each direction
// arranges them in its own way; the words, verses and evidence labels are the same everywhere.
(() => {
  const ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
  window.ordinal = (n) => ORD[n] ?? `${n}th`;
  window.SECTIONS = [
    { key: "birth", n: 1, title: "Birth", icon: "sparkle", sub: "Mother, order, and the name in the mother's words" },
    { key: "blessings", n: 2, title: "Two blessings", icon: "quote", sub: "Jacob (Genesis 49) and Moses (Deuteronomy 33)" },
    { key: "numbers", n: 3, title: "The numbers", icon: "layers", sub: "The census of Numbers 1 and of Numbers 26" },
    { key: "camp", n: 4, title: "In the camp", icon: "tent", sub: "Side and place, the prince, the day of offering, the spy" },
    { key: "land", n: 5, title: "The land", icon: "map", sub: "Joshua's towns as points, with their confidence" },
    { key: "people", n: 6, title: "People of the tribe", icon: "users", sub: "Those the text ties to it, and our data's count" },
    { key: "story", n: 7, title: "Its story", icon: "scroll", sub: "What the text tells of the tribe as a tribe" },
    { key: "fate", n: 8, title: "What became of it", icon: "hourglass", sub: "The north, the exile, and after" },
    { key: "visions", n: 9, title: "New Testament and visions", icon: "eye", sub: "Ezekiel 48, Revelation 7 and 21, and its people in the New Testament" },
    { key: "tradition", n: 10, title: "Traditions, apart", icon: "library", sub: "Not given by Scripture tribe by tribe; each with who said it and when" },
  ];
  // The largest census figure in the data (either census, any tribe): the shared scale for every bar.
  window.censusMax = () => Math.max(1, ...T.tribes.flatMap((t) => [t.census?.first?.n, t.census?.second?.n]).filter((n) => typeof n === "number"));
  window.who = (p) => (p?.name ? (p.personId ? `<a href="${personHref(p.personId)}">${esc(p.name)}</a>` : esc(p.name)) : "");
  window.cap = (s) => String(s ?? "").replace(/^./, (c) => c.toUpperCase());
  // A list from data.lists by id, and this tribe's place in it (1-based; 0 when absent).
  window.listById = (id) => (T.lists ?? []).find((l) => l.id === id);
  window.placeIn = (list, tid) => (list ? list.order.indexOf(tid) + 1 : 0);

  const S = {};
  // The disputed questions the data sets out as views with holders (data.views), for this tribe and this section.
  const placeOfView = (v) => (/rev7/.test(v.id) ? "visions" : /shiloh/.test(v.id) ? "blessings" : "fate");
  window.viewsFor = (t, where) => (T.views ?? []).filter((v) => (t.views ?? v.tribes ?? []).includes(v.id) || (!t.views && v.tribes?.includes(t.id))).filter((v) => placeOfView(v) === where)
    .map((v) => `<div class="sx-question">${expander(`${v.facts ? item(v.facts) : ""}<div class="sx-views">${v.views.map((w) => `<div class="sx-view"><b>${esc(w.label)}</b><span class="sx-holders">${icon("users", 13)}${esc(w.holders ?? "")}</span>${item(w.argument)}</div>`).join("")}</div>${v.order ? `<p class="sx-note">Views set out ${esc(v.order)}.</p>` : ""}`, { closed: v.question, opened: v.question, cls: "sx-q" })}</div>`).join("");
  S.birth = (t) => {
    const s = t.son;
    if (!s) return pend("son");
    const m = s.mother;
    return `<div class="sx-birth">
      <div class="sx-facts">
        <div><small>Mother</small><b>${m?.name ? who(m) : pend()}</b></div>
        <div><small>${s.order ? "Born" : "Named by"}</small><b>${s.order ? `${esc(cap(ordinal(s.order)))} of Jacob's sons` : esc(s.namedBy ?? "")}</b></div>
        <div><small>Where told</small><b>${refLink(s.birth?.span) || pend()}</b></div>
      </div>
      ${s.nameQuote?.text ? `${quote(s.nameQuote, "q-big")}<p class="sx-said">${esc(s.namedBy ?? m?.name ?? "")}'s words at the naming</p>` : `<p class="sx-pending-line">The words at the naming: ${pend("son.nameQuote")}</p>`}
    </div>`;
  };
  S.blessings = (t) => {
    const b = t.blessings;
    if (!b) return pend("blessings");
    const one = (whom, q, ref) => `<figure class="sx-bless" data-who="${whom}"><figcaption><span>${whom === "jacob" ? "Jacob" : "Moses"}</span><em>${ref}</em></figcaption>
      ${q === null ? `<p class="sx-none">No blessing for ${esc(t.name)}.</p>` : q?.text ? quote(q) : pend()}</figure>`;
    return `<div class="sx-duet">${one("jacob", b.jacob, "Genesis 49")}${one("moses", b.moses, "Deuteronomy 33")}</div>${b.note ? `<p class="sx-note">${icon("help", 14)}${esc(b.note)}</p>` : ""}${viewsFor(t, "blessings")}`;
  };
  S.numbers = (t) => {
    const c = t.census;
    if (!c) return pend("census");
    const a = c.first?.n, b = c.second?.n, max = censusMax();
    const d = typeof c.change?.n === "number" ? c.change.n : null;
    const bar = (label, x, span) => `<div class="sx-bar"><span>${label}</span><i style="--w:${typeof x === "number" ? (x / max) * 100 : 0}%"></i><b>${typeof x === "number" ? fmt(x) : "—"}</b>${refLink(span)}</div>`;
    return `<div class="sx-census">
      ${bar("Numbers 1", a, c.first?.span)}${bar("Numbers 26", b, c.second?.span)}
      ${d !== null ? `<p class="sx-delta"><b class="${d < 0 ? "is-down" : "is-up"}">${signed(d)}</b><span>${esc(c.change.note ?? "Our own arithmetic")}</span>${chip("ours")}</p>` : ""}
      ${c.basis ? `<p class="sx-scale">Who was counted: ${esc(c.basis)}.</p>` : ""}
      ${c.note ? `<p class="sx-note">${esc(c.note)}</p>` : ""}
      <p class="sx-scale">The bars share one scale across all the tribes (the largest count in either census fills a bar).</p>
    </div>`;
  };
  S.camp = (t) => {
    const row = (label, val, span, note) => `<div class="sx-row"><small>${label}</small><b>${val || '<span class="sx-muted">None</span>'}</b>${note ? `<span class="sx-row-note">${esc(note)}</span>` : ""}${refLink(span)}</div>`;
    const c = t.camp;
    return `<div class="sx-rows">
      ${row("Side of the camp", c?.side === "centre" ? "In the midst, around the tabernacle" : c?.side ? `${esc(cap(c.side))} · ${esc(ordinal(c.position))} of three${c.standard ? " · the standard" : ""}` : "", c?.span, c?.note)}
      ${row("Prince", who(t.prince), t.prince?.span, t.prince?.note)}
      ${row("Day of offering", t.offeringDay?.day ? `The ${esc(t.offeringDay.dayWord ?? ordinal(t.offeringDay.day))} day of twelve` : "", t.offeringDay?.span, t.offeringDay?.note)}
      ${row("Spy sent into the land", who(t.spy), t.spy?.span, t.spy?.note)}
      ${t.divider !== undefined ? row("Divider of the land", who(t.divider), t.divider?.span, t.divider?.note) : ""}
    </div>${c?.note ? `<p class="sx-note">${esc(c.note)}</p>` : ""}`;
  };
  const placeChip = (w) => `<a class="sx-chip ${(w.confidence ?? 1) < .5 ? "is-faint" : ""}" ${w.placeId ? `href="${placeHref(w.placeId)}"` : ""} title="${typeof w.confidence === "number" ? `Atlas confidence ${Math.round(w.confidence * 100)}%` : "Not placed by the Atlas"}">${esc(w.name)}${typeof w.confidence === "number" ? `<span class="conf" style="--c:${w.confidence}"></span>` : ""}</a>`;
  S.land = (t) => {
    const L = t.land;
    if (!L) return pend("land");
    const pts = townsOf(t), towns = pts.filter((w) => w.kind !== "border"), border = pts.filter((w) => w.kind === "border");
    const lev = (L.levitical ?? []).map((g) => `<div class="sx-lev"><b>${esc(cap(g.family ?? ""))}</b>${g.count?.n ? `<span>${fmt(g.count.n)} cities${g.sharedWith?.length ? `, with ${g.sharedWith.map(tribeName).join(", ")}` : ""}${g.from?.length ? `, from ${g.from.map(tribeName).join(" and ")}` : ""}</span>` : ""}${refLink(g.span)}
      ${g.cities?.length ? `<p class="sx-chips">${[...new Map(g.cities.map((x) => [x.placeId ?? x.name, x])).values()].map(placeChip).join("")}</p>` : ""}</div>`).join("");
    return `<div class="sx-land">
      <p class="sx-lede">${pts.length ? `<b>${towns.length}</b> towns and <b>${border.length}</b> border points that the Atlas can place` : t.id === "levi" ? "No land of its own: Levi receives cities among the other tribes." : "No towns placed on the map for this tribe."}</p>
      ${has(L.spans) ? `<p class="sx-spans">${L.spans.map((s) => `<a class="sx-span" href="${refHref(s.span)}"><em>${esc(s.kind)}</em>${esc(s.label ?? refText(s.span))}</a>`).join("")}</p>` : ""}
      ${towns.length ? `<div class="sx-sub"><h4>Towns</h4><p class="sx-chips">${towns.slice(0, 24).map(placeChip).join("")}</p>${towns.length > 24 ? expander(`<p class="sx-chips">${towns.slice(24).map(placeChip).join("")}</p>`, { closed: `All ${towns.length} towns`, opened: "Fewer towns" }) : ""}</div>` : ""}
      ${border.length ? `<div class="sx-sub"><h4>Border points</h4><p class="sx-chips">${border.map(placeChip).join("")}</p></div>` : ""}
      ${has(L.refuge) ? `<div class="sx-sub"><h4>City of refuge (Joshua 20)</h4><p class="sx-chips">${L.refuge.map((w) => placeChip(w) + refLink(w.span)).join("")}</p></div>` : ""}
      ${lev ? `<div class="sx-sub"><h4>Levitical cities (Joshua 21)</h4>${lev}</div>` : ""}
      ${L.note ? `<p class="sx-note">${esc(L.note)}</p>` : ""}
    </div>`;
  };
  window.landKey = () => `<p class="sx-key"><span><i class="k-dot"></i>Town, placed by the Atlas</span><span><i class="k-ring"></i>Border point</span><span><i class="k-faint"></i>Atlas confidence under half</span><span><i class="k-dash"></i>Approximate outline, drawn by us around the main cluster of points: not a border</span></p>`;
  S.people = (t, { limit = 0 } = {}) => {
    const p = t.people;
    if (!p) return pend("people");
    const named = p.named ?? [];
    const card = (x) => `<div class="sx-person">${x.personId ? `<a href="${personHref(x.personId)}"><b>${esc(x.name)}</b></a>` : `<b>${esc(x.name)}</b>`}<span>${esc(x.role ?? "")}</span>
      <footer>${x.how === "verse" ? chip("scripture") : chip("data")}${refLink(x.span)}</footer></div>`;
    const shown = limit ? named.slice(0, limit) : named;
    return `<div class="sx-people">
      <p class="sx-count"><b>${typeof p.tagged === "number" ? fmt(p.tagged) : pend()}</b><span>people our data places in the tribe ${chip("data")}<br><small>STEP Bible's tribe tags: a tag is an inference unless a verse says it.</small></span></p>
      ${named.length ? `<div class="sx-people-grid">${shown.map(card).join("")}</div>${limit && named.length > limit ? expander(`<div class="sx-people-grid">${named.slice(limit).map(card).join("")}</div>`, { closed: `${named.length - limit} more named`, opened: "Fewer" }) : ""}` : `<p class="sx-muted sx-gap">Named people: ${pend("people.named")}</p>`}
    </div>`;
  };
  const listOf = (arr, field) => (Array.isArray(arr) ? (arr.length ? arr.map((x) => item(x)).join("") : '<p class="sx-muted">Nothing in the data for this tribe.</p>') : pend(field));
  S.story = (t) => `<div class="sx-list">${listOf(t.story, "story")}</div>`;
  S.fate = (t) => `<div class="sx-list">${listOf(t.fate, "fate")}</div>${viewsFor(t, "fate")}`;
  S.visions = (t) => {
    const e = t.ezekiel, r = t.revelation7, L = (id) => listById(id);
    const cellOf = (id) => L(id)?.cells?.find((c) => c.tribe === t.id)?.span;
    const band = e?.band?.position ? `Band ${e.band.position} of ${e.band.of}${e.band.fromNorth ? ", from the north" : ""}` : placeIn(L("ezek48"), t.id) ? `Band ${placeIn(L("ezek48"), t.id)} of ${L("ezek48").order.length}, from the north` : L("ezek48") ? "No band" : "";
    const gate = e?.gate?.side ? `The ${esc(e.gate.side)} wall, gate ${e.gate.position} of three` : placeIn(L("ezek48-gates"), t.id) ? `Gate ${placeIn(L("ezek48-gates"), t.id)} of ${L("ezek48-gates").order.length}` : L("ezek48-gates") ? "No gate" : "";
    const rev = r?.n ? `${fmt(r.n)} sealed` : placeIn(L("rev7"), t.id) ? "Named" : L("rev7") ? "Not named" : "";
    return `<div class="sx-visions">
      <div class="sx-vcards">
        <div class="sx-vcard"><small>Ezekiel 48 · the land</small><b>${band || pend()}</b>${e?.band?.side ? `<span>${esc(cap(e.band.side))}</span>` : ""}${refLink(e?.band?.span ?? cellOf("ezek48"))}</div>
        <div class="sx-vcard"><small>Ezekiel 48 · the city</small><b>${gate || pend()}</b>${refLink(e?.gate?.span ?? cellOf("ezek48-gates"))}</div>
        <div class="sx-vcard"><small>Revelation 7 · sealed</small><b>${rev || pend()}</b>${r?.position ? `<span>${esc(ordinal(r.position))} in the list${r.asNamed && r.asNamed !== t.name ? `, as “${esc(r.asNamed)}”` : ""}</span>` : !placeIn(L("rev7"), t.id) && L("rev7") ? `<span>${esc(t.name)} is not in the list</span>` : ""}${refLink(r?.span ?? cellOf("rev7"))}</div>
      </div>
      ${e?.note ? `<p class="sx-note">${icon("help", 14)}${esc(e.note)}</p>` : ""}${r?.note ? `<p class="sx-note">${icon("help", 14)}${esc(r.note)}</p>` : ""}
      <div class="sx-list">${listOf(t.nt, "nt")}</div>${viewsFor(t, "visions")}
      ${has(T.ntAll) ? `<div class="sx-sub"><h4>Of all twelve tribes</h4><div class="sx-list">${T.ntAll.map((x) => item(x)).join("")}</div></div>` : ""}
    </div>`;
  };
  S.tradition = (t) => (Array.isArray(t.tradition) && t.tradition.length ? `<div class="sx-trad">${t.tradition.map((x) => `${item({ ...x, layer: x.layer ?? "tradition" }, "is-trad")}`.replace("</div>", `${[["Emblem", x.emblem], ["Colour", x.colour], ["Stone", x.stone]].filter(([, v]) => v).map(([k, v]) => `<span class="sx-tchip"><small>${k}</small>${esc(v)}</span>`).join("")}</div>`)).join("")}</div>
    ${has(T.traditionNotes) ? expander(`<div class="sx-list">${T.traditionNotes.map((x) => item(x)).join("")}</div>`, { closed: "About these traditions", opened: "About these traditions" }) : ""}` : pend("tradition"));
  window.SECTION = (key, t, opts) => S[key](t, opts);

  // A tribe the data does not hold yet.
  window.pendingTribe = (id) => `<div class="pending-card">${icon("hourglass", 22)}<b>${esc(tribeName(id))}</b><p>This tribe's entry in data/tribes.json has not been written yet. The page fills in when it is; nothing here is typed by hand.</p></div>`;
})();
