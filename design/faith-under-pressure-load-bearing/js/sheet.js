// The passage sheet: one, from the right, for every passage or pair of passages. Address-backed, so Back and a shared link work.
window.LBSheet = (({ h, pairIds, hasPassage, addressFor }) => {
  const { passages } = window.FP;
  const body = h("div", { class: "sheet-body" });
  const close = h("button", { type: "button", class: "sheet-close", "aria-label": "Close the passage", onclick: () => closeSheet() });
  close.innerHTML = icon("x", 18);
  const el = h("aside", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": "Passage in the Berean Standard Bible", tabindex: "-1" }, close, body);
  let opener = null;
  const background = () => [document.querySelector(".site-header"), document.getElementById("main"), document.querySelector(".site-footer")].filter(Boolean);

  function verseBlock(id) {
    const p = passages[id];
    let chapter = null;
    const text = h("p", { class: "sheet-text" });
    p.verses.forEach((v) => {
      if (v.c !== chapter) { chapter = v.c; if (p.chapters.length > 1) text.append(h("span", { class: "sheet-ch" }, `Chapter ${v.c}`)); }
      text.append(h("sup", {}, String(v.v)), `${v.t} `);
    });
    return [h("h3", {}, p.label), text, h("p", { class: "sheet-links" }, p.chapters.map((c) => h("a", { href: `/read/bsb/${p.code}/${c}` }, `Open ${p.label.replace(/ \d+:.*/, "")} ${c} in the reader →`)))];
  }
  function drawSheet(id) {
    const pair = pairIds.get(id);
    body.replaceChildren(
      h("p", { class: "sheet-kind" }, pair ? `Scripture · ${pair.sectionName} · ${pair.kind} in a letter` : "Scripture · Berean Standard Bible"),
      ...(pair ? [...verseBlock(pair.older), ...verseBlock(pair.letter)] : verseBlock(id)),
      h("p", { class: "note" }, "Berean Standard Bible, public domain. Courtesy credit: berean.bible."));
    body.scrollTop = 0;
  }
  function show(id) {
    drawSheet(id);
    el.classList.add("open");
    for (const part of background()) part.inert = true;
    close.focus({ preventScroll: true });
  }
  function hide() {
    el.classList.remove("open");
    for (const part of background()) part.inert = false;
    const heading = document.querySelector("h1");
    const target = opener?.isConnected ? opener : heading;
    if (target === heading) heading.tabIndex = -1;
    target?.focus({ preventScroll: true });
    opener = null;
  }
  function openSheet(id, from) {
    if (!hasPassage(id) && !pairIds.has(id)) { console.error(`Faith under pressure: unknown passage ${id}`); return; }
    opener = from ?? document.activeElement;
    LB.state = { ...LB.state, sheet: id };
    history.pushState(null, "", addressFor(LB.state));
    show(id);
  }
  function closeSheet() {
    if (!LB.state.sheet) return;
    LB.remember({ sheet: null });
    hide();
  }
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-sheet]");
    if (trigger) { event.preventDefault(); openSheet(trigger.dataset.sheet, trigger); return; }
    if (LB.state.sheet && !el.contains(event.target)) closeSheet();
  });
  return { el, show, hide, openSheet, closeSheet };
})(window.LB);
