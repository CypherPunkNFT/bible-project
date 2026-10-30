// Section 02: all 76 verses as one built wall, the study's marked phrases cut into the stones. Section 03: the footings, each
// letter's line set on the older Scripture it quotes or retells, above and below one ground line.
window.LBWall = (({ h, refLink, remember, KIND, narrow }) => {
  const { study, strips, calls, pairs, passages, numbers } = window.FP;
  const stoneShape = (seed) => {
    const n = (i) => 6 + ((seed * 7 + i * 13) % 17);
    return `border-radius:${n(1)}px ${n(2)}px ${n(3)}px ${n(4)}px / ${n(5)}px ${n(6)}px ${n(7)}px ${n(8)}px`;
  };
  // Consecutive marked phrases of one kind sit on one face of the stone; a stone holding two kinds is split between them.
  function faces(cell) {
    const list = [];
    for (const seg of cell.segs.filter((part) => part.k.length)) {
      const key = seg.k.join("");
      if (list.at(-1)?.key === key) list.at(-1).text.push(seg.t); else list.push({ key, kinds: seg.k, text: [seg.t] });
    }
    return list;
  }

  function verses() {
    const allCells = strips.flatMap((strip) => strip.cells);
    const readout = h("div", { class: "inscription", "aria-live": "polite" });
    const stones = [];
    function show(cell, announce) {
      readout.setAttribute("aria-live", announce ? "polite" : "off");
      const kinds = cell.kinds.map((k) => KIND[k]).join(" · ") || "Not marked by this study";
      readout.replaceChildren(
        h("p", { class: "inscription-text" }, cell.segs.map((seg) => (seg.k.length ? h("mark", { class: seg.k.map((k) => `m-${k}`).join(" ") }, seg.t) : seg.t))),
        h("p", { class: "inscription-meta" }, h("span", {}, kinds), " · ", refLink(cell.r, `Open ${cell.label} →`)));
    }
    function mark(button) {
      for (const other of stones) { other.classList.toggle("is-on", other === button); other.tabIndex = other === button ? 0 : -1; }
      if (narrow.matches) button.closest(".course").after(readout);
      else if (readout.nextElementSibling !== wallEl) wallEl.before(readout);
    }
    let lastPointer = "mouse";
    addEventListener("pointerdown", (event) => { lastPointer = event.pointerType; }, { capture: true });
    function stone(cell, index) {
      const list = faces(cell);
      const said = cell.kinds.map((k) => KIND[k]).join(", ");
      const button = h("button", {
        type: "button", class: `stone-btn${list.length ? "" : " is-plain"}`, tabindex: "-1", style: `${stoneShape(index + 3)};flex-grow:${list.length ? list.flatMap((face) => face.text).join(" ").length + 8 : 3}`,
        "data-kinds": cell.kinds.join(""), "aria-label": `${cell.label}${said ? `: ${said}` : ""}`,
      }, h("span", { class: "stone-v", "aria-hidden": "true" }, String(cell.v)),
      list.map((face) => h("span", { class: `face ${face.kinds.map((k) => `f-${k}`).join(" ")}${list.some((other) => other.kinds.length > 1) && face.kinds.includes("C") ? " is-nested" : ""}`, "aria-hidden": "true" }, face.text.join(" … "))));
      button.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") { show(cell, false); mark(button); } });
      button.addEventListener("focus", () => { show(cell, true); mark(button); });
      button.addEventListener("click", (event) => {
        event.stopPropagation(); // the page's click-outside rule must not close the sheet this opens
        show(cell, true); mark(button);
        if (event.detail > 0 && lastPointer === "touch") return; // on touch, a tap shows the verse, whose link opens it
        LBSheet.openSheet(cell.r, button);
      });
      stones.push(button);
      return button;
    }
    let counter = 0;
    const courses = study.readings.map((reading) => h("div", { class: "course" },
      h("div", { class: "course-name" }, h("span", {}, reading.title), h("small", {}, "the call: ", refLink(calls[reading.slug].r, calls[reading.slug].word))),
      h("div", { class: "course-stones" }, strips.filter((strip) => strip.place === reading.slug).map((strip) => h("div", { class: "stretch" },
        h("span", { class: "stretch-label" }, refLink(strip.p, strip.label)),
        h("div", { class: "stretch-stones" }, strip.cells.map((cell) => { counter += 1; return stone(cell, counter); })))))));
    const firstOfCourse = courses.map((course) => stones.indexOf(course.querySelector(".stone-btn")));
    const wallEl = h("div", {
      class: "wall", role: "group", "aria-label": "Every verse of the six readings. Arrow keys move between verses, up and down move between readings, Enter opens the verse.",
      onkeydown: (event) => {
        const at = stones.indexOf(document.activeElement);
        if (at < 0) return;
        const course = firstOfCourse.findLastIndex((first) => first <= at);
        const jump = (delta) => firstOfCourse[(course + delta + courses.length) % courses.length];
        const target = { ArrowRight: at + 1, ArrowLeft: at - 1, ArrowDown: jump(1), ArrowUp: jump(-1), Home: 0, End: stones.length - 1 }[event.key];
        if (target === undefined) return;
        event.preventDefault();
        stones[(target + stones.length) % stones.length].focus();
      },
    }, courses);
    stones[0].tabIndex = 0;
    show(allCells[0], false);

    const callWords = h("div", { class: "calls" }, study.readings.map((reading) => h("div", { class: "call" },
      h("span", { class: "call-name" }, reading.title),
      h("b", { class: "call-word" }, calls[reading.slug].word),
      refLink(calls[reading.slug].r, calls[reading.slug].label))));
    const count = (k) => allCells.filter((cell) => cell.kinds.includes(k)).length;
    const filterButtons = [["all", "All", numbers.verses], ["P", KIND.P, count("P")], ["C", KIND.C, count("C")], ["G", KIND.G, count("G")]].map(([id, text, n]) => h("button", {
      type: "button", class: `filter f-${id}`, "aria-pressed": String(id === LB.state.only), "data-only": id,
      onclick: () => { remember({ only: id }); sync(); },
    }, h("i", { "aria-hidden": "true" }), text, " ", h("b", {}, String(n))));
    const filters = h("div", { class: "filters", role: "group", "aria-label": "Show the marks" }, filterButtons);
    const viewButtons = [["verses", "Every verse"], ["calls", "The six calls"]].map(([id, text]) => h("button", {
      type: "button", "aria-pressed": String(id === LB.state.view), "data-view": id,
      onclick: () => { remember({ view: id }); sync(); },
    }, text));
    function sync() {
      const { only, view } = LB.state;
      wallEl.dataset.only = only;
      for (const button of filterButtons) button.setAttribute("aria-pressed", String(button.dataset.only === only));
      for (const button of viewButtons) button.setAttribute("aria-pressed", String(button.dataset.view === view));
      wallEl.hidden = view !== "verses";
      readout.hidden = view !== "verses";
      filters.hidden = view !== "verses";
      callWords.hidden = view !== "calls";
    }
    const section = h("section", { class: "stratum", id: "ground" },
      h("header", { class: "s-head" }, h("span", { class: "s-num", "aria-hidden": "true" }, "02 / 03"),
        h("h2", {}, "Name the pressure. ", h("em", {}, "Find the ground.")),
        h("p", {}, "Does a passage hurry past the difficulty, or name it? Does it tell everyone to do the same thing? Here is every verse of the six readings, one mark to a phrase. Point at a verse to read it here; choose it to open the verse."),
        h("p", { class: "s-reads" }, `All six readings name a pressure, give a call and state a ground, and the call is never the same twice. In ${numbers.passages} passages only Romans 5:1–5 gives no command at all: there Paul simply says what is true.`)),
      h("ol", { class: "questions" }, [["P", "What kind of pressure is this?"], ["C", "What does this passage call for?"], ["G", "What ground does it stand on?"], ["N", "What does it not promise?"]].map(([k, text]) => h("li", { class: `q-${k}` }, text))),
      h("div", { class: "wall-controls" }, filters, h("div", { class: "lens-switch", role: "group", "aria-label": "How to see the verses" }, viewButtons)),
      readout, wallEl, callWords,
      h("p", { class: "note" }, `This is a hand-picked selection: ${numbers.marks} phrases in ${numbers.marked} of the ${numbers.verses} verses, and sorting them into three kinds is this site's reading of each sentence. It is a way of noticing, not a count of the letters. An unmarked verse is not a less important verse.`));
    return { section, sync };
  }

  function footings() {
    const readout = h("div", { class: "inscription inscription-pair", "aria-live": "polite" });
    function show(pair, announce) {
      readout.setAttribute("aria-live", announce ? "polite" : "off");
      const text = (id) => passages[id].verses.map((v) => v.t).join(" ");
      readout.replaceChildren(
        h("div", {}, h("span", { class: "pair-head" }, pair.olderLabel), h("p", {}, text(pair.older))),
        h("div", {}, h("span", { class: "pair-head" }, `${pair.letterLabel} · ${pair.kind}`), h("p", {}, text(pair.letter))));
    }
    const describe = (pair) => `${pair.olderLabel}, ${pair.sectionName}, ${pair.kind} in ${pair.letterLabel}. Open both.`;
    const watch = (button, pair) => {
      button.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") show(pair, false); });
      button.addEventListener("focus", () => show(pair, true));
      return button;
    };
    const footing = (pair, index) => watch(h("button", { type: "button", class: `footing sec-${pair.section}${pair.kind === "retold" ? " is-retold" : ""}`, "data-sheet": pair.id, "aria-label": describe(pair) },
      h("span", { class: "foot-letter", style: stoneShape(index + 11) }, pair.letterLabel),
      h("span", { class: "foot-joint", "aria-hidden": "true" }),
      h("span", { class: "foot-older", style: stoneShape(index + 29) }, h("b", {}, pair.olderLabel), h("small", {}, pair.sectionName))), pair);
    const letters = [...new Set(pairs.map((pair) => pair.letter.split(".")[0]))];
    const drawing = h("div", { class: "footings" }, letters.map((code) => {
      const group = pairs.filter((pair) => pair.letter.startsWith(`${code}.`));
      // A column is as wide as the longest word it must hold, so "Deuteronomy" never runs into its neighbour.
      const longest = Math.max(...group.flatMap((pair) => `${pair.olderLabel} ${pair.letterLabel}`.split(" ")).map((word) => word.length));
      const column = (longest * 0.46 + 1.6).toFixed(2);
      return h("div", { class: "footing-group", style: `--column:${column}rem;flex:${group.length} 1 ${(group.length * column).toFixed(2)}rem` }, group.map((pair) => footing(pair, pairs.indexOf(pair))));
    }));
    const key = h("p", { class: "footing-key" }, h("span", {}, h("i"), "Quoted, with quotation marks in the Berean"), h("span", {}, h("i", { class: "is-dashed" }), "Retold, in Paul's own words"));
    const row = (pair) => watch(h("button", { type: "button", class: "older-row", "data-sheet": pair.id, "aria-label": describe(pair) }, h("b", {}, pair.olderLabel), h("small", {}, pair.sectionName), h("span", {}, pair.letterLabel)), pair);
    const group = (kind, title) => [h("h3", { class: "older-title" }, title), h("div", {}, pairs.filter((pair) => pair.kind === kind).map(row))];
    const list = h("div", { class: "older-list" }, group("quoted", "Quoted, with quotation marks in the Berean"), group("retold", "Retold, in Paul's own words"));
    const viewButtons = [["threads", "The footings"], ["list", "The list"]].map(([id, text]) => h("button", {
      type: "button", "aria-pressed": String(id === LB.state.older), "data-older": id,
      onclick: () => { remember({ older: id }); sync(); },
    }, text));
    function sync() {
      for (const button of viewButtons) button.setAttribute("aria-pressed", String(button.dataset.older === LB.state.older));
      drawing.hidden = LB.state.older !== "threads";
      key.hidden = LB.state.older !== "threads";
      list.hidden = LB.state.older !== "list";
    }
    show(pairs[0], false);
    const section = h("section", { class: "stratum stratum-deep", id: "older" },
      h("header", { class: "s-head" }, h("span", { class: "s-num", "aria-hidden": "true" }, "03 / 03"),
        h("h2", {}, "Older words, ", h("em", {}, "underneath.")),
        h("p", {}, "Were these people the first to be tested? When the letters quote older Scripture, or retell it, they show you who stood under pressure before you. Point at a line to read both passages; choose it to open them."),
        h("p", { class: "s-reads" }, `The readings quote ${numbers.quoted} older passages, and 1 Corinthians 10 retells Israel's wilderness years through ${numbers.retold} more.`)),
      h("div", { class: "wall-controls is-end" }, h("div", { class: "lens-switch", role: "group", "aria-label": "How to see the older words" }, viewButtons)),
      readout, drawing, key, list,
      h("p", { class: "note" }, "Every quotation inside the walked passages is here. The letter's wording can differ from the Old Testament passage in the Berean, because the letters often follow a Greek translation. Retellings are this study's matching of Paul's sentences to the stories they recall; 1 Corinthians 10:10 may recall more than one grumbling. A possible echo, such as Psalm 55:22 behind 1 Peter 5:7, is named in its reading as possible and is not counted."));
    return { section, sync };
  }
  return { verses, footings };
})(window.LB);
