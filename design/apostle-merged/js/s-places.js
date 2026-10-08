// 05 · Where was he? His places as cards with icons in two rows, beside an SVG map drawn like the Atlas (the site's own
// land outline and projection, src/data/atlas-map.json), framed on his places with padding. The map zooms in and
// pans, but can never zoom or pan out beyond that frame. A card and its pin light each other. Tradition's places are
// dashed, with who placed him there and when; places without coordinates are listed by name.
window.Places = (() => {
  const KIND_LABEL = { lake: "Lake", town: "Town", city: "City", port: "Port", region: "Region", island: "Island", tradition: "Tradition", unpinned: "No coordinates" };
  const DIR_DEG = { north: 0, "north-east": 45, east: 90, "south-east": 135, south: 180, "south-west": 225, west: 270, "north-west": 315 };
  // Who placed him there, from his own tradition records (the earliest that names the place).
  const tradFor = (d, p) => { const word = p.name.replace(/[“”"]/g, "").split(/[ ,(]/)[0]; return word.length > 3 ? d.trad.filter((t) => new RegExp(`\\b${word}`, "i").test(`${t.text} ${t.who}`)) : []; };

  function card(d, p, i) {
    const ents = p.entries.map((k) => d.byKey[k]).filter(Boolean), what = p.note ?? ents[0]?.title ?? "", tr = p.tradition ? tradFor(d, p) : [];
    return `<button type="button" class="pcard ${p.tradition ? "trad" : ""} ${p.xy ? "" : "nopin"}" data-place="${i}">
      <span class="pcard-top"><span class="pcard-n">Nº ${String(i + 1).padStart(2, "0")}</span><span class="pcard-kind">${esc(KIND_LABEL[p.kind] ?? "")}</span></span>
      <span class="pcard-head"><span class="pcard-icon">${icon(p.kind, 26)}</span><span class="pcard-name">${esc(p.name)}</span></span>
      <span class="pcard-from">${p.from ? `<svg width="11" height="11" viewBox="0 0 12 12" style="transform: rotate(${DIR_DEG[p.from.dir]}deg)"><path d="M6 1v10M6 1 3 4M6 1l3 3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>${p.from.km.toLocaleString("en-GB")} km ${p.from.dir} of Jerusalem` : p.placeId === "a15257a" ? "The city itself" : p.xy ? "" : "No coordinates in our places data"}</span>
      <span class="pcard-what">${esc(what)}</span>
      <span class="pcard-foot">${p.tradition ? `${layerChip("tradition")}${tr[0] ? `<small>${esc(tr[0].who.split(/,|\(/)[0])}, ${esc(whenShort(tr[0].when))}${tr.length > 1 ? ` · +${tr.length - 1}` : ""}</small>` : ""}` : p.refs.length ? `<small>${esc(refText(p.refs[0]))}${p.refs.length > 1 ? ` +${p.refs.length - 1}` : ""}</small>` : ""}</span></button>`;
  }

  function mount(host, d) {
    const pinned = d.places.map((p, i) => ({ p, i })).filter(({ p }) => p.xy);
    const unpinned = d.places.filter((p) => !p.xy);
    const sec = document.createElement("section");
    sec.className = "sec"; sec.dataset.sec = "places";
    sec.innerHTML = `${secHead("05", "Near and far", "Where was <em>he?</em>", `${plural(d.places.length, "place")} named in his story, with what happened there and how far each lies from Jerusalem. Tradition's places are dashed, with who placed him there and when. Choose a card or a pin.`)}
      <div class="pl-grid"><div class="pl-cards-wrap"><div class="pl-cards" tabindex="0" aria-label="${esc(d.short)}'s places">${d.places.map((p, i) => card(d, p, i)).join("")}</div></div>
        <figure class="pl-map"><svg class="pl-svg" role="img" aria-label="Map of ${esc(d.short)}'s places"></svg>
          <figcaption><span>${icon("compass", 13)}Scroll to zoom · drag to move · the map stays on his places</span><span>Land outline: the Atlas (Natural Earth)</span></figcaption></figure></div>
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
    function draw() {
      const k = view.w / pxW, f = (v) => v.toFixed(2), labelled = [];
      // A name is written only where it does not crowd one already written (the chosen place always is).
      const order = [...pinned].sort((a, b) => (b.i === sel) - (a.i === sel) || (b.p.placeId === "a15257a") - (a.p.placeId === "a15257a"));
      for (const { p, i } of order) if (labelled.every(([x, y]) => Math.abs(x - p.xy[0]) / k > 90 || Math.abs(y - p.xy[1]) / k > 16)) labelled.push([p.xy[0], p.xy[1], i]);
      const named = new Set(labelled.map((l) => l[2]));
      const pins = pinned.map(({ p, i }) => {
        const [x, y] = p.xy, on = i === sel, r = (on ? 7 : 5) * k;
        const mark = p.tradition ? `<circle class="pin-t" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" stroke-width="${f(1.6 * k)}" stroke-dasharray="${f(2.2 * k)} ${f(1.8 * k)}"/>` : `<circle class="pin" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" stroke-width="${f(1.4 * k)}"/>`;
        return `<g class="pin-g ${on ? "on" : ""}" data-place="${i}">${on ? `<circle class="pin-halo" cx="${f(x)}" cy="${f(y)}" r="${f(16 * k)}"/>` : ""}${mark}<circle class="pin-hit" cx="${f(x)}" cy="${f(y)}" r="${f(12 * k)}"/>
          ${named.has(i) ? `<text x="${f(x + 9 * k)}" y="${f(y + 4 * k)}" font-size="${f((on ? 13 : 11.5) * k)}" stroke-width="${f(3 * k)}">${esc(p.name.replace(/\s*\(.*\)$/, ""))}</text>` : ""}</g>`;
      }).join("");
      svgEl.setAttribute("viewBox", `${f(view.x)} ${f(view.y)} ${f(view.w)} ${f(view.h)}`);
      svgEl.innerHTML = `<defs><linearGradient id="pl-land" x1="0" y1="0" x2=".4" y2="1"><stop class="pl-land1" offset="0"/><stop class="pl-land2" offset="1"/></linearGradient></defs>
        <rect class="pl-water" x="${f(frame.x - 50)}" y="${f(frame.y - 50)}" width="${f(frame.w + 100)}" height="${f(frame.h + 100)}"/>
        <path class="pl-landp" d="${LAND.land}" stroke-width="${f(1.1 * k)}"/>${pins}`;
    }
    function select(i, from) {
      sel = i; const p = d.places[i];
      cards.querySelectorAll(".pcard").forEach((c) => c.classList.toggle("on", Number(c.dataset.place) === i));
      if (p?.xy && (p.xy[0] < view.x || p.xy[0] > view.x + view.w || p.xy[1] < view.y || p.xy[1] > view.y + view.h)) { view.x = p.xy[0] - view.w / 2; view.y = p.xy[1] - view.h / 2; clamp(); }
      draw();
      if (from === "pin") cards.querySelector(`[data-place="${i}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
    cards.addEventListener("click", (e) => { const c = e.target.closest("[data-place]"); if (c) select(Number(c.dataset.place), "card"); });
    svgEl.addEventListener("click", (e) => { if (moved) return; const g = e.target.closest("[data-place]"); if (g) select(Number(g.dataset.place), "pin"); });
    svgEl.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = svgEl.getBoundingClientRect(), mx = view.x + ((e.clientX - r.left) / r.width) * view.w, my = view.y + ((e.clientY - r.top) / r.height) * view.h, z = Math.exp(e.deltaY * .0016);
      const w = view.w * z; view.x = mx - (mx - view.x) * (w / view.w); view.y = my - (my - view.y) * (w / view.w); view.w = w; clamp(); draw();
    }, { passive: false });
    let drag = null, moved = false;
    svgEl.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; moved = false; });
    const onMove = (e) => {
      if (!drag) return; const r = svgEl.getBoundingClientRect(), dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      view.x = drag.vx - (dx / r.width) * view.w; view.y = drag.vy - (dy / r.height) * view.h; clamp(); draw();
    };
    const onUp = () => { drag = null; };
    addEventListener("pointermove", onMove); addEventListener("pointerup", onUp);
    svgEl.addEventListener("pointermove", (e) => { const g = e.target.closest("[data-place]"); if (!g || drag) { Tip.hide(); return; } const p = d.places[Number(g.dataset.place)]; Tip.show(`<b>${esc(p.name)}</b><small>${esc(p.note ?? (p.tradition ? "Tradition" : ""))}</small>`, e.clientX, e.clientY); });
    svgEl.addEventListener("pointerleave", () => Tip.hide());
    const stop = onResize(svgEl, () => { fitFrame(); draw(); });
    fitFrame(); draw();
    return () => { stop(); removeEventListener("pointermove", onMove); removeEventListener("pointerup", onUp); };
  }
  return { mount };
})();
