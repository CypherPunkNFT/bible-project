// Section 02. Six readings as cards in a grid with no sideways scroll, each opened in its own form below. All six are built once and only shown or hidden, so links survive the sheet and Back.
(() => {
  if (!window.SWK) return;
  const { h, refLink, page, sectionHead, runs, partView, roving, readings, accountIds, tallyLine } = SWK;
  const { study, forms, words } = window.SW;
  const order = [...readings.values()];
  const heldBy = (reading) => reading.accounts.map((id) => accountIds.get(id));

  const opening = (account) => h("div", { class: "sw-opening-line" },
    h("div", { class: "sw-band-mini" }, SWK.cordStill(account)),
    h("p", {}, h("button", { type: "button", class: "sw-mini-open", "data-account": account.id, onclick: (event) => SWK.openAccount(account.id, null, event.currentTarget) }, `${account.name} →`), ` ${account.label} · ${tallyLine(account)}`));

  const readingView = (reading, index) => {
    const form = forms[reading.slug];
    return h("div", { class: "sw-reading", id: `reading-${reading.slug}`, role: "group", "aria-label": reading.title, hidden: SWK.state.reading !== reading.slug },
      h("p", { class: "sw-small" }, `Reading ${index + 1} of ${order.length} · ${form.name}`),
      h("h3", { tabindex: "-1" }, reading.title),
      h("p", { class: "sw-hook" }, runs(reading.hook)),
      h("p", { class: "sw-read-line" }, "Read: ", reading.read.map((ref, i) => [i ? " · " : "", refLink(ref.r, ref.t)])),
      heldBy(reading).map(opening),
      SWK.FORMS[form.kind](form),
      h("div", { class: "sw-parts" }, reading.parts.map(partView)),
      h("div", { class: "sw-after" },
        h("section", {}, h("p", { class: "sw-small" }, "Look again"), h("p", {}, runs(reading.consider))),
        h("section", {}, h("p", { class: "sw-small" }, "You"), h("p", {}, runs(reading.reflect)))));
  };
  const views = new Map(order.map((reading, index) => [reading.slug, readingView(reading, index)]));
  const card = (reading, index) => h("button", { type: "button", class: "sw-card", "data-reading": reading.slug, "aria-pressed": "false", onclick: () => show(reading.slug) },
    h("span", { class: "sw-card-kind" }, `Reading · ${String(index + 1).padStart(2, "0")} / ${String(order.length).padStart(2, "0")}`),
    h("span", { class: "sw-card-title" }, reading.title),
    h("span", { class: "sw-card-ask" }, runs(reading.ask).map((part) => (typeof part === "string" ? part : part.textContent))),
    h("span", { class: "sw-card-held" }, heldBy(reading).map((account) => account.name).join(" · ")),
    h("span", { class: "sw-card-go" }, "Read it →"));
  const cards = order.map(card);
  roving(cards, () => cards.find((button) => button.dataset.reading === SWK.state.reading));
  function sync() {
    for (const button of cards) button.setAttribute("aria-pressed", String(button.dataset.reading === SWK.state.reading));
    for (const [slug, view] of views) view.hidden = slug !== SWK.state.reading;
  }
  function show(slug) {
    SWK.setView({ reading: slug });
    sync();
    views.get(slug).querySelector("h3").focus({ preventScroll: true });
  }
  SWK.syncers.push(sync);
  sync();

  page.append(h("section", { class: "t-sec sw-readings", id: "readings" },
    sectionHead("02", `${words.Readings} readings,`, "whole accounts", runs(study.readingsLead)),
    h("div", { class: "sw-cards", role: "group", "aria-label": "Choose a reading" }, cards),
    h("div", { class: "sw-reading-holder" }, [...views.values()])));
})();
