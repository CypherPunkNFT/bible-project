// Two shared sections: the places array (a sideways row of large tiles with icons, each with what happened there and
// its distance and direction from Jerusalem), and the mission globe section (the globe across the whole window).
window.Places = (() => {
  const KIND_LABEL = { lake: "Lake", town: "Town", city: "City", port: "Port", region: "Region", island: "Island", tradition: "Tradition", unpinned: "No coordinates" };
  const DIR_DEG = { north: 0, "north-east": 45, east: 90, "south-east": 135, south: 180, "south-west": 225, west: 270, "north-west": 315 };
  function tiles(d) {
    return d.places.map((p, i) => {
      const ents = p.entries.map((k) => d.byKey[k]).filter(Boolean);
      const what = p.note ?? ents[0]?.title ?? "";
      return `<button type="button" class="ptile ${p.tradition ? "trad" : ""}" data-place="${i}" ${p.ll ? "" : 'aria-disabled="true"'}>
        <span class="ptile-top"><span class="ptile-n">Nº ${String(i + 1).padStart(2, "0")}</span><span class="ptile-kind">${esc(KIND_LABEL[p.kind] ?? "")}</span></span>
        <span class="ptile-icon">${icon(p.kind, 34)}</span>
        <span class="ptile-name">${esc(p.name)}</span>
        <span class="ptile-from">${p.from ? `<svg width="12" height="12" viewBox="0 0 12 12" style="transform: rotate(${DIR_DEG[p.from.dir]}deg)"><path d="M6 1v10M6 1 3 4M6 1l3 3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>${p.from.km.toLocaleString("en-GB")} km ${p.from.dir} of Jerusalem` : p.placeId === "a15257a" ? "The city itself" : p.ll ? "" : "Not on the globe"}</span>
        <span class="ptile-what">${esc(what)}</span>
        <span class="ptile-refs">${p.tradition ? layerChip("tradition") : p.refs.length ? esc(refText(p.refs[0])) + (p.refs.length > 1 ? ` <small>+${p.refs.length - 1}</small>` : "") : ""}</span>
      </button>`;
    }).join("");
  }
  function mount(host, d, onPick) {
    host.innerHTML = `<div class="prow-wrap"><div class="prow" tabindex="0" aria-label="${esc(d.short)}'s places">${tiles(d)}</div>
      <div class="prow-nav"><button type="button" class="round" data-step="-1" aria-label="Scroll left">${icon("arrowLeft", 16)}</button><button type="button" class="round" data-step="1" aria-label="Scroll right">${icon("arrowRight", 16)}</button></div></div>`;
    const row = host.querySelector(".prow");
    host.addEventListener("click", (e) => {
      const s = e.target.closest("[data-step]"); if (s) { row.scrollBy({ left: Number(s.dataset.step) * row.clientWidth * .8, behavior: "smooth" }); return; }
      const t = e.target.closest("[data-place]"); if (t) { host.querySelectorAll(".ptile").forEach((x) => x.classList.toggle("on", x === t)); onPick?.(d.places[Number(t.dataset.place)]); }
    });
  }
  return { mount };
})();

window.Mission = (() => {
  function mount(container, d, { num, kicker = "The mission", title, sub }) {
    const all = [...d.globe.arcs, ...d.globe.journeys.flatMap((j) => j.arcs.map((a) => ({ ...a, period: 3 })))];
    const scr = all.filter((a) => a.kind === "scripture").length, trad = all.length - scr;
    const per = [1, 2, 3, 4].map((p) => all.filter((a) => a.period === p).length);
    const unpinned = d.places.filter((p) => !p.ll);
    const sec = document.createElement("section");
    sec.className = "bleed mission";
    sec.id = "mission";
    sec.innerHTML = `<div class="wrap">${secHead(num, kicker, title, sub)}
        <div class="mission-tools"><div class="legend-line"><span><i></i>Scripture · ${plural(scr, "route")}</span><span><i class="trad"></i>Tradition · ${trad}, labelled with who said it and when</span></div>
        <div class="seg" role="group" aria-label="Show a part of his life"><button type="button" data-p="0" aria-pressed="true">All</button>${d.periods.map((p, i) => `<button type="button" data-p="${i + 1}" aria-pressed="false" ${per[i] || d.places.some((pl) => pl.entries.some((k) => d.byKey[k]?.period === i + 1)) ? "" : "disabled"}>${p.n}<small>${esc(p.title)}</small></button>`).join("")}</div></div></div>
      <div class="mission-stage"></div>
      ${unpinned.length ? `<div class="wrap"><p class="unpinned">Not on the globe, because our places data gives no coordinates: ${unpinned.map((p) => `<b>${esc(p.name)}</b>${p.note ? ` (${esc(p.note.replace(/\.$/, ""))})` : ""}`).join("; ")}.</p></div>` : ""}`;
    container.append(sec);
    const stage = sec.querySelector(".mission-stage");
    // Attach when the section comes near, so the opening flight is seen.
    let attached = false;
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting && !attached) { attached = true; Globe.attach(stage, { d, view: "all" }); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(stage);
    sec.querySelector(".seg").addEventListener("click", (e) => {
      const b = e.target.closest("[data-p]"); if (!b || b.disabled) return;
      sec.querySelectorAll(".seg [data-p]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      if (!attached) { attached = true; Globe.attach(stage, { d, view: "all" }); }
      Globe.setPeriod(Number(b.dataset.p));
    });
    return { sec, stage, flyTo(place) { if (!attached) { attached = true; Globe.attach(stage, { d, view: "all" }); } Globe.flyToPlace(place); }, cleanup() { io.disconnect(); } };
  }
  return { mount };
})();
