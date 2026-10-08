// 06 · By the numbers (ported from "The index"): scholars per field, per age, per faith and how many this site uses.
// Every row is also a filter for the catalogue: clicking it adds or removes that filter (through
// Scholars.filterCatalogue) and brings the catalogue into view. The darker part of a bar is how many of that group the
// catalogue shows right now; it follows the catalogue's "scholars:filter" announcements.
window.Sections = window.Sections || {};
(() => {
  const S = window.SCHOLARS;
  const TONE = { history: "--history", texts: "--prophets", places: "--poetry", reference: "--epistles", theology: "--gospels" };
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const eraParts = (key) => {
    const m = S.eras[key].match(/^(?:The )?(.+?) \((.+)\)$/);
    return m ? [m[1][0].toUpperCase() + m[1].slice(1), m[2]] : [S.eras[key], ""];
  };
  const SHAPES = {
    history: (k) => `<circle cx="24" cy="24" r="${22 * k}"/>`,
    texts: (k) => { const r = 21 * k; return `<rect x="${24 - r}" y="${24 - r}" width="${2 * r}" height="${2 * r}" rx="${11 * k}"/>`; },
    places: (k) => `<path d="${[0, 1, 2, 3, 4, 5].map((i) => { const a = Math.PI / 3 * i - Math.PI / 2; return `${i ? "L" : "M"}${(24 + 23 * k * Math.cos(a)).toFixed(2)} ${(24 + 23 * k * Math.sin(a)).toFixed(2)}`; }).join("")}Z" stroke-linejoin="round"/>`,
    reference: (k) => `<rect x="${24 - 16 * k}" y="${24 - 22 * k}" width="${32 * k}" height="${44 * k}" rx="${7 * k}"/>`,
    theology: (k) => { const w = 19 * k, top = 24 - 21 * k, bot = 24 + 21 * k; return `<path d="M${24 - w} ${bot}V${top + w}A${w} ${w} 0 0 1 ${24 + w} ${top + w}V${bot}Z"/>`; },
  };
  const shapeIcon = (field, size) => `<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true" style="fill: color-mix(in srgb, var(${TONE[field]}) 22%, transparent); stroke: var(${TONE[field]})" stroke-width="4">${SHAPES[field](.9)}</svg>`;

  let root;
  // The catalogue's latest state; its opening state is "everything shown, nothing chosen".
  let latest = { field: [], era: [], faith: [], used: false, q: "", visible: S.scholars.map((s) => s.id) };
  const count = (key, value) => S.scholars.filter((s) => s[key] === value).length;

  const bars = (key, labels, explain) => {
    const top = Math.max(...Object.keys(labels).map((v) => count(key, v)));
    return `<ul class="num-bars">${Object.entries(labels).map(([value, label]) => {
      const n = count(key, value);
      return `<li><button type="button" class="num-row" data-facet="${key}" data-value="${value}" aria-pressed="false"${key === "field" ? ` style="--tone: var(${TONE[value]})"` : ""}>
        <span class="num-l">${key === "field" ? shapeIcon(value, 12) : ""}${esc(label)}</span>
        <span class="num-track"><i style="width:${n / top * 100}%"></i><b style="width:${n / top * 100}%"></b></span>
        <span class="num-n"><b>${n}</b></span></button></li>`;
    }).join("")}</ul><p class="num-explain">${explain}</p>`;
  };
  const eraDots = () => `<ul class="num-dots">${Object.keys(S.eras).map((era) => {
    const [name, span] = eraParts(era), people = S.scholars.filter((s) => s.era === era);
    return `<li><button type="button" class="num-row num-dotrow" data-facet="era" data-value="${era}" aria-pressed="false">
      <span class="num-l">${esc(name)} <small>${esc(span)}</small></span><span class="num-n"><b>${people.length}</b></span>
      <span class="num-dotset">${people.map((s) => `<i data-id="${s.id}" style="--tone: var(${TONE[s.field]})" title="${esc(s.short)}"></i>`).join("")}</span></button></li>`;
  }).join("")}</ul><p class="num-explain">One dot per scholar, coloured by field and placed in the age they lived in. Click an age to filter.</p>`;
  const used = () => {
    const live = S.scholars.filter((s) => s.site?.status === "in-use").length, held = S.scholars.filter((s) => s.site?.status === "held").length;
    return `<button type="button" class="num-row num-site" data-used aria-pressed="false">
        <span class="num-big"><b>${live}</b><span>of ${S.scholars.length} are used live on this site</span></span>
        <span class="num-grid">${S.scholars.map((s) => `<i class="num-${s.site?.status || "none"}" data-id="${s.id}" title="${esc(s.short)}"></i>`).join("")}</span>
        <span class="num-key"><span><i class="num-in-use"></i>Used live ${live}</span><span><i class="num-held"></i>In the library ${held}</span><span><i class="num-none"></i>Not yet ${S.scholars.length - live - held}</span></span>
      </button><p class="num-explain">One square per scholar. Click to show only the ones this site uses.</p>`;
  };

  function mount(section) {
    root = section;
    section.innerHTML = `<header class="s-head"><p class="kicker"><span class="s-num">06</span>By the numbers</p><h2>The thirty-five, <em>counted</em></h2>
        <p>How they fall by field, age and faith. Every bar is also a filter: click one to narrow the catalogue above.</p></header>
      <div class="num-strip">
        <div class="num-card"><h3>By field</h3>${bars("field", S.fields, "Scholars in each field. The darker part is how many the catalogue is showing now.")}</div>
        <div class="num-card"><h3>By age</h3>${eraDots()}</div>
        <div class="num-card"><h3>By faith</h3>${bars("faith", S.faiths, "Every scholar is labelled for what they were, Christian or not.")}</div>
        <div class="num-card"><h3>On this site</h3>${used()}</div>
      </div>`;
    section.addEventListener("click", (event) => {
      const row = event.target.closest(".num-row");
      if (!row) return;
      if (!window.Scholars?.filterCatalogue) { console.error("By the numbers: Scholars.filterCatalogue is missing (the catalogue did not load)"); return; }
      const next = { field: [...latest.field], era: [...latest.era], faith: [...latest.faith], used: latest.used, q: latest.q };
      if (row.hasAttribute("data-used")) next.used = !next.used;
      else {
        const list = next[row.dataset.facet], at = list.indexOf(row.dataset.value);
        if (at >= 0) list.splice(at, 1); else list.push(row.dataset.value);
      }
      window.Scholars.filterCatalogue(next);
    });
    paint();
  }

  // Repaint the "showing now" parts. Transforms and classes only; no rebuild.
  function paint() {
    if (!root) return;
    const shown = new Set(latest.visible);
    for (const row of root.querySelectorAll(".num-bars .num-row")) {
      const { facet, value } = row.dataset;
      const total = count(facet, value), now = S.scholars.filter((s) => s[facet] === value && shown.has(s.id)).length;
      row.querySelector(".num-track b").style.transform = `scaleX(${total ? now / total : 0})`;
      row.querySelector(".num-n").innerHTML = now === total ? `<b>${total}</b>` : `<b>${now}</b> of ${total}`;
      row.setAttribute("aria-pressed", String(latest[facet].includes(value)));
    }
    for (const row of root.querySelectorAll(".num-dotrow")) row.setAttribute("aria-pressed", String(latest.era.includes(row.dataset.value)));
    for (const dot of root.querySelectorAll("[data-id]")) dot.classList.toggle("num-off", !shown.has(dot.dataset.id));
    root.querySelector(".num-site").setAttribute("aria-pressed", String(latest.used));
  }
  window.addEventListener("scholars:filter", (event) => {
    if (!event.detail) return;
    latest = event.detail;
    paint();
  });

  Sections.numbers = { mount };
})();
