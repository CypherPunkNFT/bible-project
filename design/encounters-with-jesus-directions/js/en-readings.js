// Section 02. Seven groups on a rail, each opened in its own form, then the passage, this study's reading and the reader's part.
// All seven are built once and only shown or hidden, so links survive the sheet and Back.
(() => {
  if (!window.ENK) return;
  const { h, drawing, refLink, page, sectionHead, runs, partView, roving, readings } = ENK;
  const { study, forms, groupArt, meetings } = window.EN;
  const order = [...readings.values()];

  const readingView = (reading, index) => {
    const form = forms[reading.slug];
    const head = h("h3", { tabindex: "-1" }, reading.title);
    return h("div", { class: "en-reading", id: `reading-${reading.slug}`, role: "group", "aria-label": reading.title, hidden: ENK.state.reading !== reading.slug },
      h("p", { class: "en-small" }, `Group ${index + 1} of ${order.length} · ${form.name}`),
      head,
      h("p", { class: "en-hook" }, runs(reading.hook)),
      h("p", { class: "en-read-line" }, "Read: ", reading.read.map((ref, i) => [i ? " · " : "", refLink(ref.r, ref.t)])),
      ENK.FORMS[form.kind](form),
      h("div", { class: "en-parts" }, reading.parts.map(partView)),
      h("div", { class: "en-after" },
        h("section", {}, h("p", { class: "en-small" }, "Look again"), h("p", {}, runs(reading.consider))),
        h("section", {}, h("p", { class: "en-small" }, "You"), h("p", {}, runs(reading.reflect)))));
  };
  const views = new Map(order.map((reading, index) => [reading.slug, readingView(reading, index)]));
  const railButton = (reading, index) => {
    const held = meetings.filter((m) => m.group === reading.slug);
    return h("button", { type: "button", class: "en-rail-item", "data-reading": reading.slug, "aria-pressed": "false", onclick: () => show(reading.slug) },
      h("span", { class: "en-rail-kind" }, `Group · ${String(index + 1).padStart(2, "0")} / ${String(order.length).padStart(2, "0")}`),
      drawing(groupArt[reading.slug], "en-rail-art"),
      h("span", { class: "en-rail-title" }, reading.title),
      h("span", { class: "en-rail-ask" }, runs(reading.ask)),
      h("span", { class: "en-rail-parts" }, held.map((m) => m.name).join(" · ")),
      h("span", { class: "en-rail-go" }, "Read it →"));
  };
  const rail = order.map(railButton);
  roving(rail, () => rail.find((button) => button.dataset.reading === ENK.state.reading));
  function sync() {
    for (const button of rail) button.setAttribute("aria-pressed", String(button.dataset.reading === ENK.state.reading));
    for (const [slug, view] of views) view.hidden = slug !== ENK.state.reading;
  }
  function show(slug, focusHead = true) {
    ENK.setView({ reading: slug });
    sync();
    if (focusHead) views.get(slug).querySelector("h3").focus({ preventScroll: true });
  }
  ENK.syncers.push(sync);
  // From a meeting's record: leave the sheet first, then land on the group. Going Back through history would fire after this, so it waits for the sheet to go.
  ENK.showReading = (slug) => {
    const land = () => {
      ENK.setView({ reading: slug });
      sync();
      document.getElementById("readings").scrollIntoView({ block: "start" });
      views.get(slug).querySelector("h3").focus({ preventScroll: true });
    };
    const leave = () => { removeEventListener("popstate", leave); setTimeout(land, 0); };
    addEventListener("popstate", leave);
    document.querySelector(".ms-sheet-close").click();
    if (!document.querySelector(".en-sheet").classList.contains("open")) { removeEventListener("popstate", leave); land(); }
  };

  page.append(h("section", { class: "t-sec en-readings", id: "readings" },
    sectionHead("02", `${window.EN.words.Groups} groups,`, "read slowly", runs(study.readingsLead)),
    h("div", { class: "en-rail", role: "group", "aria-label": "Choose a group" }, rail),
    h("div", { class: "en-reading-holder" }, [...views.values()])));
  sync();
})();
