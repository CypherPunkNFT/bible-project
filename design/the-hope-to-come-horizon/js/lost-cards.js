// Section 03's cards drawn large, for the owner to judge on lost-cards.html: every row of what was lost, in the study's order,
// each twice the width of the cards on the page and stacked dark above, green below, read as a story: lost, promised, restored.
// The drawings are in lost-cards-art.js; the words are the study's data, except where redeemed-verses.js gives a row other
// Berean words (HP.lostEnds, HP.lostMiddle), each checked here against its verse. The face card has four versions, A to D.
(() => {
  const { bookends, passages } = HP;
  const said = (id, text, where) => {
    if (!passages[id]?.verses.some((verse) => verse.t.includes(text))) console.error(`The hope to come: "${text}" is not in ${passages[id]?.label ?? id}; check ${where} in redeemed-verses.js`);
  };
  const rows = bookends.map((entry) => {
    const ends = HP.lostEnds?.[entry.name];
    if (!ends) return entry;
    const row = { ...entry, ...ends };
    said(row.start, row.startText, "HP.lostEnds");
    said(row.last, row.lastText, "HP.lostEnds");
    return row;
  });
  const kindLabel = (entry) => (entry.kind === "shares" ? `Both verses say: ${entry.word}` : "This study's matching, and nothing more");
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
  const cell = (entry, art) => `<section class="lc-cell${art.wide ? " lc-cell-wide" : ""}" data-row="${entry.name}"><header><p>${art.line}</p></header>${card(entry, art)}</section>`;

  // The face card's version comes from ?face=a to d; the floating pill switches it in place.
  const FACE = "The face", faceArt = LOST_ART[FACE];
  const faceKeys = Object.keys(faceArt?.versions ?? {});
  let face = new URLSearchParams(location.search).get("face");
  if (!faceKeys.includes(face)) face = faceKeys[0];
  const artFor = (name) => (name === FACE && faceKeys.length ? { ...faceArt, ...faceArt.versions[face] } : LOST_ART[name]);

  document.getElementById("cards").innerHTML = rows.map((entry) => {
    const art = artFor(entry.name);
    if (!art) { console.error(`The hope to come: no drawing for the row "${entry.name}"; add one to lost-cards-art.js`); return ""; }
    return cell(entry, art);
  }).join("");

  // Each drawing keeps its detail on the right, behind no words; on a phone the card is too narrow for the whole width, so keep that side.
  // The full-width card's drawings are 1400 wide with the light at about 1000, so a phone centres on that instead.
  const narrow = matchMedia("(max-width: 560px)");
  const fit = () => document.querySelectorAll(".lc-art svg").forEach((drawing) => {
    const box = drawing.dataset.box ??= drawing.getAttribute("viewBox");
    const isWide = box.startsWith("0 0 1400");
    drawing.setAttribute("viewBox", narrow.matches && isWide ? "640 0 760 300" : box);
    drawing.setAttribute("preserveAspectRatio", narrow.matches && !isWide ? "xMaxYMid slice" : "xMidYMid slice");
  });
  fit();
  narrow.addEventListener("change", fit);

  if (faceKeys.length < 2) return;
  const pill = document.createElement("div");
  pill.className = "hz-pill";
  pill.setAttribute("aria-label", "Versions of the face card");
  const choose = (key) => {
    face = key;
    const entry = rows.find((row) => row.name === FACE), old = document.querySelector(`[data-row="${FACE}"]`);
    old.outerHTML = cell(entry, artFor(FACE));
    fit();
    pill.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.key === key)));
    const params = new URLSearchParams(location.search);
    params.set("face", key);
    history.replaceState(history.state, "", `?${params}`);
  };
  faceKeys.forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.key = key;
    button.textContent = key.toUpperCase();
    button.setAttribute("aria-pressed", String(key === face));
    button.addEventListener("click", () => { choose(key); document.querySelector(`[data-row="${FACE}"]`).scrollIntoView({ block: "center", behavior: "smooth" }); });
    pill.append(button);
  });
  document.body.append(pill);
})();
