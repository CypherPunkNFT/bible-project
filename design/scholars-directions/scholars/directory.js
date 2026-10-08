// 07 · All the scholars (A "Foundations" directory as the base): a compact list in three columns. Each row gives years,
// faith and field, and a mark when the site uses their work (filled: a live feature; ring: in the library, planned).
// A small two-way switch re-groups the SAME rows by era or by the first letter of the surname (D's A-to-Z grouping):
// rows glide to their new places (transforms only) and the list's height eases, so nothing on the page jumps.
// Every row opens the shared profile.
window.Sections = window.Sections || {};
(() => {
  const D = window.SCHOLARS;
  if (!D || !Array.isArray(D.scholars)) throw new Error("All the scholars: window.SCHOLARS is missing (expected ../shared/scholars-data.js to load first)");
  const FIELD_TONE = { history: "--history", texts: "--prophets", places: "--poetry", reference: "--epistles", theology: "--gospels" };
  const MARK = { "in-use": "Used by a live feature", held: "In the library, planned" };
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const years = (s) => `${s.circa ? "c. " : ""}${s.born}–${s.died}`;
  const faith = (s) => D.faiths[s.faith] || D.faiths.unrecorded;
  const surname = (s) => s.short.split(" ").at(-1);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(.16, 1, .3, 1)", MOVE_MS = 600;

  // The two groupings of the same people: by era (birth order inside each), and by surname letter (A to Z).
  const eraGroups = Object.entries(D.eras).map(([key, label]) => ({ key, label, people: D.scholars.filter((s) => s.era === key) })).filter((g) => g.people.length);
  const byName = [...D.scholars].sort((a, b) => surname(a).localeCompare(surname(b)) || a.name.localeCompare(b.name));
  const letterGroups = [];
  for (const s of byName) {
    const key = surname(s)[0].toUpperCase();
    if (letterGroups.at(-1)?.key !== key) letterGroups.push({ key, people: [] });
    letterGroups.at(-1).people.push(s);
  }
  const SETS = { era: eraGroups, az: letterGroups };

  const rowHtml = (s) => {
    const st = s.site ? s.site.status : null;
    return `<li data-id="${s.id}"><button type="button" data-scholar="${s.id}" style="--tone: var(${FIELD_TONE[s.field] || "--accent"})">
      <i class="dir-dot" aria-hidden="true"></i><span class="dir-nm">${esc(s.name)}</span><span class="dir-yr">${esc(years(s))}</span>
      <span class="dir-meta">${esc(faith(s))} · ${esc(D.fields[s.field])}</span>
      ${st ? `<span class="dir-use dir-use-${st} dir-mark" title="${MARK[st]}" aria-label="${MARK[st]}"></span>` : `<span class="dir-mark" aria-hidden="true"></span>`}</button></li>`;
  };
  const groupsHtml = () => [
    ...eraGroups.map((g) => `<div class="dir-group dir-group-era" data-set="era"><h3 class="dir-gh">${esc(g.label)}<span>${g.people.length}</span></h3><ul data-key="${g.key}"></ul></div>`),
    ...letterGroups.map((g) => `<div class="dir-group dir-group-az" data-set="az" hidden><span class="dir-gh dir-letter">${esc(g.key)}</span><ul data-key="${g.key}"></ul></div>`),
  ].join("");

  // Puts every row into the groups of `mode` and shows only those groups.
  function place(list, rows, mode) {
    list.querySelectorAll(".dir-group").forEach((g) => { g.hidden = g.dataset.set !== mode; });
    for (const g of SETS[mode]) {
      const ul = list.querySelector(`.dir-group[data-set="${mode}"] ul[data-key="${g.key}"]`);
      g.people.forEach((s) => ul.append(rows.get(s.id)));
    }
  }

  // Re-groups with motion: rows slide from where they were (FLIP), new group headings fade in, and the frame around
  // the columns eases to its new height (the columns themselves are never squeezed, so their layout stays exact).
  function regroup(frame, list, rows, mode) {
    if (reduced()) { place(list, rows, mode); return; }
    const before = new Map([...rows].map(([id, li]) => [id, li.getBoundingClientRect()]));
    const fromHeight = frame.offsetHeight;
    place(list, rows, mode);
    const toHeight = list.offsetHeight;
    for (const [id, li] of rows) {
      const a = before.get(id), b = li.getBoundingClientRect();
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) continue;
      li.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: MOVE_MS, easing: EASE });
    }
    list.querySelectorAll(`.dir-group[data-set="${mode}"] .dir-gh`).forEach((head) => {
      head.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: 180, easing: "ease-out", fill: "backwards" });
    });
    if (fromHeight !== toHeight) {
      frame.getAnimations().forEach((a) => a.cancel());
      frame.animate([{ height: `${fromHeight}px` }, { height: `${toHeight}px` }], { duration: MOVE_MS, easing: EASE });
    }
  }

  function mount(section) {
    section.innerHTML = `<header class="s-head"><p class="kicker"><span class="s-num">07</span>Directory</p>
        <h2>All ${D.scholars.length} <em>scholars</em></h2>
        <p>By era or from A to Z, with years, faith and field. Click any name for the full profile.</p></header>
      <div class="dir-tools">
        <ul class="dir-key"><li><span class="dir-use dir-use-in-use"></span>A live feature on this site uses their work</li><li><span class="dir-use dir-use-held"></span>Their book is in the library, planned</li></ul>
        <div class="dir-mode" role="group" aria-label="Group the list" data-mode="era"><i class="dir-thumb" aria-hidden="true"></i>
          <button type="button" data-mode="era" aria-pressed="true">By era</button><button type="button" data-mode="az" aria-pressed="false">A to Z</button></div>
      </div>
      <div class="dir-frame"><div class="dir-list">${groupsHtml()}</div></div>`;
    const frame = section.querySelector(".dir-frame"), list = section.querySelector(".dir-list"), toggle = section.querySelector(".dir-mode");
    const holder = document.createElement("ul");
    holder.innerHTML = D.scholars.map(rowHtml).join("");
    const rows = new Map([...holder.children].map((li) => [li.dataset.id, li]));
    place(list, rows, "era");

    toggle.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-mode]");
      if (!btn || btn.getAttribute("aria-pressed") === "true") return;
      toggle.dataset.mode = btn.dataset.mode;
      toggle.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      regroup(frame, list, rows, btn.dataset.mode);
    });
    list.addEventListener("click", (event) => {
      const hit = event.target.closest("[data-scholar]");
      if (hit) window.Scholars?.openProfile?.(hit.dataset.scholar, hit);
    });
  }

  window.Sections.directory = { mount };
})();
