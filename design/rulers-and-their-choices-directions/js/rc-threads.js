// Section 03, first half. Two accounts of one king: where they touch, both tell it; where they part, one does. The written stops carry it, and the line beside them only shows it.
(() => {
  if (!window.RCK) return;
  const { h, art, refLink, page, sectionHead, runs, roving, threadIds } = RCK;
  const { study, threads } = window.RC;
  const KIND_WORDS = { both: "Both tell it", first: "Only Samuel or Kings", second: "Only Chronicles" };
  const side = (phrase, which) => (phrase
    ? h("div", { class: `rc-side rc-side-${which}` }, h("p", { class: "rc-words" }, `“${phrase.t}”`), h("p", { class: "rc-at" }, refLink(phrase.r, phrase.label)))
    : h("div", { class: `rc-side rc-side-${which} is-empty`, "aria-hidden": "true" }));
  const stopView = (stop) => h("li", { class: `rc-stop is-${stop.kind}` },
    h("p", { class: "rc-stop-what" }, h("b", {}, stop.what), h("span", { class: "rc-small" }, KIND_WORDS[stop.kind])),
    side(stop.first, "first"),
    art(stop.kind === "both" ? RCArt.knot : RCArt[stop.kind], "rc-stop-line"),
    side(stop.second, "second"));
  const panels = new Map(threads.map((thread) => [thread.id, h("div", { class: "rc-thread-panel", id: `king-${thread.id}`, role: "group", "aria-label": thread.name, hidden: RCK.state.king !== thread.id },
    h("p", { class: "rc-thread-books" }, h("span", {}, thread.books.split(" · ")[0]), h("span", {}, thread.books.split(" · ")[1])),
    h("ol", { class: "rc-stops" }, thread.stops.map(stopView)))]));
  const switches = new Map(threads.map((thread) => [thread.id, h("button", { type: "button", class: "rc-king", "aria-controls": `king-${thread.id}`, onclick: () => choose(thread.id) }, thread.name)]));
  function draw() {
    for (const [id, panel] of panels) panel.hidden = id !== RCK.state.king;
    for (const [id, button] of switches) button.setAttribute("aria-pressed", String(id === RCK.state.king));
    markStop(switches.get(RCK.state.king));
  }
  function choose(id) {
    if (!threadIds.has(id)) { console.error(`Rulers and their choices: unknown king ${id}`); return; }
    RCK.setView({ king: id });
    draw();
  }
  const markStop = roving([...switches.values()], () => switches.get(RCK.state.king));
  RCK.syncers.push(draw);
  page.append(h("section", { class: "t-sec rc-beyond", id: "beyond" },
    sectionHead("03", "Beyond Kings,", "two accounts and three letters", runs(study.threadsLead)),
    h("nav", { class: "rc-kings", "aria-label": "Six kings in two accounts" }, [...switches.values()]),
    h("div", { class: "rc-thread-area" }, [...panels.values()]),
    h("p", { class: "rc-reads" }, runs(study.threadsReads)),
    h("p", { class: "rc-note" }, runs(study.threadsCare))));
  draw();
})();
