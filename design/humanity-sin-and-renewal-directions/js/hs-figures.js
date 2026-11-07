// 02 One body, two uses. 03 Romans 5 side by side, and how it reaches us. 04 The image thread, and what the image is.
(() => {
  if (!window.HSK) return;
  const { h, svg, art, refLink, runs, page, sectionHead, partView, imageStates } = HSK;
  const { body, leaves, leavesAlso, image, study } = window.HS;

  // ── 02 ── The same body in both states. Only the words change colour; the outline does not.
  const WORD_ORDER = ["understanding", "eyes", "lips", "mouth", "tongue", "throat", "feet"];
  const WORD_Y = { understanding: 24, eyes: 62, lips: 100, mouth: 138, tongue: 176, throat: 214, feet: 402 };
  const rowsById = new Map(body.rows.map((row) => [row.id, row]));
  const figureMarks = new Map();
  const bodyFigure = svg("svg", { class: "hs-body-art", viewBox: "0 0 400 430", "aria-hidden": "true" },
    svg("path", { class: "hs-body-outline", d: HSArt.outline, transform: "translate(0 4)" }),
    WORD_ORDER.map((id) => {
      const row = rowsById.get(id), wordY = WORD_Y[id];
      const group = svg("g", { class: "hs-body-mark" },
        svg("path", { class: "hs-leader", d: `M${row.x} ${row.y + 4}C${row.x + 50} ${row.y + 4} 190 ${wordY} 226 ${wordY}` }),
        svg("circle", { class: "hs-pin", cx: row.x, cy: row.y + 4, r: 3 }),
        (() => { const word = svg("text", { x: 232, y: wordY + 6 }); word.textContent = row.part; return word; })());
      figureMarks.set(id, group);
      return group;
    }));
  const bodyList = h("ol", { class: "hs-body-list" });
  const status = h("p", { class: "hs-live", "aria-live": "polite" });
  const NEW_TAGS = {
    same: "The same English word in the Berean. The pairing is this study's.",
    other: "A different word. The pairing is this study's.",
    none: "This study found no matching verse, and leaves it empty.",
  };
  function bodyRow(row, renewed) {
    if (!renewed) return h("li", {}, h("b", {}, row.part), h("span", { class: "hs-body-text" }, `“${row.sinText}”`, " ", refLink(row.sinR, row.sinLabel)),
      h("small", {}, "Paul draws on ", refLink(row.fromR, row.fromLabel), `: “${row.fromText}”`));
    if (row.newKind === "none") return h("li", { class: "hs-body-empty" }, h("b", {}, row.part), h("small", {}, NEW_TAGS.none));
    return h("li", {}, h("b", {}, row.part), h("span", { class: "hs-body-text" }, `“${row.newText}”`, " ", refLink(row.newR, row.newLabel)), h("small", {}, NEW_TAGS[row.newKind]));
  }
  function drawBody(announce = false) {
    const renewed = HSK.state.body === "renewed";
    bodyList.replaceChildren(...body.rows.map((row) => bodyRow(row, renewed)));
    for (const row of body.rows) figureMarks.get(row.id).classList.toggle("is-empty", renewed && row.newKind === "none");
    bodyFigure.classList.toggle("is-renewed", renewed);
    for (const radio of radios) radio.checked = radio.value === HSK.state.body;
    if (announce) status.textContent = renewed ? "Showing the same body presented to God." : "Showing the body as Paul lists it in Romans 3.";
  }
  const radios = ["sin", "renewed"].map((value) => h("input", { type: "radio", name: "hs-body", value, autocomplete: "off", onchange: () => { HSK.setView({ body: value }); drawBody(true); } }));
  HSK.syncers.push(() => drawBody());
  const anchor = body.anchor;
  page.append(h("section", { class: "t-sec hs-band", id: "body" },
    sectionHead("02", "One body,", "two uses", "From the throat on, Paul's list of what has gone wrong names parts of the body. Then he says the same parts can be handed over to someone else."),
    h("fieldset", { class: "hs-switch" },
      h("legend", {}, h("span", {}, refLink(anchor.r, anchor.label)), " says both. Choose one."),
      h("label", {}, radios[0], h("span", {}, `“${anchor.sin}”`)),
      h("label", {}, radios[1], h("span", {}, `“${anchor.renewed}”`))),
    status,
    h("div", { class: "hs-body" }, h("figure", {}, bodyFigure), bodyList),
    h("p", { class: "hs-note" }, "The same body is drawn in both. Only ", refLink(anchor.r, anchor.label), " joins the two uses. Every other pairing here is this study's matching, not Paul's, and “the same word” means the same word in the Berean's English. Paul's quotations are not always word for word, and his list opens with ", refLink("ROM.3.10", "Romans 3:10"), ", which is close to ", refLink("ECC.7.20", "Ecclesiastes 7:20"), ".")));
  drawBody();

  // ── 03 ── Romans 5 as Paul wrote it: two sides and the word between them.
  const leafRow = (row) => h("div", { class: `hs-leaf-row${row.step ? " is-step" : ""}` },
    h("p", { class: "hs-leaf-left" }, row.left),
    h("p", { class: "hs-hinge" }, h("em", {}, row.hinge), refLink(row.r, row.label)),
    h("p", { class: "hs-leaf-right" }, row.right));
  const voicesView = (view) => h("div", { class: "hs-voices" },
    h("h3", {}, view.title, " ", h("em", {}, view.turn)),
    h("p", { class: "hs-reads" }, runs(view.lead)),
    h("div", { class: "hs-voices-parts" }, view.parts.map(partView)));
  page.append(h("section", { class: "t-sec", id: "one-man" },
    sectionHead("03", "One man,", "One Man", "Paul lays Adam and Christ side by side, row by row. These are his own words in his own order, and the word between them is his too."),
    h("div", { class: "hs-leaves" },
      h("div", { class: "hs-leaf-row hs-leaf-head", "aria-hidden": "true" }, h("p", {}, "Through Adam"), h("p", {}), h("p", {}, "Through Christ")),
      leaves.map(leafRow)),
    h("p", { class: "hs-note" }, "Larger type on the right marks only the rows where Paul says the two are not equal. It is one fixed step, and not a ratio."),
    h("p", { class: "hs-small hs-leaves-also" }, "The same pairing, to the Corinthians"),
    h("div", { class: "hs-leaves" }, leavesAlso.map(leafRow)),
    voicesView(study.views.reach)));

  // ── 04 ── The image thread. The drawing has the same outline and the same ring in every stage, and shows no amount of anything.
  const stateButtons = new Map();
  const stateHolder = h("div", { class: "hs-state", "aria-live": "polite" });
  function drawState() {
    const state = imageStates.get(HSK.state.state);
    for (const [id, button] of stateButtons) button.setAttribute("aria-pressed", String(id === state.id));
    stateHolder.replaceChildren(
      h("h3", {}, state.title),
      h("p", { class: "hs-reads" }, state.line),
      h("ul", { class: "hs-places" }, state.places.map((place) => h("li", {}, h("span", {}, `“${place.text}”`), " ", refLink(place.r, place.label)))),
      h("p", { class: "hs-note" }, `In the small drawing: ${state.markText}.`));
  }
  HSK.syncers.push(drawState);
  const thread = h("div", { class: "hs-thread" }, image.map((state) => {
    const button = h("button", { type: "button", class: "hs-thread-step", "aria-pressed": "false", onclick: () => { HSK.setView({ state: state.id }); drawState(); } },
      art(HSArt.small(state.mark)), h("span", {}, state.title));
    stateButtons.set(state.id, button);
    return button;
  }));
  page.append(h("section", { class: "t-sec", id: "image" },
    sectionHead("04", "Not yet seen,", "but we see Jesus", "Follow one word through Scripture. The people God made bear His image, hand on a likeness, still bear it after the fall, trade His glory away, and do not yet see what was promised. Then the Son, who is the image, and the ones being renewed into it."),
    thread,
    stateHolder,
    h("p", { class: "hs-note" }, "This thread is this page's arrangement of the verses, and no verse sets it out. The drawing keeps the same outline in every stage and shows no amount of anything: only the named mark changes."),
    voicesView(study.views.image)));
  drawState();
})();
