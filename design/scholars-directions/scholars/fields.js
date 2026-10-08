// 04 · Five ways to study the Bible (ported from A "Foundations"): the five fields as cards side by side. Choosing one
// widens it (the grid's columns animate; the row height never changes) to show its people, one line each, and a small
// link that filters the catalogue to that field. On a phone the cards stack and open in place. People open the profile.
window.Sections = window.Sections || {};
(() => {
  const D = window.SCHOLARS;
  if (!D || !Array.isArray(D.scholars)) throw new Error("Five ways to study the Bible: window.SCHOLARS is missing (expected ../shared/scholars-data.js to load first)");
  const FIELD_TONE = { history: "--history", texts: "--prophets", places: "--poetry", reference: "--epistles", theology: "--gospels" };
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const years = (s) => `${s.circa ? "c. " : ""}${s.born}–${s.died}`;
  const faith = (s) => D.faiths[s.faith] || D.faiths.unrecorded;
  const toneOf = (fieldKey) => FIELD_TONE[fieldKey] || "--accent";
  // Initials from the name before any "of …"/"the …": Flavius Josephus → FJ, Origen of Alexandria → O, A. T. Robertson → AR.
  const monogram = (s) => {
    const words = s.name.split(/ (?:of|the) /)[0].split(/\s+/).filter((w) => /^[A-Z]/.test(w));
    return words.length > 1 ? words[0][0] + words.at(-1)[0] : words[0][0];
  };
  const mono = (s) => `<span class="fld-mono" style="--tone: var(${toneOf(s.field)})" aria-hidden="true">${esc(monogram(s))}</span>`;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const groups = Object.entries(D.fields).map(([key, label]) => ({ key, label, people: D.scholars.filter((s) => s.field === key) }));

  const span = (people) => {
    const a = people[0], b = people.at(-1);
    return people.length === 1 ? esc(a.short) : `From ${esc(a.short)} to ${esc(b.short)}, ${a.circa ? "c. " : ""}${a.born}–${b.died}`;
  };

  const cardHtml = (g) => `<article class="fld-card" data-field="${g.key}" style="--tone: var(${toneOf(g.key)})">
      <button type="button" class="fld-head" aria-expanded="false" aria-controls="fld-list-${g.key}">
        <span class="fld-count">${g.people.length} scholar${g.people.length === 1 ? "" : "s"}</span>
        <h3>${esc(g.label)}</h3>
        <span class="fld-span">${span(g.people)}</span>
        <span class="fld-avatars" aria-hidden="true">${g.people.map(mono).join("")}</span>
        <span class="fld-open" aria-hidden="true">${icon("arrowRight", 16)}</span>
      </button>
      <div class="fld-body" id="fld-list-${g.key}"><div class="fld-body-in">
        <ul class="fld-people">${g.people.map((s) => `<li><button type="button" data-scholar="${s.id}">
          ${mono(s)}<span><b>${esc(s.name)}</b><small>${esc(years(s))} · ${esc(faith(s))}</small><em>${esc(s.line)}</em></span></button></li>`).join("")}</ul>
        <button type="button" class="fld-cat" data-catalogue="${g.key}">See them in the catalogue ${icon("arrowRight", 14)}</button>
      </div></div>
    </article>`;

  function select(section, key, toggle) {
    const cards = [...section.querySelectorAll(".fld-card")];
    const grid = section.querySelector(".fld-grid");
    const card = cards.find((c) => c.dataset.field === key);
    const closing = toggle && card.classList.contains("fld-sel") && matchMedia("(max-width: 900px)").matches;
    cards.forEach((c) => {
      const on = c === card && !closing;
      c.classList.toggle("fld-sel", on);
      c.querySelector(".fld-head").setAttribute("aria-expanded", String(on));
    });
    grid.style.setProperty("--cols", cards.map((c) => (c === card ? "3.4fr" : "1fr")).join(" "));
  }

  function mount(section) {
    section.innerHTML = `<header class="s-head"><p class="kicker"><span class="s-num">04</span>Fields</p>
        <h2>Five ways to <em>study the Bible</em></h2>
        <p>Every scholar here worked mainly in one of five fields. Choose a field to see its people.</p></header>
      <div class="fld-grid">${groups.map(cardHtml).join("")}</div>`;
    section.addEventListener("click", (event) => {
      const head = event.target.closest(".fld-head");
      if (head) {
        section.querySelector(".fld-grid").classList.add("fld-picked");
        select(section, head.closest(".fld-card").dataset.field, true);
        return;
      }
      const person = event.target.closest("[data-scholar]");
      if (person) { window.Scholars?.openProfile?.(person.dataset.scholar, person); return; }
      const link = event.target.closest("[data-catalogue]");
      if (link) {
        window.Scholars?.filterCatalogue?.({ field: link.dataset.catalogue });
        document.getElementById("catalogue")?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
      }
    });
    select(section, "texts", false);
  }

  window.Sections.fields = { mount };
})();
