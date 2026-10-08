// B · Doors by age: behind one door (a large door, then the constellation of its titles and the site pages they are
// built from), and one item (for Moses, the approved three-forties ring as the header; click an arc for its session).
(() => {
  const { esc, icon, plural } = Frame;
  const B = DIRS.b;
  const polar = (cx, cy, r, deg) => { const a = ((deg - 90) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const arc = (cx, cy, r, a1, a2) => { const [x1, y1] = polar(cx, cy, r, a1), [x2, y2] = polar(cx, cy, r, a2); return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`; };
  const cut = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

  function constellation(items, tone, art) {
    const W = 1000, H = 660, cx = 500, cy = 330, r1 = 140, r2 = 262;
    const srcs = [...new Map(items.flatMap((it) => it.builtFrom.map((b) => [b.path, b]))).values()];
    const ia = new Map(items.map((it, i) => [it.id, (360 / items.length) * i + 360 / items.length / 2]));
    const meanAngle = (path) => { const as = items.filter((it) => it.builtFrom.some((b) => b.path === path)).map((it) => (ia.get(it.id) * Math.PI) / 180);
      return ((Math.atan2(as.reduce((s, a) => s + Math.sin(a), 0), as.reduce((s, a) => s + Math.cos(a), 0)) * 180) / Math.PI + 360) % 360; };
    const sorted = srcs.map((s) => [s, meanAngle(s.path)]).sort((a, b) => a[1] - b[1]);
    const off = sorted.length ? sorted[0][1] - (360 / sorted.length) * 0.3 : 0;
    const sa = new Map(sorted.map(([s], i) => [s.path, off + (360 / sorted.length) * i]));
    const lab = (deg, r, text, cls, size) => { const [x, y] = polar(cx, cy, r, deg), right = ((deg % 360) + 360) % 360 < 180;
      return `<text x="${x.toFixed(1)}" y="${(y + size / 3).toFixed(1)}" text-anchor="${right ? "start" : "end"}" class="${cls}">${esc(text)}</text>`; };
    const links = items.flatMap((it) => it.builtFrom.map((b) => { const [x1, y1] = polar(cx, cy, r1, ia.get(it.id)), [x2, y2] = polar(cx, cy, r2, sa.get(b.path)), [qx, qy] = polar(cx, cy, (r1 + r2) / 2 - 10, (ia.get(it.id) + sa.get(b.path)) / 2);
      return `<path class="lk" data-it="${it.id}" data-src="${b.path}" d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}"/>`; })).join("");
    const its = items.map((it) => { const a = ia.get(it.id), [x, y] = polar(cx, cy, r1, a), right = a < 180;
      const [tx, ty] = polar(cx, cy, r1 + 13, a);
      return `<g class="it ${it.status}" data-it="${it.id}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${it.status === "ready" ? 8 : 6.5}"/><text x="${tx.toFixed(1)}" y="${(ty + 4).toFixed(1)}" text-anchor="${Math.abs(a - 180) < 12 || a < 12 || a > 348 ? "middle" : right ? "start" : "end"}">${esc(cut(it.title, 24))}</text></g>`; }).join("");
    const ss = sorted.map(([s]) => { const a = sa.get(s.path), [x, y] = polar(cx, cy, r2, a); return `<g class="src" data-src="${s.path}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"/>${lab(a, r2 + 10, cut(s.title, 34), "", 11)}</g>`; }).join("");
    return { srcs, svg: `<svg viewBox="0 0 ${W} ${H}" style="--tone: var(${tone})" role="img" aria-label="Titles and the site pages they are built from">
      <circle class="ring" cx="${cx}" cy="${cy}" r="${r1}"/><circle class="ring" cx="${cx}" cy="${cy}" r="${r2}" stroke-dasharray="2 5"/>${links}${its}${ss}
      <circle cx="${cx}" cy="${cy}" r="56" fill="var(--page)" stroke="var(--line)"/>${ART.audience(art).replace("<svg ", `<svg x="${cx - 44}" y="${cy - 34}" width="88" height="64" style="color:var(--tone)" `)}</svg>` };
  }

  function age(wrap, id) {
    const aud = LEARN.A[id], items = LEARN.forAudience(id);
    const { srcs, svg } = constellation(items, aud.tone, aud.art);
    const listHtml = `<h3>${plural(items.length, "title")} behind this door</h3><p>Choose a title (or a page on the outer ring) to draw its links. Every line ends at a page the site has already reviewed.</p>
      <ul>${items.map((it) => `<li><a href="#b/item/${it.id}" data-pick="${it.id}">${esc(it.title)}</a> <span class="muted">· ${LEARN.K[it.kind].name}</span> ${Frame.status(it)}</li>`).join("")}</ul>`;
    wrap.innerHTML = `${Frame.crumbs("Direction B · Doors by age")}
      <section class="dr-age">${B.door(aud, `#b/age/${id}`)}
        <div><p class="kicker rule" style="--tone: var(${aud.tone})">Behind the door</p><h1>${aud.name}<em>${aud.setting ? aud.how.split(",")[0].toLowerCase() : aud.age.replace("–", " to ")}</em></h1>
          <p class="lede" style="margin-top:1rem">${aud.line} ${aud.how}.</p>
          <dl class="figures"><div><dt>Titles</dt><dd>${items.length}</dd></div><div><dt>Ready</dt><dd>${items.filter((i) => i.status === "ready").length}</dd></div><div><dt>Kinds</dt><dd>${new Set(items.map((i) => i.kind)).size}</dd></div><div><dt>Site pages drawn on</dt><dd>${srcs.length}</dd></div></dl></div></section>
      <nav class="dr-others" aria-label="Other doors">${LEARN.AUDIENCES.map((a) => `<a href="#b/age/${a.id}" style="--tone: var(${a.tone})"${a.id === id ? ' aria-current="page"' : ""}>${ART.audience(a.art)}${a.name}</a>`).join("")}</nav>
      <section class="sec"><div class="sec-head"><span class="sec-num">01</span><div><h2>What it is <em>built from</em></h2><p>The titles behind this door on the inner ring; the site's own pages they are written from on the outer ring.</p></div></div>
        <div class="constel" style="--tone: var(${aud.tone})"><div>${svg}</div><div class="constel-side" data-side>${listHtml}</div></div></section>`;
    const box = wrap.querySelector(".constel"), side = wrap.querySelector("[data-side]");
    const clear = () => box.querySelectorAll(".on,.off").forEach((e) => e.classList.remove("on", "off"));
    function pickItem(itemId) {
      const it = LEARN.I[itemId]; clear();
      const paths = new Set(it.builtFrom.map((b) => b.path));
      box.querySelectorAll(".lk").forEach((l) => l.classList.add(l.dataset.it === itemId ? "on" : "off"));
      box.querySelectorAll(".it").forEach((g) => g.classList.add(g.dataset.it === itemId ? "on" : "off"));
      box.querySelectorAll(".src").forEach((g) => g.classList.add(paths.has(g.dataset.src) ? "on" : "off"));
      side.innerHTML = `<p class="kicker">${LEARN.K[it.kind].name} · ${LEARN.T[it.track].name}</p><h3 style="margin-top:.4rem">${esc(it.title)}</h3><p>${esc(it.sub)}. ${Frame.status(it)}</p>
        <ul>${it.builtFrom.map((b) => `<li><a class="textlink" href="${b.path}">${esc(b.title)}</a></li>`).join("")}</ul><p style="margin-top:1rem"><a class="btn" href="#b/item/${it.id}">Open this title ${icon("arrowRight", 14)}</a> <button type="button" class="btn" data-reset style="margin-top:.4rem">All titles</button></p>`;
      side.querySelector("[data-reset]").addEventListener("click", () => { clear(); side.innerHTML = listHtml; wireList(); });
    }
    function pickSrc(path) {
      clear();
      const users = items.filter((it) => it.builtFrom.some((b) => b.path === path)).map((it) => it.id);
      box.querySelectorAll(".lk").forEach((l) => l.classList.add(l.dataset.src === path ? "on" : "off"));
      box.querySelectorAll(".it").forEach((g) => g.classList.add(users.includes(g.dataset.it) ? "on" : "off"));
      box.querySelectorAll(".src").forEach((g) => g.classList.add(g.dataset.src === path ? "on" : "off"));
    }
    const wireList = () => side.querySelectorAll("[data-pick]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); pickItem(a.dataset.pick); }));
    wireList();
    box.querySelectorAll(".it").forEach((g) => g.addEventListener("click", () => pickItem(g.dataset.it)));
    box.querySelectorAll(".src").forEach((g) => g.addEventListener("click", () => pickSrc(g.dataset.src)));
  }

  // The three forties ring (Acts 7:23, 30, 36): parts as the outer line, sessions as arcs; sessions 3–8 share the third forty.
  function ring() {
    const c = 300, r = 214, gap = 1.6, tones = ["--history", "--poetry", "--epistles"];
    const span = (s) => s.n === 1 ? [0, 120] : s.n === 2 ? [120, 240] : [240 + ((s.n - 3) * 120) / 6, 240 + ((s.n - 2) * 120) / 6];
    const arcs = MOSES.sessions.map((s) => { const [a1, a2] = span(s), [nx, ny] = polar(c, c, r, (a1 + a2) / 2);
      return `<path class="arc" data-s="${s.n}" d="${arc(c, c, r, a1 + gap, a2 - gap)}" stroke="var(${tones[s.part - 1]})"/><text class="num" x="${nx.toFixed(1)}" y="${(ny + 4).toFixed(1)}" text-anchor="middle">${s.n}</text>`; }).join("");
    const parts = MOSES.parts.map((p, i) => { const [lx, ly] = polar(c, c, r + 58, i * 120 + 60);
      return `<path class="part" d="${arc(c, c, r + 34, i * 120 + 2, i * 120 + 118)}"/><text class="lbl" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle">${p.place}</text>`; }).join("");
    const years = [0, 40, 80].map((y, i) => { const [x, yy] = polar(c, c, r + 34, i * 120), [x2, y2] = polar(c, c, r - 26, i * 120), [tx, ty] = polar(c, c, r + 50, i * 120 - 7);
      return `<path d="M${x.toFixed(1)} ${yy.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="var(--ink)" stroke-width="1"/><text class="yr" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle">${y === 0 ? "0 · 120" : y}</text>`; }).join("");
    const [wx, wy] = polar(c, c, r + 34, 0);
    return `<svg viewBox="-20 -20 640 640" role="img" aria-label="Moses' life in three forties, with the eight sessions">${parts}${arcs}${years}
      <g class="walker"><circle cx="${wx}" cy="${wy}" r="4.5" fill="var(--accent)"/></g>
      <text class="centre-n" x="${c}" y="${c + 10}" text-anchor="middle">120</text><text class="centre-s" x="${c}" y="${c + 36}" text-anchor="middle">YEARS · DEUTERONOMY 34:7</text>
      <text class="centre-s" x="${c}" y="${c - 52}" text-anchor="middle">ACTS 7:23 · 30 · 36</text></svg>`;
  }
  function sessionPanel(s) {
    const k = (kind) => s.questions.filter((q) => q.kind === kind).length, p = MOSES.parts[s.part - 1];
    return `<div class="dr-sess-top">${ART.moses(s.art)}<div><span class="kicker">Session ${s.n} · ${p.label} · ${p.place}</span><h3>${esc(s.title)}</h3><p class="read">Read ${esc(s.read)} · opens on page ${s.page}</p></div></div>
      <p class="brief">${esc(s.brief)}</p><blockquote>${esc(s.key[0].text)}<small>${esc(s.key[0].ref)} · KJV</small></blockquote>
      <p class="qk"><span><b>${k("observe")}</b>observe</span><span><b>${k("interpret")}</b>interpret</span><span><b>${k("reflect")}</b>reflect</span><span><b>${s.key.length}</b>key verses</span></p>`;
  }

  function item(wrap, id) {
    const it = LEARN.I[id], aud = LEARN.A[it.audience], ready = it.status === "ready";
    if (!ready) {
      wrap.innerHTML = `${Frame.crumbs("Direction B · Doors by age")}<section class="dr-age">${B.door(aud, `#b/age/${aud.id}`)}
        <div><p class="kicker rule">${LEARN.K[it.kind].name} · behind the ${aud.name.toLowerCase()} door</p><h1>${esc(it.title)}</h1><p class="lede" style="margin-top:1rem">${esc(it.sub)}. Planned: it has a door, a subject and its sources, and nothing written yet.</p><div style="margin-top:1.4rem">${Frame.record(it)}</div></div></section>`;
      return;
    }
    const moses = LEARN.inSeries("moses");
    wrap.innerHTML = `${Frame.crumbs("Direction B · Doors by age")}
      <section class="dr-item"><div class="forties">${ring()}</div>
        <div><p class="kicker rule">Workbook · behind the adults' door</p><h1>Moses: <em>three forties</em></h1><p class="lede" style="margin-top:.8rem">${esc(MOSES.summary)}</p>
          ${Frame.downloads(it)}<div class="dr-sess" data-sess>${sessionPanel(MOSES.sessions[0])}</div></div></section>
      <section class="sec"><div class="sec-head"><span class="sec-num">01</span><div><h2>The same story <em>behind every door</em></h2><p>Moses at every age: one reviewed story, told for each reader. Only the adults' workbook is written; the others are planned.</p></div></div>
        <div class="dr-mini">${moses.map((m) => B.door(LEARN.A[m.audience], `#b/item/${m.id}`, `<span class="n">${esc(m.title)}<br>${m.status === "ready" ? "Ready" : "Planned"}</span>`)).join("")}</div></section>
      <section class="sec"><div class="sec-head"><span class="sec-num">02</span><div><h2>The <em>record</em></h2></div></div>${Frame.record(it)}</section>`;
    const panel = wrap.querySelector("[data-sess]");
    const pick = (n) => { wrap.querySelectorAll(".arc").forEach((a) => a.classList.toggle("on", Number(a.dataset.s) === n)); panel.innerHTML = sessionPanel(MOSES.sessions[n - 1]); };
    wrap.querySelectorAll(".arc").forEach((a) => a.addEventListener("click", () => pick(Number(a.dataset.s))));
    pick(1);
  }

  Object.assign(DIRS.b, { age, item });
})();
