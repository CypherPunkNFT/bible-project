// Section 03's cards drawn large, for the owner to judge on lost-cards.html: every row of what was lost, in the study's order,
// each twice the width of the cards on the page and stacked dark above, green below. The drawings are in lost-cards-art.js;
// the words are the study's data. The prophets between sit on a gold banner.
(() => {
  const { bookends, passages } = HP;
  const kindLabel = (entry) => (entry.kind === "shares" ? `Both verses say: ${entry.word}` : "This study's matching, and nothing more");
  const words = (tag, text, id) => `<div class="lc-words"><span class="lc-tag">${tag}</span><p class="lc-phrase">${text}</p><a class="lc-ref" href="./?sheet=${id}">${passages[id].label}</a></div>`;
  const seam = (entry) => (entry.middle.length
    ? `<div class="lc-seam"><p class="lc-mid">${entry.middle.map((item) => `<span>${item.t}</span> <a class="lc-ref" href="./?sheet=${item.r}">${item.label}</a>`).join("<i aria-hidden=\"true\">·</i>")}</p></div>`
    : `<div class="lc-seam lc-seam-empty"></div>`);
  const card = (entry, art) => `<article class="lc"><div class="lc-half lc-dark"><div class="lc-art">${art.lost()}</div><h3 class="lc-name">${entry.name}</h3>${words("Lost", entry.startText, entry.start)}</div>${seam(entry)}<div class="lc-half lc-light"><div class="lc-art">${art.found()}</div>${words("Revelation answers", entry.lastText, entry.last)}<small class="lc-kind">${kindLabel(entry)}</small></div></article>`;
  document.getElementById("cards").innerHTML = bookends.map((entry) => {
    const art = LOST_ART[entry.name];
    if (!art) { console.error(`The hope to come: no drawing for the row "${entry.name}"; add one to lost-cards-art.js`); return ""; }
    return `<section class="lc-cell${art.wide ? " lc-cell-wide" : ""}"><header><p>${art.line}</p></header>${card(entry, art)}</section>`;
  }).join("");
  // Each drawing keeps its detail on the right, behind no words; on a phone the card is too narrow for the whole width, so keep that side.
  const narrow = matchMedia("(max-width: 560px)");
  const fit = () => document.querySelectorAll(".lc-art svg").forEach((drawing) => drawing.setAttribute("preserveAspectRatio", narrow.matches ? "xMaxYMid slice" : "xMidYMid slice"));
  fit();
  narrow.addEventListener("change", fit);
})();
