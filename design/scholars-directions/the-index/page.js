// The index · the page: site frame, the switch between the two sides of Teachers, the headline with its figures, then
// the catalogue (main event), side by side, by the numbers, and an A–Z list of everyone. One failing section never
// stops the others.
(() => {
  const { S, esc, tone, years, surname, emit } = IX;
  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = "wrap ix";
  main.append(wrap);
  wrap.insertAdjacentHTML("afterbegin", Sides.html("scholars"));

  const live = S.scholars.filter((s) => s.site?.status === "in-use"), held = S.scholars.filter((s) => s.site?.status === "held");
  const first = S.scholars[0], last = S.scholars.at(-1);
  wrap.insertAdjacentHTML("beforeend", `<section class="ix-hero" aria-label="Scholars">
      <div><p class="kicker ix-hero-kicker">Scholars in the library</p>
        <h1 class="ix-title">The greats, <em>catalogued.</em></h1>
        <p class="ix-lead">Historians, translators, archaeologists, theologians and the makers of reference books: ${S.scholars.length} scholars across two thousand years,
          Christian or not, each labelled for what they were. Some of them built this site. Their dictionaries, concordance and harmony power its Topics, Gospel harmony and Letters study.</p></div>
      <dl class="ix-figs">
        <div><dt>Scholars</dt><dd>${S.scholars.length}</dd><p>from ${esc(first.short)} to ${esc(last.short)}</p></div>
        <div><dt>Fields</dt><dd>${Object.keys(S.fields).length}</dd><p>history to reference books</p></div>
        <div><dt>Used on this site</dt><dd>${live.length}</dd><p>${held.length} more in the library</p></div>
        <div><dt>Since</dt><dd>${first.circa ? `<small>c.</small> ` : ""}${first.born}</dd><p>${esc(first.short)}, the earliest</p></div>
      </dl></section>`);

  const SECTIONS = [["catalogue", "The catalogue", (el) => IX.gallery.mount(el)], ["compare", "Side by side", (el) => IX.compare.mount(el)],
    ["numbers", "By the numbers", (el) => IX.numbers.mount(el)], ["everyone", "Everyone, A to Z", mountAZ]];
  for (const [id, title, mount] of SECTIONS) {
    const section = document.createElement("section");
    section.id = id;
    section.className = `ix-sec ix-sec-${id}`;
    section.setAttribute("aria-label", title);
    wrap.append(section);
    try { mount(section); } catch (error) {
      console.error(`Scholars index: the "${title}" section failed to draw`, error);
      section.innerHTML = `<p class="ix-failed">This section could not be drawn.</p>`;
    }
  }
  emit("filter", { ...IX.gallery.state, visible: IX.gallery.visibleIds() });

  // A compact list of all 35 by surname, grouped by first letter; each opens the profile.
  function mountAZ(section) {
    const list = [...S.scholars].sort((a, b) => surname(a).localeCompare(surname(b)));
    const groups = new Map();
    for (const s of list) { const letter = surname(s)[0]; if (!groups.has(letter)) groups.set(letter, []); groups.get(letter).push(s); }
    section.innerHTML = `<header class="ix-head"><p class="kicker">04 · Everyone, A to Z</p><h2>All ${S.scholars.length}, <em>by name</em></h2></header>
      <div class="az">${[...groups].map(([letter, people]) => `<div class="az-group"><span class="az-letter">${letter}</span><ul>${people.map((s) =>
        `<li><button type="button" data-open="${s.id}" style="--tone: ${tone(s)}"><i>${IX.shapeIcon(s.field, 11)}</i><span>${esc(s.short)}</span><small>${esc(years(s))}</small></button></li>`).join("")}</ul></div>`).join("")}</div>`;
    section.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-open]");
      if (btn) emit("open", btn.dataset.open, btn, list.map((s) => s.id));
    });
  }
})();
