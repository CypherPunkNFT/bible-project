// B: the eighteen records as a cabinet, one drawer per period of the live page's register. Each tile carries the record's
// own kind, date and name; a record with a surviving codex pictured shows it. Any tile opens the record sheet.
(() => {
  const { D, records, name, tone, pictureFor, imgSrc, glyph, ERA_SPANS } = CNX;
  function tile(r) {
    const p = pictureFor.get(r.id);
    return `<button type="button" class="cb-tile${p ? " cb-pic" : ""}" data-open="${r.id}" style="--tone:${tone(r.id)}">
      ${p ? `<span class="cb-img"><img src="${imgSrc(p.q)}" width="${p.w}" height="${p.h}" alt="" loading="lazy"></span>` : `<span class="cb-glyph">${glyph(r.id, 22)}</span>`}
      <span class="cb-kind">${esc(r.kind)}</span><small>${esc(r.date)}</small><b>${esc(name(r.id))}</b><span class="cb-title">${esc(r.title)}</span></button>`;
  }
  function mount(section, { num }) {
    section.innerHTML = `${head(num, "Enter the cabinet", "Put each witness back in <em>its own time</em>", "Explore eighteen records. Dates refer to the text, object or decision described; later copies and compilations are identified where relevant.")}
      <div class="cb">${D.eras.map((era, i) => `<div class="cb-drawer"><header><small>${String(i + 1).padStart(2, "0")} · ${esc(ERA_SPANS[i])}</small><h3>${esc(era)}</h3></header>
        <div class="cb-tiles">${records.filter((r) => r.era === i).map(tile).join("")}</div></div>`).join("")}</div>
      <p class="cn-caption">Drawers follow the live register's four periods; within each, records keep the research file's order. Overlapping and disputed dates remain visible on every tile.</p>
      ${CNX.bridge()}`;
  }
  Sections.cabinet = { mount };
})();
