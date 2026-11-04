// Section 03's cards drawn large, for the owner to judge on lost-cards.html: every row of what was lost, in the study's order,
// each twice the width of the cards on the page and stacked dark above, green below. The drawings are in lost-cards-art.js;
// the words are the study's data. The prophets between sit on a gold banner.
(() => {
  const { bookends, passages } = HP;
  const kindLabel = (entry) => (entry.kind === "shares" ? `Both verses say: ${entry.word}` : "This study's matching, and nothing more");
  const words = (tag, text, id) => `<div class="lc-words"><span class="lc-tag">${tag}</span><p class="lc-phrase">${text}</p><a class="lc-ref" href="./?sheet=${id}">${passages[id].label}</a></div>`;
  // The study leaves three rows with no prophet between; redeemed-verses.js gives them one (HP.lostMiddle), checked here.
  const prophets = (entry) => {
    const added = entry.middle.length ? [] : (HP.lostMiddle?.[entry.name] ?? []);
    for (const item of added) {
      if (!passages[item.r]?.verses.some((verse) => verse.t.includes(item.t))) console.error(`The hope to come: "${item.t}" is not in ${item.label}; check HP.lostMiddle in redeemed-verses.js`);
    }
    return entry.middle.length ? entry.middle : added;
  };
  const seam = (entry, middle = prophets(entry)) => (middle.length
    ? `<div class="lc-seam"><p class="lc-mid">${middle.map((item) => `<span>${item.t}</span> <a class="lc-ref" href="./?sheet=${item.r}">${item.label}</a>`).join("<i aria-hidden=\"true\">·</i>")}</p></div>`
    : `<div class="lc-seam lc-seam-empty" aria-hidden="true"></div>`);
  const card = (entry, art) => `<article class="lc"><div class="lc-half lc-dark"><div class="lc-art">${art.lost()}</div><h3 class="lc-name">${entry.name}</h3>${words("Lost", entry.startText, entry.start)}</div>${seam(entry)}<div class="lc-half lc-light"><div class="lc-art">${art.found()}</div>${words("Revelation answers", entry.lastText, entry.last)}<small class="lc-kind">${kindLabel(entry)}</small></div></article>`;
  document.getElementById("cards").innerHTML = bookends.map((entry) => {
    const art = LOST_ART[entry.name];
    if (!art) { console.error(`The hope to come: no drawing for the row "${entry.name}"; add one to lost-cards-art.js`); return ""; }
    return `<section class="lc-cell${art.wide ? " lc-cell-wide" : ""}"><header><p>${art.line}</p></header>${card(entry, art)}</section>`;
  }).join("");
  // Each drawing keeps its detail on the right, behind no words; on a phone the card is too narrow for the whole width, so keep that side.
  const narrow = matchMedia("(max-width: 560px)");
  // The full-width card's drawings are 1400 wide with the light at about 1000, so a phone centres on that instead.
  const fit = () => document.querySelectorAll(".lc-art svg").forEach((drawing) => {
    const wide = drawing.dataset.box ??= drawing.getAttribute("viewBox");
    const isWide = wide.startsWith("0 0 1400");
    drawing.setAttribute("viewBox", narrow.matches && isWide ? "640 0 760 300" : wide);
    drawing.setAttribute("preserveAspectRatio", narrow.matches && !isWide ? "xMaxYMid slice" : "xMidYMid slice");
  });
  fit();
  narrow.addEventListener("change", fit);
})();
