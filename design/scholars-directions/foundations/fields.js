// 03 · Five ways to study the Bible: the five fields as cards side by side. Choosing one widens it (the grid's columns
// animate; the row height never changes) to show its people, one line each. On a phone the cards stack and open in place.
Sections.fields = (() => {
  const { D, esc, years, faith, mono, tone } = Sc;
  const groups = Object.entries(D.fields).map(([key, label]) => ({ key, label, people: D.scholars.filter((s) => s.field === key) }));

  const span = (people) => {
    const a = people[0], b = people.at(-1);
    return people.length === 1 ? esc(a.short) : `From ${esc(a.short)} to ${esc(b.short)}, ${a.circa ? "c. " : ""}${a.born}–${b.died}`;
  };

  const cardHtml = (g) => `<article class="fd-card" data-field="${g.key}" style="--tone: var(${tone({ field: g.key })})">
      <button type="button" class="fd-head" aria-expanded="false" aria-controls="fd-list-${g.key}">
        <span class="fd-count">${g.people.length} scholar${g.people.length === 1 ? "" : "s"}</span>
        <h3>${esc(g.label)}</h3>
        <span class="fd-span">${span(g.people)}</span>
        <span class="fd-avatars" aria-hidden="true">${g.people.map((s) => mono(s)).join("")}</span>
        <span class="fd-open" aria-hidden="true">${icon("arrowRight", 16)}</span>
      </button>
      <div class="fd-body" id="fd-list-${g.key}"><div class="fd-body-in"><ul class="fd-people sc-scroll">${g.people.map((s) => `<li><button type="button" data-scholar="${s.id}">
        ${mono(s)}<span><b>${esc(s.name)}</b><small>${esc(years(s))} · ${esc(faith(s))}</small><em>${esc(s.line)}</em></span></button></li>`).join("")}</ul></div></div>
    </article>`;

  function select(section, key, toggle) {
    const cards = [...section.querySelectorAll(".fd-card")];
    const grid = section.querySelector(".fd-grid");
    const card = cards.find((c) => c.dataset.field === key);
    const closing = toggle && card.classList.contains("fd-sel") && matchMedia("(max-width: 900px)").matches;
    cards.forEach((c) => {
      const on = c === card && !closing;
      c.classList.toggle("fd-sel", on);
      c.querySelector(".fd-head").setAttribute("aria-expanded", String(on));
    });
    grid.style.setProperty("--cols", cards.map((c) => (c === card ? "3.4fr" : "1fr")).join(" "));
  }

  function mount(section) {
    section.innerHTML = `${Sc.head("03", "Fields", "Five ways to <em>study the Bible</em>",
      "Every scholar here worked mainly in one of five fields. Choose a field to see its people.")}
      <div class="fd-grid">${groups.map(cardHtml).join("")}</div>`;
    section.querySelectorAll(".fd-head").forEach((head) => head.addEventListener("click", () => {
      section.querySelector(".fd-grid").classList.add("fd-picked");
      select(section, head.closest(".fd-card").dataset.field, true);
    }));
    select(section, "texts", false);
  }
  return { mount };
})();
