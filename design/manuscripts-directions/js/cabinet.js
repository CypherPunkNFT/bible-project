// A · 01 The cabinet: the great witnesses as a quiet array of cases on three shelves (Hebrew, Greek, the early
// translations), oldest first on each. A case shows the open picture, or our drawing of the form where none is free;
// pointing at one names it on the line below, and choosing it opens the full record.
(() => {
  const { byId, byDate, booksText, holderText, sigla } = MSX;
  const SHELVES = [
    ["Hebrew Bible", "The scrolls and the Masoretic codices", ["Q1343736", "1Qisaa", "Q741305", "Q116790777", "Q637584", "Q4494220", "Q733492"]],
    ["Greek", "Papyri and the great parchment codices", ["Q1165472", "Q1513469", "Q666654", "Q1809813", "Q697885", "Q673569", "Q209285", "Q152962", "Q818305", "Q606424", "Q318233", "Q912605", "Q290500", "Q701032"]],
    ["Early translations", "Syriac, Latin, Gothic, Coptic, Ge'ez and Armenian", ["Q4010239", "Q2590442", "Q3682090", "Q129906", "Q776755", "Q1246486", "Q2567818", "Q5140212", "Q5523330", "Q5332637"]],
  ];
  const SHORT = { Q1165472: "Rylands Papyrus P52", Q116790777: "Codex Sassoon", Q5332637: "Etchmiadzin Gospels" };

  function caseHtml(r, n) {
    const im = r.im && MS.images[r.im], k = KIND[r.k];
    const art = im ? `<img src="${imgSrc(r.im)}" alt="" loading="lazy" width="${im.w}" height="${im.h}">` : `${Art.draw(r)}<em>drawing of the form</em>`;
    return `<button type="button" class="cab-case${im ? "" : " cab-drawn"}" data-open="${esc(r.i)}" data-say="${esc(r.i)}" style="--tone: var(${k.tone})">
      <span class="cab-art">${art}</span>
      <span class="cab-label"><i>No. ${String(n).padStart(2, "0")}${sigla(r) ? ` · ${esc(sigla(r))}` : ""}</i><b>${esc(SHORT[r.i] ?? r.n)}</b><small>${esc(r.d ?? r.f ?? "date not in the record")}</small></span></button>`;
  }

  function mount(section, { num }) {
    let n = 0;
    const shelves = SHELVES.map(([name, line, ids]) => {
      const list = ids.map((id) => byId.get(id)).filter((r) => r || console.error(`cabinet: a listed witness is missing from data.js (${ids})`)).sort(byDate);
      return { name, line, list };
    });
    const total = shelves.reduce((s, x) => s + x.list.length, 0);
    const pictured = shelves.reduce((s, x) => s + x.list.filter((r) => r.im).length, 0);
    section.innerHTML = `${head(num, "The cabinet", `${total} great witnesses, <em>case by case</em>`,
      `A shelf for each family, oldest first. ${pictured} cases hold an openly licensed picture; where none is free to use, our own drawing of the form stands in. Choose a case to open its record.`)}
      <div class="cab">${shelves.map((s) => `<div class="cab-shelf"><p class="cab-shelf-name"><b>${esc(s.name)}</b><span>${esc(s.line)}</span></p>
        <div class="cab-row">${s.list.map((r) => caseHtml(r, ++n)).join("")}</div></div>`).join("")}</div>
      <p class="ms-say cab-say" aria-live="polite"></p>`;
    const say = section.querySelector(".cab-say");
    const base = "Point at a case to read it here.";
    say.textContent = base;
    const show = (el) => {
      const r = el && byId.get(el.dataset.say);
      if (!r) { say.textContent = base; return; }
      const bits = [r.d ?? (r.f ? `found at ${r.f}` : "date not in the record"), booksText(r), holderText(r) || (r.src === "dss" ? "" : "holder not in the record")].filter(Boolean);
      say.innerHTML = `<b>${esc(r.n)}</b> · ${bits.map((b) => esc(b)).join(" · ")}`;
    };
    const cab = section.querySelector(".cab");
    cab.addEventListener("pointerover", (e) => show(e.target.closest("[data-say]")));
    cab.addEventListener("focusin", (e) => show(e.target.closest("[data-say]")));
    cab.addEventListener("pointerleave", () => show(null));
  }
  Sections.cabinet = { mount };
})();
