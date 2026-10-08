// The hero (plain type, four quiet stats with their verses) and the three anointings (as the House of David drew them:
// three drops on one line, each with its passage, and what Chronicles tells).
(() => {
  window.sectionHead = (n, kicker, title, lead, id) => `<header class="sh"><span class="sh-n">${n}</span><div><p class="kicker">${kicker}</p><h2 id="${id}">${title}</h2>${lead ? `<p class="sh-lead">${lead}</p>` : ""}</div></header>`;

  window.Sections = {
    hero(root) {
      const P = DV.person, sam = DV.records.find((r) => r.book === "samuel"), kings = DV.records.find((r) => r.book === "kings");
      root.innerHTML = `
        <p class="crumbs"><a href="/study/people">${icon("arrowLeft", 14)}People</a><span>/</span><span>${esc(P.name)}</span><span>/</span><span>The reign</span></p>
        <div class="hero-in">
          <div class="hero-name">
            <p class="kicker">${icon("crown", 14)}${esc(P.title)} · ${esc(P.house)}</p>
            <h1 id="hero-h">${esc(P.name)}</h1>
            <p class="hero-line">${esc(P.tagline)}</p>
            <p class="hero-short">${esc(P.short)}</p>
          </div>
          <dl class="hero-stats">
            <div><dt>Age at accession</dt><dd>${sam.age.years}</dd><small>${refLink(sam.age.span)}</small></div>
            <div><dt>Reigned</dt><dd>${DV.reign.years} years</dd><small>7 years 6 months in Hebron · 33 in Jerusalem · ${refLink(DV.reign.refs[0])}</small></div>
            <div><dt>Capital</dt><dd>${esc(P.capital.name)}</dd><small>Hebron for the first seven and a half years · ${refList(P.capital.refs)}</small></div>
            <div><dt>Verdict</dt><dd>Right</dd><small>“${esc(kings.verdict.text.split(",")[0])} …”, save only in the matter of Uriah · ${refLink(kings.verdict.span)}</small></div>
          </dl>
        </div>`;
    },

    anointings(root) {
      const where = [["Bethlehem", "by Samuel", 0], ["Hebron", "by the men of Judah", 4], ["Hebron", "by the elders of Israel", 6]];
      root.innerHTML = `${sectionHead("01", `${icon("oil", 14)}Anointed three times`, "Three anointings", "Samuel's horn of oil, then Judah's, then all Israel's: the crown came to David three times.", "anointings-h")}
        <div class="oil-row">${where.map(([place, by, turn], i) => `<article class="oil-col">
          <div class="vial" style="--fill:${(i + 1) / 3}">${icon("drop", 38, 1.3)}<b>${i + 1}</b></div>
          <h3>${place}</h3><p class="oil-by">${by}</p>${claim(DV.accession[i])}
          <button type="button" class="on-map" data-go-turn="${turn}">${icon("map", 15)}Show on the map</button></article>`).join("")}</div>
        <div class="oil-notes">${claim(DV.accession[3])}${claim(DV.accession[4])}</div>`;
      root.addEventListener("click", (e) => { const b = e.target.closest("[data-go-turn]"); if (b) Land.goTurn(Number(b.dataset.goTurn)); });
    },
  };
})();
