// 06 · What readers still ask: every open question the reviewed sources hold for him, as floating words joined by
// thin lines (no boxes), in four groups: who he was, what happened, how it ended, the writings. What Scripture does
// not say floats among them in italic, marked as such. Choosing a question opens its answers below, each with who
// holds it and the sources. Nothing here is written for the page: every question and answer is reviewed data.
window.Questions = (() => {
  const KIND_TAG = { views: "Views, with who holds them", answer: "An identification this page relies on", ending: "Scripture beside tradition", silent: "Scripture does not say" };
  function panel(d, q) {
    const foot = (c) => claimFoot(d, c);
    let body;
    if (q.kind === "silent") body = `<p class="qv-silent">${esc(q.q)}</p>`;
    else if (q.kind === "answer") body = `<div class="qv-answer"><p>${esc(q.views[0].argument.text)}</p>${foot(q.views[0].argument)}</div>`;
    else if (q.kind === "ending") {
      const sc = q.views.filter((v) => v.label === "Scripture"), tr = q.views.filter((v) => v.label !== "Scripture");
      body = `<div class="qv-ending"><div><p class="kicker">Scripture</p>${sc.map((v) => `<div class="qv-sc"><p>${esc(v.argument.text)}</p>${foot(v.argument)}</div>`).join("")}</div>
        <div><p class="kicker">Tradition, earliest first</p><ol class="qv-ladder">${tr.map((v) => `<li><p class="qv-who">${esc(v.label)}<small>${esc(v.holders)}</small></p><p>${esc(v.argument.text)}</p>${foot(v.argument)}</li>`).join("")}</ol></div></div>`;
    } else body = `<ol class="views-list">${q.views.map((v) => `<li><p class="views-label">${esc(v.label)}</p>${v.holders ? `<p class="views-who">${esc(v.holders)}</p>` : ""}<p class="views-arg">${esc(v.argument.text)}</p>${foot(v.argument)}</li>`).join("")}</ol>`;
    const note = q.full && q.full !== q.q ? q.full.slice(q.q.length).trim() : "";
    return `<p class="kicker">${esc(KIND_TAG[q.kind])} · ${esc(q.from)}</p>${q.kind === "silent" ? "" : `<h3 class="views-q">${esc(q.q)}${note ? ` <small>${esc(note)}</small>` : ""}</h3>`}${body}`;
  }

  function mount(host, d) {
    const Q = d.questions, items = Q.items;
    const sec = document.createElement("section");
    sec.className = "sec"; sec.dataset.sec = "questions";
    const nViews = items.filter((q) => q.kind !== "silent").length, nSilent = items.length - nViews;
    sec.innerHTML = `${secHead("06", "Open questions", "What readers still <em>ask</em>", `${plural(nViews, "question")} the reviewed sources leave open for ${esc(d.short)}, with the answers given and who gives them, and ${plural(nSilent, "thing")} Scripture does not say, in italic. Choose one.`)}
      <div class="words" role="group" aria-label="Open questions"><svg class="words-lines" aria-hidden="true"></svg>
        <span class="word w-centre" data-n="c">What readers still ask</span>
        ${Q.groups.map((g) => `<span class="word w-group ${g.n ? "" : "empty"}" data-g="${g.id}">${esc(g.title)}<small>${g.n ? plural(g.n, "item") : "nothing open in the reviewed data"}</small></span>`).join("")}
        ${items.map((q, i) => `<button type="button" class="word w-q k-${q.kind}" data-q="${i}" aria-pressed="false">${esc(q.kind === "silent" ? q.q.replace(/^Scripture (never says|does not say|does not give|does not name|gives|tells|says nothing of|records)\s*/i, (m) => m) : q.q)}</button>`).join("")}
      </div><div class="views" aria-live="polite"></div>`;
    host.append(sec);
    const field = sec.querySelector(".words"), svgEl = field.querySelector("svg"), panelEl = sec.querySelector(".views");
    const els = [...field.querySelectorAll(".word")];
    const nodes = els.map((el) => ({ el, kind: el.dataset.n === "c" ? "c" : el.dataset.g ? "g" : "q", g: el.dataset.g, q: el.dataset.q != null ? Number(el.dataset.q) : null }));
    nodes.forEach((n, i) => { n.ph = i * 1.37; n.amp = n.kind === "q" ? 2.6 : 0; if (n.kind === "q") n.g = items[n.q].group; });
    let sel = items.findIndex((q) => q.kind !== "silent"), raf = 0, visible = false;

    function place() {
      const W = field.clientWidth, cols = W < 760 ? 1 : 4, cw = W / cols;
      nodes.forEach((n) => { n.w = n.el.offsetWidth; n.h = n.el.offsetHeight; });
      const centre = nodes[0]; centre.x = W / 2; centre.y = centre.h / 2 + 4;
      let y0 = centre.y + 64, bottom = 0;
      Q.groups.forEach((g, k) => {
        const head = nodes.find((n) => n.g === g.id && n.kind === "g"), kids = nodes.filter((n) => n.kind === "q" && n.g === g.id);
        const cx = cols === 1 ? W / 2 : cw * (k + .5);
        let y = (cols === 1 ? y0 : centre.y + 74) + head.h / 2;
        head.x = cx; head.y = y; y += head.h / 2 + 30;
        kids.forEach((n, j) => { const off = (j % 2 ? 1 : -1) * Math.min(28, cw * .07); n.x = Math.max(n.w / 2 + 4, Math.min(W - n.w / 2 - 4, cx + off)); n.y = y + n.h / 2; y += n.h + 14; });
        bottom = Math.max(bottom, y); if (cols === 1) y0 = y + 40;
      });
      field.style.height = `${bottom + 10}px`;
      frame(performance.now());
    }
    function frame(now) {
      const t = now / 1000, pos = nodes.map((n) => [n.x + Math.sin(t * .33 + n.ph) * n.amp, n.y + Math.cos(t * .27 + n.ph) * n.amp * .7]);
      nodes.forEach((n, i) => { n.el.style.transform = `translate(${(pos[i][0] - n.w / 2).toFixed(1)}px, ${(pos[i][1] - n.h / 2).toFixed(1)}px)`; });
      const lines = [];
      nodes.forEach((n, i) => {
        if (n.kind === "g") lines.push(`<line class="wl wl-g" x1="${pos[0][0].toFixed(1)}" y1="${(pos[0][1] + nodes[0].h / 2).toFixed(1)}" x2="${pos[i][0].toFixed(1)}" y2="${(pos[i][1] - n.h / 2).toFixed(1)}"/>`);
        if (n.kind === "q") {
          const hi = nodes.findIndex((m) => m.kind === "g" && m.g === n.g), h = pos[hi], hb = h[1] + nodes[hi].h / 2;
          const [x, y] = pos[i], ty = y - n.h / 2;
          lines.push(`<path class="wl wl-${items[n.q].kind} ${n.q === sel ? "on" : ""}" d="M${h[0].toFixed(1)} ${hb.toFixed(1)}C${h[0].toFixed(1)} ${(hb + (ty - hb) * .6).toFixed(1)} ${x.toFixed(1)} ${(ty - 18).toFixed(1)} ${x.toFixed(1)} ${ty.toFixed(1)}"/>`);
        }
      });
      svgEl.innerHTML = lines.join("");
    }
    function loop(now) { raf = 0; if (!visible || !field.isConnected) return; frame(now); if (!REDUCED) raf = requestAnimationFrame(loop); }
    function show(i) {
      sel = i;
      nodes.forEach((n) => { if (n.kind === "q") { n.el.classList.toggle("on", n.q === i); n.el.setAttribute("aria-pressed", String(n.q === i)); } });
      panelEl.innerHTML = panel(d, items[i]);
      frame(performance.now());
    }
    field.addEventListener("click", (e) => { const b = e.target.closest("[data-q]"); if (b) show(Number(b.dataset.q)); });
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: "100px" });
    io.observe(field);
    const stop = onResize(field, place);
    document.fonts?.ready.then(place);
    place(); show(Math.max(0, sel));
    return () => { io.disconnect(); stop(); cancelAnimationFrame(raf); };
  }
  return { mount };
})();
