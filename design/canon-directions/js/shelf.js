// A: the surviving witnesses on a shelf, right under the opening: the six pictured codices with their catalogue facts.
// Two are records in this study (Sinaiticus, Alexandrinus) and open that record; the rest open their catalogue card.
(() => {
  const { imgSrc, pictureWhat, name } = CNX;
  function mount(section, { num }) {
    section.innerHTML = `${head(num, "The surviving witnesses", "What the lists were <em>about</em>", "Before any list, there were books copied by hand. A codex shows which writings were bound together; on its own it does not show which a community counted as canonical.")}
      <div class="cn-shelf">${CN.pictured.map((p) => `<button type="button" class="cn-book" data-picture="${p.q}">
        <span class="cn-book-img"><img src="${imgSrc(p.q)}" width="${p.w}" height="${p.h}" alt="${esc(`${p.name}: ${pictureWhat(p)}`)}" loading="lazy"></span>
        <span class="cn-book-text"><small>${esc(p.date)}</small><b>${esc(p.name)}</b><span>${esc(p.holds || p.material || "")}</span><span>${esc(p.holder)}</span>
        ${p.record ? `<i class="cn-book-tag">Record in this study · ${esc(name(p.record))}</i>` : ""}</span></button>`).join("")}</div>
      <p class="cn-caption">Pictures: public domain, from Wikimedia Commons; each is credited when opened. Facts from the open catalogue behind the <a href="../manuscripts-directions/?d=a">Manuscripts</a> page.</p>`;
  }
  Sections.shelf = { mount };
})();
