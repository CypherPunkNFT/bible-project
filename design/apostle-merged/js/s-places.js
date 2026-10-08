// 05 · Where was he? His places as a two-column list of compact cards, beside an SVG map drawn like the Atlas (the
// site's own land outline and projection, src/data/atlas-map.json) that fills the rest of the width and runs the full
// height of the list (sticky when the list is taller than the screen). The map is framed on his places with padding and
// can never zoom or pan out beyond that frame. Choosing a card flies the map there: if the place is outside the view it
// first eases out far enough to hold both, moves across, and zooms in at the end. Tradition's places are dashed, with
// who placed him there and when; places without coordinates are listed by name.
window.Places = (() => {
  const KIND_LABEL = { lake: "Lake", town: "Town", city: "City", port: "Port", region: "Region", island: "Island", tradition: "Tradition", unpinned: "No coordinates" };
  const DIR_DEG = { north: 0, "north-east": 45, east: 90, "south-east": 135, south: 180, "south-west": 225, west: 270, "north-west": 315 };
  // Who placed him there, from his own tradition records (the earliest that names the place).
  const tradFor = (d, p) => { const word = p.name.replace(/[“”"]/g, "").split(/[ ,(]/)[0]; return word.length > 3 ? d.trad.filter((t) => new RegExp(`\\b${word}`, "i").test(`${t.text} ${t.who}`)) : []; };

  function card(d, p, i) {
    const ents = p.entries.map((k) => d.byKey[k]).filter(Boolean), what = p.note ?? ents[0]?.title ?? "", tr = p.tradition ? tradFor(d, p) : [];
    const from = p.from ? `<svg width="10" height="10" viewBox="0 0 12 12" style="transform: rotate(${DIR_DEG[p.from.dir]}deg)"><path d="M6 1v10M6 1 3 4M6 1l3 3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>${p.from.km.toLocaleString("en-GB")} km ${p.from.dir}` : p.placeId === "a15257a" ? "The city itself" : p.xy ? "" : "No coordinates";
    const foot = p.tradition ? `${layerChip("tradition")}${tr[0] ? `<small>${esc(tr[0].who.split(/,|\(/)[0])}, ${esc(whenShort(tr[0].when))}${tr.length > 1 ? ` · +${tr.length - 1}` : ""}</small>` : ""}` : p.refs.length ? `<small>${esc(refText(p.refs[0]))}${p.refs.length > 1 ? ` +${p.refs.length - 1}` : ""}</small>` : "";
    return `<button type="button" class="pcard ${p.tradition ? "trad" : ""} ${p.xy ? "" : "nopin"}" data-place="${i}">
      <span class="pcard-icon">${icon(p.kind, 22)}</span>
      <span class="pcard-body">
        <span class="pcard-line"><span class="pcard-name">${esc(p.name)}</span><span class="pcard-n">${String(i + 1).padStart(2, "0")} · ${esc(KIND_LABEL[p.kind] ?? "")}</span></span>
        <span class="pcard-what">${esc(what)}</span>
        <span class="pcard-foot">${from ? `<span class="pcard-from">${from}</span>` : ""}${foot}</span>
      </span></button>`;
  }

  function mount(host, d) {
    const pinned = d.places.map((p, i) => ({ p, i })).filter(({ p }) => p.xy);
    const unpinned = d.places.filter((p) => !p.xy);
    const sec = document.createElement("section");
    sec.className = "sec"; sec.dataset.sec = "places";
    sec.innerHTML = `${secHead("05", "Near and far", "Where was <em>he?</em>", `${plural(d.places.length, "place")} named in his story, with what happened there and how far each lies from Jerusalem. Tradition's places are dashed, with who placed him there and when. Choose a card or a pin.`)}
      <div class="pl-grid"><div class="pl-cards" aria-label="${esc(d.short)}'s places">${d.places.map((p, i) => card(d, p, i)).join("")}</div>
        <div class="pl-map-col"><figure class="pl-map"><svg class="pl-svg" role="img" aria-label="Map of ${esc(d.short)}'s places"></svg>
          <figcaption><span>${icon("compass", 13)}Scroll to zoom · drag to move · the map stays on his places</span><span>Land outline: the Atlas (Natural Earth)</span></figcaption></figure></div></div>
      ${unpinned.length ? `<p class="unpinned">Not on the map, because our places data gives no coordinates: ${unpinned.map((p) => `<b>${esc(p.name)}</b>${p.note ? ` (${esc(p.note.replace(/\.$/, ""))})` : ""}`).join("; ")}.</p>` : ""}`;
    host.append(sec);
    const svgEl = sec.querySelector(".pl-svg"), cards = sec.querySelector(".pl-cards");
    let frame, view, sel = -1, pxW = 1;

    function fitFrame() {
      const box = svgEl.getBoundingClientRect(); pxW = Math.max(1, box.width);
      const aspect = box.width / Math.max(1, box.height);
      const xs = pinned.map(({ p }) => p.xy[0]), ys = pinned.map(({ p }) => p.xy[1]);
      let [x0, x1, y0, y1] = xs.length ? [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)] : [480, 520, 280, 300];
      const pad = Math.max(10, Math.max(x1 - x0, y1 - y0) * .16);
      x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
      const minW = pinned.length < 3 ? 46 : 36;
      if (x1 - x0 < minW) { const c = (x0 + x1) / 2; x0 = c - minW / 2; x1 = c + minW / 2; }
      if ((x1 - x0) / (y1 - y0) < aspect) { const c = (x0 + x1) / 2, w = (y1 - y0) * aspect; x0 = c - w / 2; x1 = c + w / 2; } else { const c = (y0 + y1) / 2, h = (x1 - x0) / aspect; y0 = c - h / 2; y1 = c + h / 2; }
      frame = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; view = { ...frame };
    }
    const clamp = () => {
      view.w = Math.min(frame.w, Math.max(frame.w / 10, view.w)); view.h = view.w * (frame.h / frame.w);
      view.x = Math.min(frame.x + frame.w - view.w, Math.max(frame.x, view.x)); view.y = Math.min(frame.y + frame.h - view.h, Math.max(frame.y, view.y));
    };
    let pinsG;
    // The land and water are drawn once per frame size; only the viewBox and the pins change while the map moves.
    function drawBase() {
      svgEl.innerHTML = `<defs><linearGradient id="pl-land" x1="0" y1="0" x2=".4" y2="1"><stop class="pl-land1" offset="0"/><stop class="pl-land2" offset="1"/></linearGradient></defs>
        <rect class="pl-water" x="${(frame.x - frame.w).toFixed(1)}" y="${(frame.y - frame.h).toFixed(1)}" width="${(frame.w * 3).toFixed(1)}" height="${(frame.h * 3).toFixed(1)}"/>
        <path class="pl-landp" d="${LAND.land}" vector-effect="non-scaling-stroke"/><g class="pl-pins"></g>`;
      pinsG = svgEl.querySelector(".pl-pins");
    }
    function draw() {
      const k = view.w / pxW, f = (v) => v.toFixed(2), labelled = [];
      // A name is written only where it does not crowd one already written (the chosen place always is).
      const order = [...pinned].sort((a, b) => (b.i === sel) - (a.i === sel) || (b.p.placeId === "a15257a") - (a.p.placeId === "a15257a"));
      for (const { p, i } of order) if (labelled.every(([x, y]) => Math.abs(x - p.xy[0]) / k > 90 || Math.abs(y - p.xy[1]) / k > 16)) labelled.push([p.xy[0], p.xy[1], i]);
      const named = new Set(labelled.map((l) => l[2]));
      pinsG.innerHTML = pinned.map(({ p, i }) => {
        const [x, y] = p.xy, on = i === sel, r = (on ? 7 : 5) * k;
        const mark = p.tradition ? `<circle class="pin-t" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" stroke-width="${f(1.6 * k)}" stroke-dasharray="${f(2.2 * k)} ${f(1.8 * k)}"/>` : `<circle class="pin" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" stroke-width="${f(1.4 * k)}"/>`;
        return `<g class="pin-g ${on ? "on" : ""}" data-place="${i}">${on ? `<circle class="pin-halo" cx="${f(x)}" cy="${f(y)}" r="${f(16 * k)}"/>` : ""}${mark}<circle class="pin-hit" cx="${f(x)}" cy="${f(y)}" r="${f(12 * k)}"/>
          ${named.has(i) ? `<text x="${f(x + 9 * k)}" y="${f(y + 4 * k)}" font-size="${f((on ? 13 : 11.5) * k)}" stroke-width="${f(3 * k)}">${esc(p.name.replace(/\s*\(.*\)$/, ""))}</text>` : ""}</g>`;
      }).join("");
      svgEl.setAttribute("viewBox", `${f(view.x)} ${f(view.y)} ${f(view.w)} ${f(view.h)}`);
    }

    // Flying to a place. A view is { x, y, w, h } in map units; we animate its centre and its width (the height
    // follows the frame's shape).
    const centreOf = (v) => [v.x + v.w / 2, v.y + v.h / 2];
    const viewAt = (cx, cy, w) => { const h = w * (frame.h / frame.w); return { x: cx - w / 2, y: cy - h / 2, w, h }; };
    const inView = (xy, v, margin = 0.08) => xy[0] > v.x + v.w * margin && xy[0] < v.x + v.w * (1 - margin) && xy[1] > v.y + v.h * margin && xy[1] < v.y + v.h * (1 - margin);
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    let anim = 0;
    function tween(from, to, ms) {
      return new Promise((done) => {
        const [ax, ay] = centreOf(from), [bx, by] = centreOf(to), t0 = performance.now(), run = ++anim;
        // The width moves on a log scale, so zooming reads as an even speed; the centre moves in step with it.
        const step = (now) => {
          if (run !== anim) return done(false);
          const t = Math.min(1, (now - t0) / ms), e = ease(t);
          view = viewAt(ax + (bx - ax) * e, ay + (by - ay) * e, Math.exp(Math.log(from.w) + (Math.log(to.w) - Math.log(from.w)) * e));
          draw();
          if (t < 1) requestAnimationFrame(step); else done(true);
        };
        requestAnimationFrame(step);
      });
    }
    const clampView = (v) => { const keep = view; view = { ...v }; clamp(); const out = view; view = keep; return out; };
    async function flyTo(xy) {
      const target = clampView(viewAt(xy[0], xy[1], Math.max(frame.w / 10, Math.min(view.w, frame.w * 0.3))));
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) { view = target; draw(); return; }
      if (inView(xy, view)) { await tween({ ...view }, target, 650); return; }
      // Out of view: ease out until both the present centre and the place fit, then glide over and zoom in.
      const [cx, cy] = centreOf(view), mx = (cx + xy[0]) / 2, my = (cy + xy[1]) / 2;
      const span = Math.max(Math.abs(xy[0] - cx) * 1.5, Math.abs(xy[1] - cy) * 1.5 * (frame.w / frame.h), view.w);
      const wide = clampView(viewAt(mx, my, Math.min(frame.w, span)));
      if (await tween({ ...view }, wide, 520)) await tween(wide, target, 780);
    }

    function select(i, from) {
      sel = i; const p = d.places[i];
      cards.querySelectorAll(".pcard").forEach((c) => c.classList.toggle("on", Number(c.dataset.place) === i));
      draw();
      if (p?.xy) flyTo(p.xy);
      if (from === "pin") cards.querySelector(`[data-place="${i}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    cards.addEventListener("click", (e) => { const c = e.target.closest("[data-place]"); if (c) select(Number(c.dataset.place), "card"); });
    svgEl.addEventListener("click", (e) => { if (moved) return; const g = e.target.closest("[data-place]"); if (g) select(Number(g.dataset.place), "pin"); });
    svgEl.addEventListener("wheel", (e) => {
      e.preventDefault(); anim++;
      const r = svgEl.getBoundingClientRect(), mx = view.x + ((e.clientX - r.left) / r.width) * view.w, my = view.y + ((e.clientY - r.top) / r.height) * view.h, z = Math.exp(e.deltaY * .0016);
      const w = view.w * z; view.x = mx - (mx - view.x) * (w / view.w); view.y = my - (my - view.y) * (w / view.w); view.w = w; clamp(); draw();
    }, { passive: false });
    let drag = null, moved = false;
    svgEl.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      // No text selection may start from the map, or follow the drag across the page.
      e.preventDefault(); getSelection()?.removeAllRanges(); document.documentElement.classList.add("no-select");
      anim++; drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; moved = false;
    });
    const onMove = (e) => {
      if (!drag) return; const r = svgEl.getBoundingClientRect(), dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      view.x = drag.vx - (dx / r.width) * view.w; view.y = drag.vy - (dy / r.height) * view.h; clamp(); draw();
    };
    const onUp = () => { if (drag) document.documentElement.classList.remove("no-select"); drag = null; };
    addEventListener("pointermove", onMove); addEventListener("pointerup", onUp); addEventListener("pointercancel", onUp);
    svgEl.addEventListener("pointermove", (e) => { const g = e.target.closest("[data-place]"); if (!g || drag) { Tip.hide(); return; } const p = d.places[Number(g.dataset.place)]; Tip.show(`<b>${esc(p.name)}</b><small>${esc(p.note ?? (p.tradition ? "Tradition" : ""))}</small>`, e.clientX, e.clientY); });
    svgEl.addEventListener("pointerleave", () => Tip.hide());
    const stop = onResize(svgEl, () => { anim++; fitFrame(); drawBase(); draw(); });
    fitFrame(); drawBase(); draw();
    return () => { stop(); removeEventListener("pointermove", onMove); removeEventListener("pointerup", onUp); removeEventListener("pointercancel", onUp); document.documentElement.classList.remove("no-select"); };
  }
  return { mount };
})();
