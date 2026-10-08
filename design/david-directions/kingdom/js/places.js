// The places: the twenty-five places the reign names, as a sideways row of large tiles in the order the reign names
// them. Each has an icon for its kind, what happened there, and its distance and direction from Jerusalem (worked out
// from the Atlas positions; regions and rivers have no single point). Touching a tile flies the land to it. The kingdom
// itself belongs in the Atlas, so the row opens with a door to it.
(() => {
  const TYPE_ICON = { settlement: "city", region: "region", river: "waves", hill: "mountain", spring: "drop", valley: "valley" };
  const TYPE_NAME = { settlement: "Town", region: "Region", river: "River", hill: "Hill", spring: "Spring", valley: "Valley" };
  const conf = (c) => (c >= 0.8 ? "sure" : c >= 0.45 ? "likely" : "uncertain");

  function tile(t) {
    const cap = t.placeId === DV.person.capital.placeId;
    const evs = DV.crystals.filter((c) => c.placeId === t.placeId).map((c) => c.label);
    const dir = cap ? `<span class="pt-dir">${icon("crown", 14)}The capital</span>` : !t.from ? `<span class="pt-dir is-none">${esc(TYPE_NAME[t.type] ?? t.type)}: no single point</span>`
      : t.from.km === 0 ? `<span class="pt-dir">${icon("target", 14)}At Jerusalem's Atlas point</span>` : `<span class="pt-dir"><i style="--deg:${t.from.deg}deg">${icon("arrowUp", 14)}</i>${t.from.km} km ${t.from.dir}</span>`;
    return `<li><button type="button" class="pt ${cap ? "is-capital" : ""}" data-tile="${t.i}">
      <span class="pt-top"><span class="pt-ico">${icon(cap ? "crown" : TYPE_ICON[t.type] ?? "pin", 36, 1.25)}</span><span class="pt-n">${String(t.i + 1).padStart(2, "0")}</span></span>
      <strong>${esc(t.name)}</strong>
      <span class="pt-note">${esc(t.note)}</span>
      <span class="pt-evs">${evs.length ? evs.slice(0, 3).map((l) => `<span>${esc(l)}</span>`).join("") + (evs.length > 3 ? `<span>and ${evs.length - 3} more</span>` : "") : `<span class="is-quiet">${esc(refText(t.refs[0]))}</span>`}</span>
      <span class="pt-foot">${dir}<span>${TYPE_NAME[t.type] ?? esc(t.type)} · ${conf(t.confidence)} · named in ${t.named} verse${t.named === 1 ? "" : "s"}</span></span>
    </button></li>`;
  }
  const door = () => `<li><a class="pt pt-door" href="/study/atlas">
      <span class="pt-top"><span class="pt-ico">${icon("map", 36, 1.25)}</span><span class="pt-n">Atlas</span></span>
      <strong>David's kingdom in the Atlas</strong>
      <span class="pt-note">The kingdom under David will be an Atlas article of its own, beside the ancient cities.</span>
      <span class="pt-evs"><span class="is-quiet">Planned: that article is not written yet. For now this door opens the Atlas.</span></span>
      <span class="pt-foot"><span class="pt-dir">Open the Atlas ${icon("arrowRight", 14)}</span></span></a></li>`;

  window.Places = {
    mount(root) {
      root.innerHTML = `<div class="wrap">${sectionHead("03", `${icon("pin", 14)}${DV.tiles.length} places`, "The places of the reign", "In the order the reign names them, from Bethlehem to Gihon. Touch one to fly the land to it. No borders are drawn: Scripture names places, not lines.", "places-h")}
        <div class="pt-ctl"><button type="button" data-scroll="-1" aria-label="Scroll the places left">${icon("chevronLeft", 18)}</button><button type="button" data-scroll="1" aria-label="Scroll the places right">${icon("chevronRight", 18)}</button></div></div>
        <div class="pt-rail"><ol class="pt-row">${door()}${DV.tiles.map(tile).join("")}</ol></div>`;
      const row = root.querySelector(".pt-rail");
      root.addEventListener("click", (e) => {
        const s = e.target.closest("[data-scroll]");
        if (s) { row.scrollBy({ left: Number(s.dataset.scroll) * row.clientWidth * 0.8, behavior: reduced() ? "auto" : "smooth" }); return; }
        const b = e.target.closest("[data-tile]");
        if (b) Land.showPlaces(Number(b.dataset.tile));
      });
    },
  };
})();
