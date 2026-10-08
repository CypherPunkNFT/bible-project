// The codex under the table: everything on David's reign page, one section at a time. A rail of big icons picks the
// section; the new section slides in (no fade). Sections that live on the table link back to it.
(() => {
  const KIND = { personal: ["Personal", "user"], battle: ["Battle", "swords"], alliance: ["Alliance", "gift"], worship: ["Worship", "ark"], prophecy: ["Prophecy", "scroll"], building: ["Building", "temple"], other: ["Other", "info"] };
  const toTable = (turn, label = "Show on the table") => `<button type="button" class="cx-go" data-go-turn="${turn}">${icon("swords", 15)}${label}</button>`;
  const head = (kicker, title, lead, ico) => `<header class="cx-head"><span class="badge">${icon(ico, 30, 1.5)}</span><div><span class="kicker">${kicker}</span><h2>${title}</h2>${lead ? `<p>${lead}</p>` : ""}</div></header>`;

  const S = {
    story: {
      name: "His story", icon: "book",
      html: () => `${head("Who he was", "His story", esc(DV.person.short), "book")}
        <ol class="cx-story">${DV.story.map((p, i) => `<li><span class="cx-n">${i + 1}</span>${claim(p)}</li>`).join("")}</ol>
        <div class="cx-grid2">
          <div class="cx-card"><h3>${icon("info", 16)}What Scripture does not say</h3><ul class="cx-not">${DV.notSaid.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>
          <div class="cx-card"><h3>${icon("users", 16)}A note on the family data</h3>${DV.identifications.map((c) => claim(c)).join("")}</div>
        </div>`,
    },
    anointings: {
      name: "Three anointings", icon: "oil",
      html: () => {
        const cards = [[0, "Bethlehem", "By Samuel, while Saul still reigned", 0], [1, "Hebron", "By the men of Judah", 4], [2, "Hebron", "By the elders of all Israel", 6]];
        return `${head("Anointed three times", "The three anointings", esc(DV.accession[4].text), "oil")}
          <div class="cx-triptych">${cards.map(([a, where, who, turn], i) => `<article class="cx-anoint"><span class="cx-big">${i + 1}</span><h3>${where}</h3><small>${who}</small>${claim(DV.accession[a])}${toTable(turn)}</article>`).join("")}</div>
          <div class="cx-card cx-wide"><h3>${icon("book", 16)}Chronicles tells one</h3>${claim(DV.accession[3])}</div>`;
      },
    },
    events: {
      name: "Every event", icon: "list",
      html: () => `${head(`${DV.events.length} events`, "Every event of the reign", "In the order of David's reign page. Each one sits on a turn of the war table.", "list")}
        <div class="cx-filter" role="group" aria-label="Show events of one kind"><button type="button" data-kind="all" aria-pressed="true">All</button>${Object.entries(KIND).filter(([k]) => DV.events.some((e) => e.kind === k)).map(([k, [l, ic]]) => `<button type="button" data-kind="${k}" aria-pressed="false">${icon(ic, 16)}${l} <small>${DV.events.filter((e) => e.kind === k).length}</small></button>`).join("")}</div>
        <ol class="cx-events">${DV.events.map((e, i) => `<li data-kind="${e.kind}"><span class="cx-ek">${icon(KIND[e.kind]?.[1] ?? "info", 20)}</span><div><h3><span>${i + 1}</span>${esc(e.label)}${e.year ? `<em>Reign year ${e.year}</em>` : ""}</h3>${claim(e.claim)}</div>${toTable(Game.turnOfEvent(i), `Turn ${Game.turnOfEvent(i) + 1}`)}</li>`).join("")}</ol>`,
    },
    verdict: {
      name: "The verdict", icon: "scale",
      html: () => {
        const v = DV.records[1].verdict;
        const rec = DV.records;
        const row = (label, f) => `<tr><th>${label}</th>${rec.map((r) => `<td>${f(r) ?? "—"}</td>`).join("")}</tr>`;
        return `${head("Kings' own words", "The verdict", "", "scale")}
          <blockquote class="cx-verdict"><span class="cx-tick">${icon("check", 28, 2.2)}<small>Right in the eyes of the LORD</small></span><p>“${esc(v.text)}”</p><footer>${refLink(v.span)} · KJV</footer></blockquote>
          <div class="cx-card"><h3>${icon("quote", 16)}Around the verdict</h3>${DV.verdictNotes.map((c) => claim(c)).join("")}</div>
          <div class="cx-card"><h3>${icon("book", 16)}What each book records</h3><div class="cx-scroll"><table class="cx-rec"><thead><tr><th></th>${rec.map((r) => `<th>${r.book[0].toUpperCase() + r.book.slice(1)}</th>`).join("")}</tr></thead><tbody>
            ${row("Age at accession", (r) => r.age && `${r.age.years} · ${refLink(r.age.span)}`)}
            ${row("Length of reign", (r) => r.length && `${r.length.years} years · ${refLink(r.length.span)}`)}
            ${row("Capital", (r) => r.capital && `${esc(r.capital.name)} · ${refLink(r.capital.span)}`)}
            ${row("Death", (r) => r.death && `${esc(r.death.text)} ${refList(r.death.refs)}`)}
            ${row("Burial", (r) => r.burial && `“${esc(r.burial.text)}” · ${refLink(r.burial.span)}`)}
            ${row("Sources it names", (r) => r.sourcesCited && `“${esc(r.sourcesCited.text)}” · ${refLink(r.sourcesCited.span)}`)}
          </tbody></table></div><p class="cx-reign">${esc(DV.reign.text)} ${refList(DV.reign.refs)}</p></div>`;
      },
    },
    kingdom: {
      name: "Kingdom and places", icon: "castle",
      html: () => {
        const lenses = [["worship", "Worship", "ark"], ["building", "Building", "temple"], ["alliances", "Alliances and tribute", "gift"], ["people", "The people", "users"]];
        const cap = DV.person.capital;
        return `${head("What the nation did", "The kingdom and its places", `House: ${esc(DV.person.house)} · Tribe: ${esc(DV.person.tribe)}`, "castle")}
          <div class="cx-grid2">
            <div class="cx-card cx-cap"><h3>${icon("crown", 16)}Capital: ${esc(cap.name)}</h3><p>${esc(cap.note)}</p><p>${refList(cap.refs)}</p><button type="button" class="cx-go" data-go-places>${icon("pin", 15)}Every place on the table</button></div>
            <div class="cx-card"><div class="cx-lens" role="tablist" aria-label="Explore through">${lenses.map(([id, l, ic], i) => `<button type="button" role="tab" data-lens="${id}" aria-selected="${i === 0}">${icon(ic, 17)}${l}</button>`).join("")}</div>
              <div class="cx-lens-body">${lenses.map(([id], i) => `<div data-lens-body="${id}" ${i ? "hidden" : ""}>${DV.nation[id].map((c) => claim(c)).join("")}</div>`).join("")}</div></div>
          </div>
          <div class="cx-card"><h3>${icon("pin", 16)}${DV.places.length} places named in the reign <small>no borders are drawn; the text names places, not frontiers</small></h3>
            <ul class="cx-places">${DV.places.map((p, i) => `<li><button type="button" data-go-place="${i}"><b>${esc(p.name)}</b><small>${esc(p.note)}</small></button>${refList(p.refs)}</li>`).join("")}</ul></div>`;
      },
    },
    accounts: {
      name: "Samuel–Kings and Chronicles", icon: "split",
      html: () => `${head("Two accounts, never merged", "Samuel and Kings beside Chronicles", "Where the books tell the same thing differently, both are shown as written.", "split")}
        <div class="cx-twohead"><span>Samuel · Kings</span><span>Chronicles</span></div>
        <ol class="cx-two">${DV.twoAccounts.map((a) => `<li><h3>${esc(a.topic)}</h3><div class="two">${claim(a.first, "two-a")}${claim(a.second, "two-b")}</div></li>`).join("")}</ol>`,
    },
    prophets: {
      name: "Nathan, Gad and Samuel", icon: "scroll",
      html: () => {
        const turnFor = { Samuel: 0, Gad: 22, Nathan: 10 };
        return `${head("Prophets of the reign", "Samuel, Gad and Nathan", "", "scroll")}
          <div class="cx-triptych">${DV.prophets.map((p) => `<article class="cx-prophet"><span class="medal">${esc(p.person.name[0])}</span><h3>${esc(p.person.name)}</h3><blockquote><p>“${esc(p.quote.text)}”</p><footer>${refLink(p.quote.span)} · KJV</footer></blockquote>${claim(p.claim)}${toTable(turnFor[p.person.name] ?? 0)}</article>`).join("")}</div>`;
      },
    },
    world: {
      name: "The world stage", icon: "globe",
      html: () => `${head("Powers of the day", "On the world stage", "", "globe")}
        <button type="button" class="cx-go" data-go-powers>${icon("globe", 15)}Raise the powers on the table</button>
        <div class="cx-powers">${DV.worldStage.map((w, i) => `<article class="cx-card"><h3><button type="button" data-go-power="${i}">${icon("flag", 16)}${esc(w.power)}</button></h3>${w.rulers.length ? `<p class="cx-rulers">${w.rulers.map((r) => `<span>${esc(r.name)}</span>`).join("")}</p>` : ""}${claim(w.claim)}${w.rulers.filter((r) => r.note).map((r) => `<p class="cx-small">${esc(r.name)}: ${esc(r.note)}</p>`).join("")}</article>`).join("")}</div>`,
    },
    outside: {
      name: "Outside the Bible", icon: "landmark",
      html: () => `${head("Records outside Scripture", "Outside the Bible", "Kept apart from Scripture, with their dates.", "landmark")}
        <div class="cx-outside">${DV.outside.map((o) => `<article class="cx-out"><h3>${esc(o.name)}</h3><small>${icon("calendar", 13)} ${esc(o.date)}</small>${claim(o.claim)}</article>`).join("")}</div>`,
    },
    dates: {
      name: "Dating views", icon: "calendar",
      html: () => {
        const A = 1060, B = 960, x = (y) => ((A - y) / (A - B)) * 100;
        const rows = DV.dates.map((d) => {
          const bar = d.from && d.to ? `<i class="cx-bar" style="left:${x(d.from)}%;width:${x(d.to) - x(d.from)}%"><b>${d.from}–${d.to} BC</b></i>` : d.to ? `<i class="cx-bar is-open" style="left:${x(d.to) - 6}%;width:6%"><b>died c. ${d.to} BC</b></i>` : `<i class="cx-bar is-rel" style="left:0;width:100%"><b>30 at accession · 7 y 6 m + 33 years · no BC date</b></i>`;
          return `<li><div class="cx-dl"><b>${esc(d.label)}</b><small>${esc(d.note)}</small>${d.cites ? `<span class="refs">${cites(d.cites)}</span>` : ""}</div><div class="cx-axis ${d.from || d.to ? "" : "is-free"}">${bar}</div></li>`;
        }).join("");
        const ticks = [1060, 1040, 1020, 1000, 980, 960].map((y) => `<span style="left:${x(y)}%">${y}</span>`).join("");
        return `${head("Dates differ", "Dating views", "Each scheme is shown with who holds it. This page does not choose between them.", "calendar")}
          <div class="cx-card"><div class="cx-ticks">${ticks}</div><ol class="cx-dates">${rows}</ol><p class="cx-small">Years before Christ, about. Bars run from the start of the reign to David's death.</p></div>`;
      },
    },
    questions: {
      name: "Open questions", icon: "help",
      html: () => `${head(`${DV.questions.length} questions`, "Open questions", "Views as their holders state them; the page takes no side.", "help")}
        <div class="cx-qs">${DV.questions.map((q) => `<article class="cx-card"><h3>${esc(q.question)}</h3><div class="cx-views">${q.views.map((v) => `<div class="view"><b>${esc(v.label)}</b><small>Held by ${esc(v.holders)}</small>${claim(v.argument)}</div>`).join("")}</div></article>`).join("")}</div>`,
    },
    passages: {
      name: "Every passage", icon: "file",
      html: () => {
        const chapters = [];
        for (const [a, b] of DV.passages) { const bk = Math.floor(a / 1e6), c0 = Math.floor((a % 1e6) / 1e3), c1 = Math.floor((b % 1e6) / 1e3); for (let c = c0; c <= c1; c++) chapters.push([bk, c]); }
        const groups = {};
        chapters.forEach(([bk, c]) => (groups[bk] ??= []).push(c));
        return `${head("The record", "Every passage about the reign", DV.passages.map((p) => refText(p)).join(" · "), "file")}
          ${Object.entries(groups).map(([bk, cs]) => `<div class="cx-card"><h3>${icon("book", 16)}${esc(DV.books[bk].name)} <small>${cs.length} chapter${cs.length > 1 ? "s" : ""}</small></h3><div class="cx-chapters">${cs.map((c) => `<a href="/read/kjv/${DV.books[bk].code}/${c}">${c}</a>`).join("")}</div></div>`).join("")}`;
      },
    },
    sources: {
      name: "Sources", icon: "library",
      html: () => `${head("Where this comes from", "Sources", "", "library")}
        <ol class="cx-sources">${DV.citations.map((c) => `<li><b>${esc(c.author)}</b> (${esc(c.year)}). <a href="${esc(c.url)}" target="_blank" rel="noreferrer">${esc(c.title)}</a>. <small>${esc(c.where)}</small></li>`).join("")}</ol>
        <div class="cx-card cx-credit"><p>${esc(DV.credit.people)}</p><p>${esc(DV.credit.map)}</p><p>Scripture: King James Version, from the reader's own text. Line art: drawn for this page.</p></div>`,
    },
  };
  ICON.landmark = '<path d="M7 21V8a5 5 0 0 1 10 0v13M4.5 21h15M10 10.5h4M10 13.5h4M10 16.5h4"/>';

  window.Codex = {};
  Codex.mount = (root) => {
    const ids = Object.keys(S);
    root.innerHTML = `<div class="wrap cx">
      <div class="cx-intro"><span class="kicker">${icon("layers", 15)}The codex</span><h2>Everything on David's reign page</h2><p>The table plays the reign; the codex keeps every section of it, sourced, one at a time.</p></div>
      <div class="cx-body">
        <nav class="cx-rail" aria-label="Codex sections">${ids.map((id, i) => `<button type="button" data-cx="${id}" aria-current="${i === 0}">${icon(S[id].icon, 22)}<span>${S[id].name}</span></button>`).join("")}</nav>
        <div class="cx-panel"></div>
      </div></div>`;
    const panel = root.querySelector(".cx-panel");
    let cur = null;
    function show(id, dir = 1) {
      if (!S[id]) return;
      cur = id;
      root.querySelectorAll("[data-cx]").forEach((b) => b.setAttribute("aria-current", String(b.dataset.cx === id)));
      panel.innerHTML = `<section class="cx-sec" data-sec="${id}">${S[id].html()}</section>`;
      panel.style.setProperty("--dir", dir);
      panel.classList.remove("cx-enter"); void panel.offsetWidth; panel.classList.add("cx-enter");
    }
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cx]");
      if (b) { const next = ids.indexOf(b.dataset.cx), prev = ids.indexOf(cur); show(b.dataset.cx, next >= prev ? 1 : -1); return; }
      const t = e.target.closest("[data-go-turn]");
      if (t) { Game.goTurn(Number(t.dataset.goTurn)); return; }
      if (e.target.closest("[data-go-places]")) { Game.showPlaces(); return; }
      const gp = e.target.closest("[data-go-place]");
      if (gp) { Game.showPlaces(Number(gp.dataset.goPlace)); return; }
      if (e.target.closest("[data-go-powers]")) { Game.showPowers(); return; }
      const gw = e.target.closest("[data-go-power]");
      if (gw) { Game.showPowers(Number(gw.dataset.goPower)); return; }
      const k = e.target.closest("[data-kind]");
      if (k) {
        root.querySelectorAll("[data-kind]").forEach((x) => x.tagName === "BUTTON" && x.setAttribute("aria-pressed", String(x === k)));
        root.querySelectorAll(".cx-events > li").forEach((li) => { li.hidden = k.dataset.kind !== "all" && li.dataset.kind !== k.dataset.kind; });
        return;
      }
      const l = e.target.closest("[data-lens]");
      if (l) {
        root.querySelectorAll("[data-lens]").forEach((x) => x.setAttribute("aria-selected", String(x === l)));
        root.querySelectorAll("[data-lens-body]").forEach((x) => { x.hidden = x.dataset.lensBody !== l.dataset.lens; });
      }
    });
    // Links from the dispatch panel ("see them all") open a section here.
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-codex]");
      if (!a) return;
      e.preventDefault();
      show(a.dataset.codex);
      root.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    });
    show(ids[0]);
  };
})();
