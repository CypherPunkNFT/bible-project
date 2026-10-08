// H · "What readers still ask": the open questions as words floating on the page, joined by fine lines to the heading
// and to their neighbours (no boxes). Choosing one opens its views in place underneath, quietly.
(() => {
  window.MergedAsk = {
    html(titles) {
      return `<section class="mg-ask" style="--tone:var(--prophets)" aria-label="What readers still ask">
        <div class="mg-ask-field" data-askfield>
          <svg class="mg-ask-lines" aria-hidden="true"></svg>
          <div class="mg-ask-hub" data-hub><span class="mg-kick">Open questions · ${M.questions.length}</span><h2>What readers still ask</h2><small>Choose one. Each view names who holds it.</small></div>
          ${M.questions.map((q, i) => `<button type="button" class="mg-word" data-q="${q.id}" style="--i:${i}" aria-expanded="false"><b>${esc(titles[q.id])}</b><small>${q.views.length} views</small></button>`).join("")}
        </div>
        <div class="mg-views" data-views><div class="mg-views-in"></div></div>
      </section>`;
    },
    wire(root) {
      const field = root.querySelector("[data-askfield]"), svg = field.querySelector(".mg-ask-lines"), hub = field.querySelector("[data-hub]");
      const words = [...field.querySelectorAll(".mg-word")], views = root.querySelector("[data-views]"), inner = views.querySelector(".mg-views-in");
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      let pos = [], hubAt = [0, 0], W = 0, H = 0, raf = 0, chosen = null;
      // Places: an open ring around the heading on wide screens; a zigzag under it on a phone.
      const place = () => {
        W = field.clientWidth;
        const narrow = W < 640, n = words.length;
        if (narrow) {
          hubAt = [W / 2, 54];
          pos = words.map((_, i) => [i % 2 ? W * .66 : W * .34, 140 + i * 58]);
          H = 140 + (n - 1) * 58 + 46;
        } else {
          H = Math.min(470, Math.max(400, W * .36)); hubAt = [W / 2, H / 2];
          pos = words.map((_, i) => { const a = -Math.PI / 2 + (i + .5) * (Math.PI * 2 / n) + (i % 2 ? .1 : -.08), rx = W * .37, ry = H * .4 + (i % 2 ? 6 : -10);
            return [W / 2 + Math.cos(a) * rx, H / 2 + Math.sin(a) * ry]; });
        }
        field.style.height = `${H}px`; field.classList.toggle("is-narrow", narrow);
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        svg.innerHTML = words.map((w, i) => `<line class="mg-spoke" data-l="${w.dataset.q}"/><line class="mg-chain" data-c="${i}"/>`).join("");
        hub.style.transform = `translate(${hubAt[0]}px, ${hubAt[1]}px) translate(-50%, -50%)`;
        tick(performance.now());
      };
      // The words drift a few pixels on slow, separate rhythms; the lines follow them.
      const tick = (now) => {
        const t = still ? 0 : now / 1000, at = pos.map(([x, y], i) => [x + Math.sin(t * .35 + i * 1.7) * 3.5, y + Math.cos(t * .29 + i * 2.3) * 3]);
        words.forEach((w, i) => { w.style.transform = `translate(${at[i][0].toFixed(1)}px, ${at[i][1].toFixed(1)}px) translate(-50%, -50%)`; });
        const spokes = svg.querySelectorAll(".mg-spoke"), chain = svg.querySelectorAll(".mg-chain"), narrow = field.classList.contains("is-narrow");
        // Each spoke starts just outside the heading (an ellipse round it) and stops just short of its word.
        spokes.forEach((l, i) => { const [x, y] = at[i], [hx, hy] = hubAt, dx = x - hx, dy = y - hy, len = Math.hypot(dx, dy) || 1;
          const rx = narrow ? 0 : 170, ry = narrow ? 52 : 66, k = 1 / Math.hypot(dx / len / (rx || 1e-6), dy / len / ry), start = narrow ? 52 : Math.min(k, len * .6);
          l.style.display = narrow && i > 0 ? "none" : ""; l.setAttribute("x1", (hx + dx / len * start).toFixed(1)); l.setAttribute("y1", (hy + dy / len * start).toFixed(1)); l.setAttribute("x2", (x - dx / len * 26).toFixed(1)); l.setAttribute("y2", (y - dy / len * 22).toFixed(1)); });
        chain.forEach((l, i) => { const a = at[i], b = at[(i + 1) % at.length]; const last = i === at.length - 1;
          l.style.display = last ? "none" : ""; l.setAttribute("x1", a[0].toFixed(1)); l.setAttribute("y1", a[1].toFixed(1)); l.setAttribute("x2", b[0].toFixed(1)); l.setAttribute("y2", b[1].toFixed(1)); });
      };
      const loop = (now) => { tick(now); raf = requestAnimationFrame(loop); };
      const choose = (id) => {
        chosen = chosen === id ? null : id;
        field.classList.toggle("has-pick", !!chosen);
        words.forEach((w) => { w.classList.toggle("is-on", w.dataset.q === chosen); w.setAttribute("aria-expanded", String(w.dataset.q === chosen)); });
        svg.querySelectorAll(".mg-spoke").forEach((l) => l.classList.toggle("is-on", l.dataset.l === chosen));
        const q = M.questions.find((x) => x.id === chosen);
        if (q) inner.innerHTML = `<p class="mg-views-q">${esc(q.question)}</p><div class="mg-views-row">${q.views.map((v) => `<article class="mg-view"><h4>${esc(v.label)}</h4><small>${esc(v.holders)}</small>${claim(v.argument)}</article>`).join("")}</div>`;
        views.classList.toggle("is-open", !!q);
      };
      const onClick = (e) => { const w = e.target.closest(".mg-word"); if (w) choose(w.dataset.q); };
      root.addEventListener("click", onClick);
      const ro = new ResizeObserver(() => { if (Math.abs(field.clientWidth - W) > 1) place(); });
      ro.observe(field);
      place();
      if (!still) raf = requestAnimationFrame(loop);
      return () => { cancelAnimationFrame(raf); ro.disconnect(); root.removeEventListener("click", onClick); };
    },
  };
})();
