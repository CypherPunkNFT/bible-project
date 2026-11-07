// Section 02. Six readings on a rail. Each opens in a form of its own (a fork, three voices, one plot, a story turned, two accounts), then the three questions.
// All six are built once and only shown or hidden, so links survive the sheet and Back.
(() => {
  if (!window.RCK) return;
  const { h, art, refLink, page, sectionHead, runs, partView, roving, readings } = RCK;
  const { study, forms } = window.RC;
  const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
  const phrase = (item) => [h("span", { class: "rc-words" }, `“${item.t}”`), " ", h("span", { class: "rc-at" }, refLink(item.r, item.label))];
  const voiced = (item, tag = "div") => h(tag, { class: "rc-voiced" }, h("p", { class: "rc-small" }, item.voice), h("p", {}, phrase(item)));

  const FORM_VIEWS = {
    fork: (form) => [h("div", { class: "rc-fork" },
      art(RCArt.fork, "rc-fork-art"),
      h("div", { class: "rc-fork-end is-taken" }, voiced(form.taken)),
      h("div", { class: "rc-fork-end is-left" }, voiced(form.left))), voiced(form.under)],
    voices: (form) => [h("ol", { class: "rc-voices" }, form.voices.map((item) => voiced(item, "li")))],
    land: (form) => [h("div", { class: "rc-land" }, art(RCArt.land, "rc-land-art"), form.claims.map((item) => voiced(item)))],
    story: (form) => [h("div", { class: "rc-story" }, form.pairs.map(([told, turned]) => h("div", { class: "rc-story-row" }, voiced(told), h("span", { class: "rc-story-arrow", "aria-hidden": "true" }, "→"), voiced(turned)))), voiced(form.under)],
    accounts: (form) => [h("div", { class: "rc-accounts" },
      h("div", {}, h("p", { class: "rc-small" }, "2 Kings 21"), h("ol", {}, form.kings.map((item) => h("li", {}, phrase(item))))),
      h("div", {}, h("p", { class: "rc-small" }, "2 Chronicles 33"), h("ol", {}, form.chronicles.map((item) => h("li", {}, phrase(item))))))],
  };
  const questionsView = (form) => h("div", { class: "rc-three" }, [["Who says so", form.says], ["Who paid", form.paid], ["What came after", form.after]].map(([title, items]) =>
    h("section", {}, h("h4", {}, title), items.map((item) => voiced(item)))));

  const readingView = (reading) => {
    const form = forms[reading.slug];
    const head = h("h3", { tabindex: "-1" }, reading.title);
    const view = h("div", { class: "rc-reading", id: `reading-${reading.slug}`, role: "group", "aria-label": reading.title, hidden: RCK.state.reading !== reading.slug },
      h("p", { class: "rc-small" }, `${form.name} · ${form.ask}`),
      head,
      h("p", { class: "rc-hook" }, runs(reading.hook)),
      h("p", { class: "rc-read-these" }, "Read first: ", reading.read.map((link, index) => [index ? " · " : "", refLink(link.r, link.t)])),
      h("div", { class: `rc-form rc-form-${form.kind}` }, FORM_VIEWS[form.kind](form)),
      questionsView(form),
      h("div", { class: "rc-parts" }, reading.parts.map(partView)),
      h("div", { class: "rc-after" },
        h("div", {}, h("p", { class: "rc-small" }, "Consider · what the passage says"), h("p", {}, runs(reading.consider))),
        h("div", {}, h("p", { class: "rc-small" }, "Reflect · your response"), h("p", {}, runs(reading.reflect)))));
    return { view, head };
  };
  const panels = new Map(study.readings.map((reading) => [reading.slug, readingView(reading)]));
  const order = study.readings.map((reading) => reading.slug);
  const rail = new Map(study.readings.map((reading, index) => [reading.slug, h("button", { type: "button", class: "rc-rail-item", "aria-controls": `reading-${reading.slug}`, onclick: () => choose(reading.slug) },
    h("span", { class: "rc-rail-kind" }, `Reading ${ROMAN[index]} · ${index + 1} / ${order.length}`),
    art(RCArt[reading.slug], "rc-rail-art"),
    h("span", { class: "rc-rail-title" }, forms[reading.slug].name),
    h("span", { class: "rc-rail-ask" }, runs(reading.ask)),
    h("span", { class: "rc-rail-go", "data-go": "true" }, "Read →"))]));
  const panelArea = h("div", { class: "rc-panels" }, [...panels.values()].map((panel) => panel.view));

  function draw() {
    for (const [slug, panel] of panels) panel.view.hidden = slug !== RCK.state.reading;
    for (const [slug, button] of rail) {
      button.setAttribute("aria-pressed", String(slug === RCK.state.reading));
      button.querySelector("[data-go]").textContent = slug === RCK.state.reading ? "Viewing now" : "Read →";
    }
    markStop(rail.get(RCK.state.reading));
  }
  // A long reading can leave the reader far below where the next one starts, so bring its top into view, at once and with no animation.
  function choose(slug, focusHeading = false) {
    if (!readings.has(slug)) { console.error(`Rulers and their choices: unknown reading ${slug}`); return; }
    RCK.setView({ reading: slug });
    draw();
    const top = panelArea.getBoundingClientRect().top;
    if (top < 0 || focusHeading) scrollTo({ top: scrollY + top - 80, behavior: "instant" });
    if (focusHeading) panels.get(slug).head.focus({ preventScroll: true });
  }
  const markStop = roving([...rail.values()], () => rail.get(RCK.state.reading));
  RCK.syncers.push(draw);
  panels.forEach((panel, slug) => {
    const next = order[order.indexOf(slug) + 1];
    if (next) panel.view.append(h("button", { type: "button", class: "rc-action", onclick: () => choose(next, true) }, `Next reading: ${forms[next].name} →`));
  });
  page.append(h("section", { class: "t-sec rc-readings", id: "readings" },
    sectionHead("02", "Six readings,", "six kinds of choice", runs(study.readingsLead)),
    h("nav", { class: "rc-rail", "aria-label": "Six readings" }, [...rail.values()]),
    panelArea));
  draw();
})();
