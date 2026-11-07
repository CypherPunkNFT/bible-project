// Section 04. Six phrases in two verses of 1 Peter. Choose one to see the older verse beside it and how close the wording is.
(() => {
  if (!window.CCK) return;
  const { h, refLink, page, sectionHead, runs, roving, nameIds } = CCK;
  const { study, names } = window.CC;
  const panel = h("div", { class: "cc-name-panel", id: "cc-name-panel" });
  const buttons = new Map(names.map((item) => [item.id, h("button", { type: "button", class: "cc-name", "aria-controls": "cc-name-panel", onclick: () => choose(item.id) }, item.name.t)]));
  function draw() {
    const item = nameIds.get(CCK.state.name);
    for (const [id, button] of buttons) button.setAttribute("aria-pressed", String(id === item.id));
    markStop(buttons.get(item.id));
    panel.replaceChildren(
      h("div", {}, h("p", { class: "cc-small" }, "Peter says"), h("p", { class: "cc-name-now" }, "“", item.name.t, "”"), h("p", { class: "cc-side-ref" }, refLink(item.name.r, item.name.label))),
      h("p", { class: "cc-how" }, item.how),
      h("div", {}, h("p", { class: "cc-small" }, "An older verse"), h("p", { class: "cc-name-then" }, item.oldVerse), h("p", { class: "cc-side-ref" }, refLink(item.old.r, item.old.label)), h("p", { class: "cc-name-said" }, item.said)));
  }
  function choose(id) {
    CCK.setView({ name: id });
    draw();
  }
  const markStop = roving([...buttons.values()], () => buttons.get(CCK.state.name));
  CCK.syncers.push(draw);
  page.append(h("section", { class: "t-sec cc-names", id: "names" },
    sectionHead("04", "Six phrases,", "all of them older", runs(study.namesLead)),
    h("div", { class: "cc-name-list", role: "group", "aria-label": "Six phrases" }, [...buttons.values()]),
    panel,
    h("p", { class: "cc-reads" }, runs(study.namesReads)),
    h("div", { class: "cc-flag cc-flag-care" }, h("p", { class: "cc-flag-label" }, "Care"), h("p", {}, runs(study.namesCare)))));
  draw();
})();
