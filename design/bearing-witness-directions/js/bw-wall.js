// Section 01. Colossians 4:2-6 set large, its phrases opening doors in one continuous wall. One door is always open; its reading lies beneath.
(() => {
  if (!window.BWK) return;
  const { h, refLink, runs, plain, page, sectionHead, partView, roving, readings } = BWK;
  const { study, wall, passages } = window.BW;
  const order = study.readings.map((r) => r.slug);
  const phraseButtons = [], doorButtons = new Map();
  let drawn = null;

  const phraseButton = (piece) => {
    const button = h("button", { type: "button", class: "bw-phrase", "data-door": piece.m, onclick: () => goFromPhrase(piece.m) }, piece.t);
    phraseButtons.push(button);
    return button;
  };
  const paragraph = h("p", { class: "bw-para" }, wall.verses.flatMap((verse) => [
    h("sup", {}, String(verse.v)),
    "⁠", // the verse number stays with its first word
    verse.pieces.map((piece) => (piece.m ? phraseButton(piece) : piece.t)),
    " ",
  ]));
  const doorCard = (reading) => {
    const button = h("button", { type: "button", class: "bw-door", "aria-pressed": "false", onclick: () => goFromDoor(reading.slug) },
      h("span", { class: "bw-door-leaf", "aria-hidden": "true" }),
      h("span", { class: "bw-door-n" }, reading.n),
      h("span", { class: "bw-door-word" }, plain(reading.word)),
      h("span", { class: "bw-door-ask" }, plain(reading.ask)),
      h("span", { class: "bw-now" }, "Viewing now"));
    doorButtons.set(reading.slug, button);
    return h("li", {}, button);
  };
  const doors = h("ol", { class: "bw-wall" }, study.readings.map(doorCard));
  const band = h("article", { class: "bw-band", id: "reading", "aria-live": "polite" });

  const readList = (reading) => reading.read.flatMap((id, index) => [index ? " · " : "", refLink(id, passages[id].label)]);
  const neighbour = (slug, arrow) => {
    if (!slug) return h("span");
    const reading = readings.get(slug);
    return h("button", { type: "button", class: "bw-action", onclick: () => { show(slug, true); band.querySelector("h3").focus({ preventScroll: true }); band.scrollIntoView({ block: "start" }); } },
      arrow === "next" ? `${reading.n} ${reading.title} →` : `← ${reading.n} ${reading.title}`);
  };
  function drawReading(reading) {
    const index = order.indexOf(reading.slug);
    band.replaceChildren(
      h("header", { class: "bw-band-head" },
        h("p", { class: "bw-small" }, `Door ${reading.n} of ${String(order.length).padStart(2, "0")}`),
        h("h3", { tabindex: "-1" }, reading.title),
        h("p", { class: "bw-ask" }, runs(reading.ask)),
        h("p", { class: "bw-hook" }, runs(reading.hook)),
        h("p", { class: "bw-also" }, h("b", {}, "Read"), " ", readList(reading))),
      h("div", { class: "bw-band-body" },
        reading.parts.map(partView),
        h("div", { class: "bw-after" },
          h("div", {}, h("p", { class: "bw-small" }, "Look closely"), h("p", {}, runs(reading.look))),
          h("div", {}, h("p", { class: "bw-small" }, "Your response"), h("p", {}, runs(reading.response)))),
        h("nav", { class: "bw-neighbours", "aria-label": "Other doors" }, neighbour(order[index - 1], "previous"), neighbour(order[index + 1], "next"))));
  }
  function show(slug, keep) {
    if (keep) BWK.setView({ door: slug });
    if (drawn !== slug) { drawReading(readings.get(slug)); drawn = slug; } // Back must not throw away a reading the reader is part-way down
    for (const [id, button] of doorButtons) button.setAttribute("aria-pressed", String(id === slug));
    for (const button of phraseButtons) button.classList.toggle("is-current", button.dataset.door === slug);
    markDoor(doorButtons.get(slug));
  }
  function bringBandIntoView() {
    if (band.getBoundingClientRect().top > innerHeight * 0.7) band.scrollIntoView({ block: "start" });
  }
  function goFromDoor(slug) {
    show(slug, true);
    bringBandIntoView();
  }
  function goFromPhrase(slug) {
    show(slug, true);
    const door = doorButtons.get(slug);
    door.focus({ preventScroll: true });
    door.scrollIntoView({ block: "center" });
  }
  page.append(h("section", { class: "t-sec bw-map", id: "colossians" },
    sectionHead("01", "Five verses,", "and six doors in a wall", runs(study.wallLead)),
    h("figure", { class: "bw-para-wrap" }, paragraph, h("figcaption", {}, refLink(wall.r, wall.label), " · Berean Standard Bible. Each underlined phrase opens a door below.")),
    doors, band));
  roving(phraseButtons);
  const markDoor = roving([...doorButtons.values()], () => doorButtons.get(BWK.state.door));
  show(BWK.state.door, false);
  BWK.syncers.push(() => show(BWK.state.door, false));
})();
