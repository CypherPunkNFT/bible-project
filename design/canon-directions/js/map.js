// C: where the lists were made. The records on one map of the Mediterranean, Westminster to Babylonia, placed only as
// precisely as each record names its place: a city as a point, a region (Egypt, North Africa, Roman Palestine, the
// Syriac-speaking churches, Babylonia) as a soft area, a disputed place with a dashed ring and a question mark. Records
// that name no place stand in a tray beside the map. Choose a period to light up its records.
(() => {
  const { D, records, byId, name, tone, ERA_SPANS } = CNX;
  const M = CN.map;
  const [bx, by, bw, bh] = M.box;
  // Hand-placed labels where points crowd (Caesarea, Qumran and Roman Palestine sit within a few miles on this scale).
  const LABEL = {
    eusebius: [-10, -8, "end"], qumran: [8, 10, "start"], mishnah: [0, -34, "middle"], athanasius: [-8, 14, "end"], sirach: [0, 26, "middle"],
    justin: [8, -6, "start"], muratorian: [8, 12, "start"], carthage: [8, -4, "start"], augustine: [-4, 34, "middle"], irenaeus: [8, 4, "start"],
    trent: [8, -4, "start"], westminster: [8, 4, "start"], peshitta: [0, -30, "middle"], bava: [20, -30, "middle"],
  };
  const ONMAP = records.filter((r) => CN.places[r.id].kind !== "none");
  const OFFMAP = records.filter((r) => CN.places[r.id].kind === "none");

  function mark(r) {
    const p = CN.places[r.id], x = p.x - bx, y = p.y - by, [dx, dy, anchor] = LABEL[r.id] ?? [8, 4, "start"];
    const shape = p.kind === "region" ? `<ellipse class="mp-area" cx="${x}" cy="${y}" rx="44" ry="24"/>`
      : p.kind === "disputed" ? `<circle class="mp-ring" cx="${x}" cy="${y}" r="9"/>` : `<circle class="mp-dot" cx="${x}" cy="${y}" r="4.6"/><circle class="mp-halo" cx="${x}" cy="${y}" r="9"/>`;
    return `<g class="mp-mark mp-${p.kind}" data-open="${r.id}" data-era="${r.era}" style="--tone:${tone(r.id)}" tabindex="0" role="button" aria-label="${esc(`${name(r.id)}, ${r.date}, ${p.label}`)}">
      ${shape}<text x="${x + dx}" y="${y + dy}" text-anchor="${anchor}">${esc(name(r.id))}${p.kind === "disputed" ? "?" : ""}</text></g>`;
  }
  function mount(section, { num }) {
    section.innerHTML = `${head(num, "Where the lists were made", "Put each witness back in <em>its own place and time</em>", "Eighteen records, each placed only as precisely as it names its own place. Choose a period, or open any record.")}
      <div class="ct-sort mp-eras" role="radiogroup" aria-label="Periods"><button type="button" role="radio" data-era="all">All periods</button>${D.eras.map((era, i) => `<button type="button" role="radio" data-era="${i}" title="${esc(ERA_SPANS[i])}">${esc(era)}</button>`).join("")}</div>
      <div class="mp">
        <figure class="mp-map"><svg viewBox="0 0 ${bw} ${bh}" role="group" aria-label="Map of where the records were made">
          <g transform="translate(${-bx} ${-by})"><path class="mp-land" d="${[].concat(M.d).join(" ")}"/></g>
          <g class="mp-marks">${ONMAP.filter((r) => CN.places[r.id].kind === "region").map(mark).join("")}${ONMAP.filter((r) => CN.places[r.id].kind !== "region").map(mark).join("")}</g>
        </svg><figcaption>Land outlines: Natural Earth (public domain). A soft area marks a region the record names, not a boundary.</figcaption></figure>
        <aside class="mp-tray"><p class="kicker">Place not given</p><p class="mp-tray-line">These records name no place, or say it is uncertain. They are listed, not guessed.</p>
          ${OFFMAP.map((r) => `<button type="button" class="mp-off" data-open="${r.id}" data-era="${r.era}" style="--tone:${tone(r.id)}"><small>${esc(r.date)}</small><b>${esc(name(r.id))}</b><span>${esc(CN.places[r.id].label)}</span></button>`).join("")}
          <p class="mp-key"><span><i class="mp-k-dot"></i>A named city or site</span><span><i class="mp-k-area"></i>A named region</span><span><i class="mp-k-ring"></i>Place disputed</span></p></aside>
      </div>
      <p class="ms-say" aria-live="polite">Point at a record to read it here; click to open it.</p>
      ${CNX.bridge()}`;
    const say = section.querySelector(".ms-say"), base = say.innerHTML;
    const show = (el) => {
      if (!el) { say.innerHTML = base; return; }
      const r = byId.get(el.dataset.open);
      say.innerHTML = `<b>${esc(name(r.id))}</b> · ${esc(r.date)} · ${esc(r.place)}. ${esc(r.title)} <span class="ms-say-go">${esc(r.kind)} · open</span>`;
    };
    const wrap = section.querySelector(".mp");
    wrap.addEventListener("pointerover", (e) => show(e.target.closest("[data-open]")));
    wrap.addEventListener("focusin", (e) => show(e.target.closest("[data-open]")));
    wrap.addEventListener("pointerleave", () => show(null));
    wrap.addEventListener("keydown", (e) => { const g = e.target.closest(".mp-mark"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); Sheet.open(g.dataset.open, g); } });
    const choose = (era) => {
      section.querySelectorAll(".mp-eras [data-era]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.era === era)));
      wrap.querySelectorAll("[data-open]").forEach((el) => el.classList.toggle("mp-dim", era !== "all" && el.dataset.era !== era));
    };
    section.querySelector(".mp-eras").addEventListener("click", (e) => { const b = e.target.closest("[data-era]"); if (b) choose(b.dataset.era); });
    choose("all");
  }
  Sections.map = { mount };
})();
