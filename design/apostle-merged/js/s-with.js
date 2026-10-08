// 03 · Who was with him? Two views in one section, so the page does not grow: "Lines" (his records in story order,
// each companion a line that lights where a verse of that record names them) and "Circle" (everyone around him: he
// is at the centre, with rings of people, places and records; choosing a point draws what joins it to the rest).
window.With = (() => {
  // ── Lines ──
  function lines(host, d, say) {
    const cols = d.scripture;
    const groups = [["The Twelve", d.rows.filter((r) => r.twelve)], ["Others named with him", d.rows.filter((r) => !r.twelve)]].filter(([, rs]) => rs.length);
    host.innerHTML = `<div class="a-chart-scroll"><div class="a-chart"></div></div>
      <p class="a-key"><span><i class="k-dot"></i>named in the passage</span><span><i class="k-line"></i>from first to last mention</span><span>Point at a column to see what happens; choose a name to follow that person.</span></p>`;
    const chart = host.querySelector(".a-chart"), scroller = host.querySelector(".a-chart-scroll");
    let width = 0, hot = -1, row = null;
    function draw() {
      if (!width) return;
      const W = Math.max(width, 720), left = 170, right = 10, top = 46, rowH = 19, gapH = 26;
      const step = (W - left - right) / Math.max(1, cols.length), X = (i) => left + step * (i + .5);
      let y = top + 6;
      const o = [];
      d.periods.slice(0, 3).forEach((p, pi) => {
        const idx = cols.map((e, i) => (e.period === pi + 1 ? i : -1)).filter((i) => i >= 0);
        if (!idx.length) return;
        const x0 = left + step * idx[0], x1 = left + step * (idx.at(-1) + 1);
        o.push(`<rect class="band ${pi % 2 ? "alt" : ""}" x="${x0}" y="${top - 30}" width="${x1 - x0}" height="100%"/><text class="band-t" x="${x0 + 6}" y="${top - 16}" style="fill:${PERIOD_TONE[pi + 1]}">${(x1 - x0) > p.title.length * 7.5 + 40 ? `${p.n} · ${esc(p.title)}` : p.n}</text>`);
      });
      o.push(`<text class="rl me" x="0" y="${y + 4}">${esc(d.short)}</text>`);
      cols.forEach((e, i) => o.push(`<circle class="me-dot" cx="${X(i)}" cy="${y}" r="3.2" style="fill:${PERIOD_TONE[e.period]}"/>`));
      y += rowH + 8;
      for (const [label, rows] of groups) {
        o.push(`<text class="gl" x="0" y="${y + 2}">${esc(label.toUpperCase())}</text>`); y += gapH - 8;
        for (const r of rows) {
          const hits = cols.map((e, i) => (e.with[r.key] ? i : -1)).filter((i) => i >= 0);
          o.push(`<g class="row ${row === r.key ? "on" : ""}" data-row="${r.key}"><rect class="row-hit" x="0" y="${y - rowH / 2}" width="${W}" height="${rowH}"/><text class="rl" x="0" y="${y + 4}">${esc(r.name)}</text>`);
          if (hits.length > 1) o.push(`<line class="span" x1="${X(hits[0])}" x2="${X(hits.at(-1))}" y1="${y}" y2="${y}"/>`);
          hits.forEach((i) => o.push(`<circle class="hitdot" cx="${X(i)}" cy="${y}" r="3.8"/>`));
          o.push(`</g>`); y += rowH;
        }
        y += 8;
      }
      const H = y + 6;
      cols.forEach((e, i) => o.push(`<rect class="colhit" data-col="${i}" x="${left + step * i}" y="${top - 6}" width="${step}" height="${H - top}"/>`));
      chart.innerHTML = `<svg class="a-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g class="hl"></g>${o.join("")}</svg>`;
      chart.dataset.left = left; chart.dataset.step = step;
      highlight(hot);
    }
    function highlight(i) {
      hot = i; const g = chart.querySelector(".hl"); if (!g) return;
      g.innerHTML = i < 0 ? "" : `<rect class="col-on" x="${+chart.dataset.left + +chart.dataset.step * i}" y="10" width="${chart.dataset.step}" height="100%"/>`;
    }
    chart.addEventListener("pointermove", (e) => {
      const c = e.target.closest("[data-col]"); if (!c) return;
      const i = Number(c.dataset.col), en = cols[i];
      if (i !== hot) { highlight(i); say.entry(en); }
      const names = Object.keys(en.with).map((k) => d.rowByKey[k]?.name).filter(Boolean);
      Tip.show(`<b>${esc(en.title)}</b><small>${en.refs[0] ? esc(refText(en.refs[0])) : ""}${names.length ? ` · with ${esc(names.slice(0, 4).join(", "))}${names.length > 4 ? "…" : ""}` : ""}</small>`, e.clientX, e.clientY);
    });
    chart.addEventListener("pointerleave", () => Tip.hide());
    chart.addEventListener("click", (e) => {
      const r = e.target.closest("[data-row]");
      if (r && e.target.closest(".rl")) { row = row === r.dataset.row ? null : r.dataset.row; draw(); if (row) say.person(row); return; }
      const c = e.target.closest("[data-col]"); if (c) { highlight(Number(c.dataset.col)); say.entry(cols[Number(c.dataset.col)]); }
    });
    const stop = onResize(scroller, (w) => { width = w; draw(); });
    width = scroller.clientWidth; draw();
    const first = Math.max(0, cols.findIndex((e) => Object.keys(e.with).length > 2));
    highlight(first); say.entry(cols[first]);
    return stop;
  }

  // ── Circle: everyone around him ──
  const RINGS = [["people", "People", .4], ["places", "Places", .62], ["moments", "Records", .86]];
  function circle(host, d, say) {
    const nodes = [], links = [];
    const add = (n) => { n.i = nodes.length; nodes.push(n); return n; };
    add({ ring: "centre", label: d.short });
    const moments = d.scripture.filter((e) => e.type !== "fact"), mNode = {};
    moments.forEach((e, k) => { mNode[e.key] = add({ ring: "moments", label: e.title, e, k, n: moments.length }); });
    const people = d.rows.slice().sort((a, b) => moments.findIndex((e) => e.with[a.key]) - moments.findIndex((e) => e.with[b.key]));
    people.forEach((r, k) => { const n = add({ ring: "people", label: r.name, r, k, n: people.length }); moments.forEach((e) => { if (e.with[r.key]) links.push([n.i, mNode[e.key].i]); }); links.push([0, n.i]); });
    const places = d.places.filter((p) => p.entries.some((k) => mNode[k]) || p.tradition);
    places.forEach((p, k) => { const n = add({ ring: "places", label: p.name.replace(/\s*\(.*\)$/, ""), p, k, n: places.length }); p.entries.forEach((key) => mNode[key] && links.push([n.i, mNode[key].i])); });
    const S = 760, C = S / 2, R = S / 2 - 24;
    nodes.forEach((n) => {
      if (n.ring === "centre") { n.x = C; n.y = C; return; }
      const r = R * RINGS.find(([k]) => k === n.ring)[2], a = -Math.PI / 2 + (n.k / n.n) * Math.PI * 2 + (n.ring === "people" ? .2 : n.ring === "places" ? .45 : 0);
      n.x = C + Math.cos(a) * r; n.y = C + Math.sin(a) * r; n.a = a;
    });
    host.innerHTML = `<div class="sky"><div class="sky-art"></div></div>`;
    const art = host.querySelector(".sky-art");
    let sel = 0;
    const near = (i) => new Set(links.filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a)));
    function draw() {
      const lit = near(sel), o = [`<g class="rings">${RINGS.map(([k, l, f]) => `<circle cx="${C}" cy="${C}" r="${R * f}"/><text x="${C}" y="${C - R * f - 6}" text-anchor="middle">${l.toUpperCase()}</text>`).join("")}</g>`];
      o.push(`<g class="links">${links.filter(([a, b]) => a === sel || b === sel).map(([a, b]) => { const p = nodes[a], q = nodes[b], mx = (p.x + q.x) / 2 + (C - (p.x + q.x) / 2) * .35, my = (p.y + q.y) / 2 + (C - (p.y + q.y) / 2) * .35; return `<path d="M${p.x.toFixed(1)} ${p.y.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}"/>`; }).join("")}</g>`);
      for (const n of nodes) {
        if (n.ring === "centre") { o.push(`<g class="pt centre ${sel === 0 ? "on" : ""}" data-i="0"><circle cx="${C}" cy="${C}" r="38"/><text x="${C}" y="${C + 5}" text-anchor="middle">${esc(d.short)}</text></g>`); continue; }
        const on = n.i === sel, li = lit.has(n.i), dim = sel && !on && !li, lab = n.ring !== "moments" || on || li;
        const out = Math.cos(n.a) >= 0, txt = n.label.length > 32 ? n.label.slice(0, 30) + "…" : n.label;
        const shape = n.ring === "places" ? `<rect x="${n.x - 4}" y="${n.y - 4}" width="8" height="8" transform="rotate(45 ${n.x} ${n.y})" class="${n.p.tradition ? "trad" : ""}"/>` : `<circle cx="${n.x}" cy="${n.y}" r="${n.ring === "people" ? 5.5 : 4}" style="${n.e ? `--tone:${PERIOD_TONE[n.e.period]}` : ""}"/>`;
        o.push(`<g class="pt ${n.ring} ${on ? "on" : ""} ${li ? "lit" : ""} ${dim ? "dim" : ""}" data-i="${n.i}">${shape}<circle class="hit" cx="${n.x}" cy="${n.y}" r="10"/>${lab ? `<text x="${(n.x + (out ? 9 : -9)).toFixed(1)}" y="${(n.y + 4).toFixed(1)}" text-anchor="${out ? "start" : "end"}">${esc(txt)}</text>` : ""}</g>`);
      }
      art.innerHTML = `<svg viewBox="-150 -10 ${S + 300} ${S + 20}" role="img" aria-label="${esc(d.short)} and everyone around him">${o.join("")}</svg>`;
      const n = nodes[sel];
      if (n.ring === "centre") say.centre(); else if (n.ring === "people") say.person(n.r.key); else if (n.ring === "places") say.place(n.p); else say.entry(n.e);
    }
    art.addEventListener("click", (e) => { const p = e.target.closest("[data-i]"); if (p) { sel = Number(p.dataset.i); draw(); } });
    art.addEventListener("pointermove", (e) => { const p = e.target.closest("[data-i]"); if (!p) { Tip.hide(); return; } const n = nodes[Number(p.dataset.i)]; Tip.show(`<b>${esc(n.label)}</b><small>${esc(RINGS.find(([k]) => k === n.ring)?.[1] ?? "")}</small>`, e.clientX, e.clientY); });
    art.addEventListener("pointerleave", () => Tip.hide());
    draw();
    return () => {};
  }

  function mount(host, d) {
    const sec = document.createElement("section");
    sec.className = "sec"; sec.dataset.sec = "with";
    sec.innerHTML = `${secHead("03", "The people around him", "Who was <em>with him?</em>", `Every record of ${esc(d.short)} in Scripture, in story order${d.key === "paul" ? " (Acts as told, with the Lord's words to him where Acts or his letter sets them)" : " (the Gospels in the order of Robertson's harmony, then Acts and the letters)"}. A person counts as "with him" only where a verse of that record names them both. ${plural(d.rows.length, "person", "people")} in all.`)}
      <div class="with-tools"><div class="seg" role="group" aria-label="View"><button type="button" data-view="lines" aria-pressed="true">Lines</button><button type="button" data-view="circle" aria-pressed="false">Everyone around him</button></div></div>
      <div class="with-body"><div class="with-view"></div><aside class="with-now" aria-live="polite"></aside></div>`;
    host.append(sec);
    const view = sec.querySelector(".with-view"), now = sec.querySelector(".with-now");
    const say = {
      entry(e) {
        const names = Object.entries(e.with ?? {}).map(([k, vs]) => `<li><b>${esc(d.rowByKey[k]?.name ?? k)}</b> ${refLink([vs[0], vs[0]])}</li>`).join("");
        now.style.setProperty("--tone", PERIOD_TONE[e.period]);
        now.innerHTML = `<p class="kicker">${ROMAN[e.period]} · ${esc(d.periods[e.period - 1].title)}</p><h3>${esc(e.title)}</h3>${e.lead ? `<blockquote><p>${markNames(d.verses[e.lead] ?? "", d.names)}</p><footer>${refLink([e.lead, e.lead])} · KJV</footer></blockquote>` : ""}
          ${names ? `<p class="kicker">Named with him here</p><ul class="named">${names}</ul>` : `<p class="plain-line">No companion is named in these verses.</p>`}<button type="button" class="a-read" data-open="${esc(e.key)}">Read it all</button>`;
      },
      person(key) {
        const r = d.rowByKey[key], shared = d.scripture.filter((e) => e.with[key]), comp = d.companions.find((c) => c.person.personId === r.id);
        now.style.setProperty("--tone", "var(--accent)");
        now.innerHTML = `<p class="kicker">Named beside him · ${plural(shared.length, "record")}</p><h3>${esc(r.name)}</h3>${comp ? `<p class="with-text">${esc(comp.claim.text)}</p>${claimFoot(d, comp.claim)}` : ""}
          <ol class="with-list">${shared.map((e) => `<li><button type="button" data-open="${esc(e.key)}"><span>${esc(e.title)}</span><small>${esc(refText([e.with[key][0], e.with[key][0]]))}</small></button></li>`).join("")}</ol><a class="ref" href="${personHref(r.id)}">Open ${esc(r.name)}'s page</a>`;
      },
      place(p) {
        now.style.setProperty("--tone", p.tradition ? "var(--muted)" : "var(--accent)");
        now.innerHTML = `<p class="kicker">${p.tradition ? "Known from tradition" : "A place in his story"}</p><h3>${esc(p.name)}</h3>${p.from ? `<p class="plain-line">${p.from.km.toLocaleString("en-GB")} km ${p.from.dir} of Jerusalem</p>` : ""}${p.note ? `<p class="with-text">${esc(p.note)}</p>` : ""}${claimFoot(d, { layer: p.tradition ? "tradition" : "scripture", refs: p.refs })}`;
      },
      centre() { now.style.setProperty("--tone", "var(--accent)"); now.innerHTML = `<p class="kicker">The centre</p><h3>${esc(d.name)}</h3><p class="with-text">${esc(d.story ?? d.tagline)}</p><p class="plain-line">Choose a person, a place or a record on the circle.</p>`; },
    };
    let stop = lines(view, d, say);
    sec.querySelector(".with-tools").addEventListener("click", (e) => {
      const b = e.target.closest("[data-view]"); if (!b) return;
      sec.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      stop?.(); Tip.hide(); sec.dataset.view = b.dataset.view;
      stop = b.dataset.view === "circle" ? circle(view, d, say) : lines(view, d, say);
    });
    now.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) { const en = d.byKey[b.dataset.open]; Sheet.open(entrySheet(d, en), PERIOD_TONE[en.period]); } });
    return () => stop?.();
  }
  return { mount };
})();
