// The kingdom (capital, the places named, what the nation did), the world stage and outside records, the dates (each
// scheme a string on one scale), the open questions, what Scripture does not say, every passage and the sources.
(() => {
  const LENSES = [["worship", "Worship", "lyre"], ["building", "Building", "temple"], ["alliances", "Alliances & tribute", "handshake"], ["people", "The people", "users"]];

  function kingdom() {
    const capitals = new Set(["Hebron", "Jerusalem"]);
    const names = D.places.map((p, i) => `<button type="button" class="pl${capitals.has(p.name) ? " is-capital" : ""}" data-i="${i}" aria-pressed="${i === 4}">${esc(p.name)}</button>`).join('<span class="pl-sep" aria-hidden="true">/</span>');
    return `<section class="sec" id="kingdom"><div class="wrap">
      ${secHead("kingdom", "The kingdom", "Twenty-five places, <em>named by the text</em>", "No borders are drawn: this page has no sourced outline for them. These are the places the record names in his life and reign, with the capital first among them.", "pin")}
      <div class="cap glass"><div class="cap-ico">${icon("crown", 34, 1.4)}</div><div><small>Capital</small><b>${esc(D.about.capital.name)}</b><p>${esc(D.about.capital.note)}</p><span class="refs">${refList(D.about.capital.refs, true)}</span></div></div>
      <div class="places" id="places">${names}</div>
      <div class="pl-detail" id="pl-detail" aria-live="polite"></div>
      <h3 class="sub-h">What the nation did</h3>
      <div class="lens"><div class="lens-bar" role="tablist">${LENSES.map(([k, l, ic], i) => `<button type="button" role="tab" data-lens="${k}" aria-selected="${i === 0}">${icon(ic, 18)}${l}<em>${D.nation[k].length}</em></button>`).join("")}</div>
        <div class="lens-panel" id="lens-panel"></div></div>
    </div></section>`;
  }
  const placeDetail = (i) => {
    const p = D.places[i];
    return `<div class="pl-card"><b>${esc(p.name)}</b>${p.type ? `<em>${esc(p.type)}</em>` : ""}<span>${esc(p.note)}</span><span class="refs">${refList(p.refs, true)}</span><a class="read" href="/study/atlas?place=${p.placeId}">${icon("map", 14)}Open in the Atlas</a></div>`;
  };

  function world() {
    const rows = D.worldStage.map((w) => `<div class="ws"><div class="ws-l"><b>${esc(w.power)}</b>${w.rulers.length ? `<span>${w.rulers.map((r) => `<a class="who" href="/people/${r.personId}" title="${esc(r.note ?? "")}">${esc(r.name)}</a>`).join("")}</span>` : ""}</div>${claim(w.claim)}</div>`).join("");
    const out = D.outside.map((o) => `<div class="out"><small>${esc(o.date)}</small><b>${esc(o.name)}</b>${claim(o.claim)}</div>`).join("");
    return `<section class="sec" id="world"><div class="wrap">
      ${secHead("world", "On the world stage", "The nations around him, <em>and what stands outside the Bible</em>", "The peoples around him that the record names, each with its rulers. Records from outside Scripture are kept apart, with their dates.", "globe")}
      <div class="wss">${rows}</div>
      <h3 class="sub-h">Outside the Bible</h3>
      <div class="outs">${out}</div>
    </div></section>`;
  }

  function dates() {
    const MIN = 1065, MAX = 955, x = (bc) => ((MIN - bc) / (MIN - MAX)) * 100;
    const ticks = [1060, 1040, 1020, 1000, 980, 960].map((t) => `<span style="left:${x(t)}%">${t}</span>`).join("");
    const rows = D.dates.filter((d) => d.system !== "bible").map((d, i) => {
      const from = d.from ?? null, to = d.to;
      return `<div class="dt" data-i="${i}"><div class="dt-l"><b>${esc(d.label)}</b><small>${from ? `${from}–` : "… – "}${to} BC</small></div>
        <div class="dt-track"><i class="dt-a${from ? "" : " is-open"}" style="left:${from ? x(from) : 0}%"></i><i class="dt-b" style="left:${x(to)}%"></i></div>
        <p class="dt-note">${esc(d.note)} ${d.cites ? cites(d.cites) : ""}</p></div>`;
    }).join("");
    const bible = D.dates.find((d) => d.system === "bible");
    return `<section class="sec" id="dates"><div class="wrap">
      ${secHead("dates", "Dating the reign", "Scripture counts the years. <em>Scholars place them.</em>", "Each scheme is a string on one scale of years before Christ. The page does not choose between them.", "calendar")}
      <div class="dt-bible glass"><small>${esc(bible.label)}</small><div class="dt-bars"><span style="flex:7.5"><b>7 y 6 m</b>Hebron</span><span style="flex:33"><b>33 years</b>Jerusalem</span></div><p>${esc(bible.note)}</p></div>
      <div class="dts" id="dts"><div class="dt-axis">${ticks}</div>${rows}</div>
    </div></section>`;
  }

  function questions() {
    const qs = D.questions.map((q) => `<div class="q"><h4>${icon("help", 22)}${esc(q.question)}</h4><div class="q-views">${q.views.map((v, i) => `<div class="qv"><span class="qv-n">${i + 1}</span><b>${esc(v.label)}</b><small>${esc(v.holders)}</small>${claim(v.argument)}</div>`).join("")}</div></div>`).join("");
    const not = D.notSaid.map((n) => `<li>${esc(n)}</li>`).join("");
    return `<section class="sec" id="questions"><div class="wrap">
      ${secHead("questions", "Open questions", "Where readers disagree, <em>each view keeps its holders</em>", "", "help")}
      <div class="qs">${qs}</div>
      <div class="ns-grid"><div class="ns glass"><h3 class="sub-h">What Scripture does not say</h3><ul>${not}</ul></div>
        <div class="ns glass"><h3 class="sub-h">A note on his family record</h3>${D.about.identifications.map((c) => claim(c)).join("")}</div></div>
    </div></section>`;
  }

  function sources() {
    const cit = D.citations.map((c) => `<li><b>${esc(c.author)}</b>, <i>${esc(c.title)}</i> (${esc(c.year)})${c.where ? `, ${esc(c.where)}` : ""}. <a href="${esc(c.url)}" target="_blank" rel="noreferrer">Open ↗</a></li>`).join("");
    const a = D.about;
    return `<section class="sec" id="sources"><div class="wrap">
      ${secHead("sources", "Every passage, every source", "Where all of this comes from", "", "library")}
      <div class="src-grid"><div><h3 class="sub-h">The passages of the reign</h3><div class="passages">${D.passages.map((p) => `<a class="pass" href="${refHref(p)}">${icon("open", 16)}${esc(refText(p))}</a>`).join("")}</div>
          <h3 class="sub-h">His twelve psalms</h3><div class="passages">${[...D.psalms].sort((x, y) => x.n - y.n).map((p) => `<a class="pass pass-voc" href="/read/kjv/PSA/${p.n}">${icon("lyre", 16)}Psalm ${p.n}</a>`).join("")}</div>
          <p class="src-count">The person record links <b>${a.refCount}</b> verses that name him. <a href="/people/${a.id}">See them on The person ↗</a></p></div>
        <div><h3 class="sub-h">Sources cited</h3><ol class="cites-list">${cit}</ol>
          <p class="credit">Data from the site's reviewed files: ${D.sources.map(esc).join(" · ")}. Scripture quotations are from the King James Version, the psalm titles included. Line art and strings are drawn for this page; no stock images.</p></div></div>
      <nav class="succ" aria-label="Before and after"><a href="/people/${a.predecessor.id}/rule">${icon("arrowLeft", 18)}<span><small>Before him</small>${esc(a.predecessor.name)}</span></a><span class="succ-mid">${icon("crown", 20)}The united kingdom: 3rd of its rulers</span><a href="/people/${a.successor.id}/rule"><span><small>After him</small>${esc(a.successor.name)}</span>${icon("arrowRight", 18)}</a></nav>
    </div></section>`;
  }

  function showLens(k) {
    const panel = document.getElementById("lens-panel");
    panel.innerHTML = `<div class="lens-in">${D.nation[k].map((c) => claim(c)).join("")}</div>`;
    panel.classList.remove("is-wipe"); void panel.offsetWidth; panel.classList.add("is-wipe");
  }
  function mount() {
    const det = document.getElementById("pl-detail");
    det.innerHTML = placeDetail(4);
    document.getElementById("places").addEventListener("click", (e) => {
      const b = e.target.closest(".pl");
      if (!b) return;
      document.querySelectorAll(".pl").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      det.innerHTML = placeDetail(Number(b.dataset.i));
      det.classList.remove("is-wipe"); void det.offsetWidth; det.classList.add("is-wipe");
    });
    showLens("worship");
    document.querySelector(".lens-bar").addEventListener("click", (e) => {
      const b = e.target.closest("[data-lens]");
      if (!b) return;
      document.querySelectorAll(".lens-bar button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      showLens(b.dataset.lens);
    });
    const dts = new Strings.Layer(document.getElementById("dts"), "dt-strings");
    document.querySelectorAll("#dts .dt").forEach((row) => {
      const i = Number(row.dataset.i), d = D.dates.filter((x) => x.system !== "bible")[i];
      dts.add(row.querySelector(".dt-a"), row.querySelector(".dt-b"), { id: `dt-${i}`, orient: "h", label: d.label, cls: d.from ? "dt-s" : "dt-s open", freq: 5 + i, amp: 8 });
    });
    hoverPluck(document.getElementById("dts"), ".dt", "dt", (i) => `Dating: ${D.dates.filter((x) => x.system !== "bible")[i].label}`);
  }
  window.SecB = { kingdom, world, dates, questions, sources, mount };
})();
