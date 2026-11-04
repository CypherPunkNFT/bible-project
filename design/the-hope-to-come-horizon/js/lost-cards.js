// Section 03's cards drawn large, for the owner to judge on lost-cards.html: every row of what was lost, in the study's order,
// each twice the width of the cards on the page and stacked dark above, green below, read as a story: lost, promised, restored.
// The drawings are in lost-cards-art.js; the words are the study's data, except where redeemed-verses.js gives a row other
// Berean words (HP.lostEnds, HP.lostMiddle) or adds a card the study does not have (HP.lostAdded), each checked here against
// its verse. The owner took the face card out (2026-11-04): none of its four versions worked. Added cards that replace a weak
// study row (the river, the tree, the deceiver) stand in its place.
(() => {
  const { bookends, passages } = HP;
  const DROPPED = ["The face"];
  const said = (id, text, where) => {
    if (!passages[id]?.verses.some((verse) => verse.t.includes(text))) console.error(`The hope to come: "${text}" is not in ${passages[id]?.label ?? id}; check ${where} in redeemed-verses.js`);
  };
  const studyRows = bookends.filter((entry) => !DROPPED.includes(entry.name)).map((entry) => {
    const ends = HP.lostEnds?.[entry.name];
    if (!ends) return entry;
    const row = { ...entry, ...ends };
    said(row.start, row.startText, "HP.lostEnds");
    said(row.last, row.lastText, "HP.lostEnds");
    return row;
  });
  const addedRows = (HP.lostAdded ?? []).map((row) => {
    [[row.start, row.startText], [row.last, row.lastText], ...row.middle.map((item) => [item.r, item.t])].forEach(([id, text]) => said(id, text, "HP.lostAdded"));
    return row;
  });
  // An added card with "replaces" takes that study row's place; the rest follow the study's rows.
  const replacing = new Map(addedRows.filter((row) => row.replaces).map((row) => [row.replaces, row]));
  const rows = [...studyRows.map((entry) => replacing.get(entry.name) ?? entry), ...addedRows.filter((row) => !row.replaces)];
  const KIND = { shares: (entry) => `Both verses say: ${entry.word}`, page: () => "This page's matching, not the study's" };
  const kindLabel = (entry) => (KIND[entry.kind] ?? (() => "This study's matching, and nothing more"))(entry);
  const words = (tag, text, id) => `<div class="lc-words"><span class="lc-tag">${tag}</span><p class="lc-phrase">${text}</p><a class="lc-ref" href="./?sheet=${id}">${passages[id].label}</a></div>`;
  const prophets = (entry) => {
    if (entry.middle.length) return entry.middle;
    const added = HP.lostMiddle?.[entry.name] ?? [];
    added.forEach((item) => said(item.r, item.t, "HP.lostMiddle"));
    return added;
  };
  const seam = (middle) => (middle.length
    ? `<div class="lc-seam"><p class="lc-mid"><b class="lc-mid-tag">Promised</b>${middle.map((item) => `<span>${item.t}</span> <a class="lc-ref" href="./?sheet=${item.r}">${item.label}</a>`).join("<i aria-hidden=\"true\">·</i>")}</p></div>`
    : `<div class="lc-seam lc-seam-empty" aria-hidden="true"></div>`);
  const card = (entry, art) => `<article class="lc"><div class="lc-half lc-dark"><div class="lc-art">${art.lost()}</div><h3 class="lc-name">${entry.name}</h3>${words("Lost", entry.startText, entry.start)}</div>${seam(prophets(entry))}<div class="lc-half lc-light"><div class="lc-art">${art.found()}</div>${words("Restored", entry.lastText, entry.last)}<small class="lc-kind">${kindLabel(entry)}</small></div></article>`;
  const cell = (entry, art) => `<section class="lc-cell" data-row="${entry.name}"><header><p>${art.line}</p></header>${card(entry, art)}</section>`;

  document.getElementById("cards").innerHTML = rows.map((entry) => {
    const art = LOST_ART[entry.name];
    if (!art) { console.error(`The hope to come: no drawing for the row "${entry.name}"; add one to lost-cards-art.js`); return ""; }
    return cell(entry, art);
  }).join("");

  // Each drawing keeps its detail on the right, behind no words; on a phone the card is too narrow for the whole width, so keep that side.
  const narrow = matchMedia("(max-width: 560px)");
  const fit = () => document.querySelectorAll(".lc-art svg").forEach((drawing) => drawing.setAttribute("preserveAspectRatio", narrow.matches ? "xMaxYMid slice" : "xMidYMid slice"));
  fit();
  narrow.addEventListener("change", fit);
})();
