// Section 02, the signature figure: a doorway with God on the lintel, the one who speaks on the near side and the other person beyond,
// and ten passages along the sill. Pointing lights a passage for a moment; choosing keeps it in the address. Below 700px it stacks.
(() => {
  if (!window.BWK) return;
  const { h, art, refLink, runs, page, sectionHead, roving, rows } = BWK;
  const { study, threshold } = window.BW;
  const PLACES = [
    ["god", "God", "above the door"],
    ["speaker", "The one who speaks", "this side of the door"],
    ["other", "The one before them", "beyond the door"],
  ];
  const cells = new Map(PLACES.map(([place]) => [place, h("div", { class: "bw-place-list" })]));
  const nowShowing = h("p", { class: "bw-small bw-showing" });
  const status = h("p", { class: "bw-hidden", role: "status" });
  const sillButtons = threshold.map((row) => h("button", { type: "button", class: "bw-sill-name", "aria-pressed": "false", "data-row": row.id, onclick: () => choose(row.id) }, row.name));

  const placeView = ([place, title, where]) => h("div", { class: `bw-place bw-place-${place}` },
    h("p", { class: "bw-place-title" }, title, " ", h("span", {}, where)), cells.get(place));
  const phraseView = (entry) => h("li", {},
    h("a", { class: "bw-said", href: `?sheet=${entry.r}`, "data-sheet": entry.r, title: entry.label }, entry.words),
    entry.flag ? h("span", { class: "bw-asked" }, entry.flag) : null);
  let drawnRow = null; // a redraw of the same passage would lose the phrase that focus must return to
  function drawRow(row) {
    if (drawnRow === row.id) return;
    drawnRow = row.id;
    for (const [place, cell] of cells) {
      cell.replaceChildren(row[place].length ? h("ul", {}, row[place].map(phraseView)) : h("p", { class: "bw-empty" }, "not named"));
    }
    nowShowing.replaceChildren("Showing ", refLink(row.r, row.label));
  }
  function choose(id) {
    BWK.setView({ row: id });
    mark();
    status.textContent = `Showing ${rows.get(id).label}`;
  }
  function mark() {
    drawRow(rows.get(BWK.state.row));
    for (const button of sillButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.row === BWK.state.row));
      button.classList.remove("is-pointed");
    }
  }
  let pointing = false; // a redraw while nothing is pointed at would remove the phrase being clicked
  function stopPointing() {
    if (pointing) { pointing = false; mark(); }
  }
  function point(button) {
    pointing = true;
    drawRow(rows.get(button.dataset.row));
    for (const other of sillButtons) other.classList.toggle("is-pointed", other === button);
  }
  for (const button of sillButtons) {
    button.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") point(button); });
    button.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") stopPointing(); });
    button.addEventListener("focus", () => { if (button.matches(":focus-visible")) point(button); });
    button.addEventListener("blur", stopPointing);
  }
  page.append(h("section", { class: "t-sec bw-threshold-sec", id: "threshold" },
    sectionHead("02", "The threshold:", "whose part is whose?", runs(study.thresholdLead)),
    h("div", { class: "bw-threshold" },
      placeView(PLACES[0]), placeView(PLACES[1]),
      art(BWArt.doorway, "bw-doorway"),
      placeView(PLACES[2]),
      h("div", { class: "bw-sill", role: "group", "aria-label": "Ten passages" }, sillButtons)),
    nowShowing, status,
    h("p", { class: "bw-reads" }, runs(study.thresholdReads)),
    h("p", { class: "bw-note" }, runs(study.thresholdLimit)),
    h("p", { class: "bw-note" }, "The drawing shows places, not distance or rank. A phrase’s place is this study’s sort.")));
  roving(sillButtons, () => sillButtons.find((button) => button.dataset.row === BWK.state.row));
  mark();
  BWK.syncers.push(mark);
})();
