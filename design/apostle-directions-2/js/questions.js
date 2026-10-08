// "What readers still ask", as floating words joined by thin lines (no boxes). The open questions sit around the
// centre with their answers (the views, each with who holds it) floating beside them; what Scripture does not say
// floats faintly at the edge. Choosing a question opens its views below, each with its evidence label and sources.
window.Questions = (() => {
  function mount(host, d) {
    const nodes = [], links = [];
    const add = (n) => { n.i = nodes.length; nodes.push(n); return n; };
    const centre = add({ kind: "centre", text: "What readers still ask", fixed: true });
    d.questions.forEach((q, qi) => {
      const qn = add({ kind: "q", text: q.question.replace(/\s*\((?:Most|In|Older)[^)]*\)\.?$/, ""), q: qi });
      links.push([centre.i, qn.i, "q"]);
      q.views.forEach((v) => { const vn = add({ kind: "v", text: v.label, q: qi }); links.push([qn.i, vn.i, "v"]); });
    });
    const silent = add({ kind: "centre2", text: "What Scripture does not say" });
    links.push([centre.i, silent.i, "s"]);
    d.notSaid.slice(0, 5).forEach((s) => { const n = add({ kind: "n", text: s.replace(/^Scripture (never says|does not say|does not give|does not name)\s*/i, "").replace(/\.$/, "").replace(/^./, (c) => c.toUpperCase()), full: s }); links.push([silent.i, n.i, "n"]); });

    host.innerHTML = `<div class="words" role="group" aria-label="Open questions"><svg class="words-lines" aria-hidden="true"></svg>${nodes.map((n) => `<button type="button" class="word w-${n.kind}" data-i="${n.i}" ${n.kind === "q" ? `aria-pressed="${n.q === 0}"` : ""} ${n.kind === "n" ? `title="${esc(n.full)}"` : ""}>${esc(n.text)}</button>`).join("")}</div>
      <div class="views" aria-live="polite"></div>`;
    const field = host.querySelector(".words"), svgEl = field.querySelector("svg"), els = [...field.querySelectorAll(".word")], panel = host.querySelector(".views");
    let sel = 0, Wd = 0, Hd = 0, raf = 0, visible = false;

    // Columns: the centre on top; each question in its own column with its answers floating beneath it; what
    // Scripture does not say in the last column. On a phone the columns stack. No two words can overlap.
    function place() {
      Wd = field.clientWidth;
      els.forEach((el, i) => { nodes[i].w = el.offsetWidth; nodes[i].h = el.offsetHeight; });
      const qs = nodes.filter((n) => n.kind === "q"), groups = [...qs.map((q) => [q, nodes.filter((n) => n.kind === "v" && n.q === q.q)]), [nodes.find((n) => n.kind === "centre2"), nodes.filter((n) => n.kind === "n")]];
      const cols = Wd < 640 ? 1 : groups.length, cw = Wd / cols;
      centre.x = Wd / 2; centre.y = centre.h / 2 + 6;
      let y0 = centre.y + 70, bottom = 0;
      groups.forEach(([head, kids], k) => {
        const col = cols === 1 ? 0 : k, cx = cw * (col + .5);
        let y = (cols === 1 ? y0 : centre.y + 90) + head.h / 2;
        head.x = cx; head.y = y; y += head.h / 2 + 34;
        kids.forEach((n, j) => { n.x = cx + (cols === 1 ? (j % 2 ? 1 : -1) * Math.min(60, Wd * .12) : (j % 2 ? 1 : -1) * Math.min(46, cw * .12)); n.x = Math.max(n.w / 2 + 4, Math.min(Wd - n.w / 2 - 4, n.x)); n.y = y + n.h / 2; y += n.h + 16; });
        bottom = Math.max(bottom, y); if (cols === 1) y0 = y + 46;
      });
      Hd = bottom + 14; field.style.height = `${Hd}px`;
      nodes.forEach((n, i) => { n.ph = i * 1.7; n.amp = n.kind === "centre" ? 0 : n.kind === "q" ? 3 : 4; });
      frame(performance.now());
    }
    function frame(now) {
      const t = now / 1000, pos = nodes.map((n) => [n.x + Math.sin(t * .35 + n.ph) * n.amp, n.y + Math.cos(t * .28 + n.ph) * n.amp * .7]);
      els.forEach((el, i) => { el.style.transform = `translate(${(pos[i][0] - nodes[i].w / 2).toFixed(1)}px, ${(pos[i][1] - nodes[i].h / 2).toFixed(1)}px)`; });
      svgEl.innerHTML = links.map(([a, b, k]) => { const on = (k === "q" && nodes[b].q === sel) || (k === "v" && nodes[b].q === sel); return `<line class="wl wl-${k} ${on ? "on" : ""}" x1="${pos[a][0].toFixed(1)}" y1="${pos[a][1].toFixed(1)}" x2="${pos[b][0].toFixed(1)}" y2="${pos[b][1].toFixed(1)}"/>`; }).join("");
    }
    function loop(now) { raf = 0; if (!visible || !field.isConnected) return; frame(now); if (!REDUCED) raf = requestAnimationFrame(loop); }
    function show(qi) {
      sel = qi;
      els.forEach((el, i) => { const n = nodes[i]; el.classList.toggle("on", (n.kind === "q" || n.kind === "v") && n.q === qi); if (n.kind === "q") el.setAttribute("aria-pressed", String(n.q === qi)); });
      const q = d.questions[qi];
      panel.innerHTML = `<h3 class="views-q">${esc(q.question)}</h3><ol class="views-list">${q.views.map((v) => `<li><p class="views-label">${esc(v.label)}</p><p class="views-who">${esc(v.holders)}</p><p class="views-arg">${esc(v.argument.text)}</p>${claimFoot(v.argument)}</li>`).join("")}</ol>`;
      frame(performance.now());
    }
    field.addEventListener("click", (e) => { const b = e.target.closest(".word"); if (!b) return; const n = nodes[Number(b.dataset.i)]; if (n.q != null) show(n.q); });
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: "100px" });
    io.observe(field);
    const stop = onResize(field, () => place());
    document.fonts?.ready.then(() => place());
    place(); show(0);
    return () => { io.disconnect(); stop(); cancelAnimationFrame(raf); };
  }
  return { mount };
})();
