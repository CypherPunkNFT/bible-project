// Shared parts for study mock-ups, taken from the visual inventory (design/study-visual-inventory/): the pill switch, filter
// chips, the reading panel with its three ways to read, and the threads figure. All text goes in as text nodes.
window.StudyKit = (() => {
  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat().filter((c) => c !== null && c !== undefined));
    return element;
  }
  function art(markup, className) {
    const holder = document.createElement("span");
    if (className) holder.className = className;
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }

  // Words in one pill; the chosen one is solid. set(id) moves the choice without firing onchange.
  function pills(label, options, value, onchange) {
    const buttons = new Map();
    const set = (id) => { for (const [key, button] of buttons) button.setAttribute("aria-pressed", String(key === id)); };
    const element = h("div", { class: "sk-pills", role: "group", "aria-label": label },
      options.map(([id, text]) => {
        const button = h("button", { type: "button", class: "sk-pill", onclick: () => { set(id); onchange(id); } }, text);
        buttons.set(id, button);
        return button;
      }));
    set(value);
    element.set = set;
    return element;
  }

  // Larger filter chips, each with a mark, a name and a count.
  function chips(label, options, value, onchange) {
    const buttons = new Map();
    const set = (id) => { for (const [key, button] of buttons) button.setAttribute("aria-pressed", String(key === id)); };
    const element = h("div", { class: "sk-chips", role: "group", "aria-label": label },
      options.map(([id, text, total, mark]) => {
        const button = h("button", { type: "button", class: "sk-chip", onclick: () => { set(id); onchange(id); } }, mark ?? null, h("span", {}, text), h("b", {}, String(total)));
        buttons.set(id, button);
        return button;
      }));
    set(value);
    element.set = set;
    return element;
  }

  // ── The reading: a list of all the readings, then one raised card with three ways to read it ──
  const LENSES = [["whole", "Whole reading"], ["step", "Step by step"], ["scripture", "Scripture only"]];
  function readingPanel({ pre, study, passages, runs, refLink, blockView, strip, setting, lens, onLens, onChoose, onClose, closeIcon }) {
    const body = h("div", { class: "sk-lens-body" });
    let reading = null;
    let currentLens = lens;
    let step = 0;
    const steps = (r) => [
      { title: strip.title, view: () => [strip.view(r)] },
      ...r.parts.map((part) => ({ title: part.title, view: () => [h("div", { class: `${pre}-part` }, part.blocks.map((block) => blockView[block.k](block)))] })),
      { title: "Your response", view: () => [prompts(r)] },
    ];
    const prompts = (r) => h("div", { class: `${pre}-prompts` },
      h("div", {}, h("h4", {}, "Look closely"), h("p", {}, runs(r.look))),
      h("div", {}, h("h4", {}, "Your response"), h("p", {}, runs(r.response))));
    function drawStep(holder, rail, list) {
      [...rail.children].forEach((item, index) => { item.classList.toggle("is-on", index === step); item.classList.toggle("is-past", index < step); item.setAttribute("aria-current", index === step ? "step" : "false"); });
      holder.replaceChildren(...list[step].view());
    }
    function drawLens() {
      if (currentLens === "scripture") {
        const groups = reading.parts.map((part) => [part, part.blocks.filter((block) => block.k === "quote")]).filter(([, quotes]) => quotes.length);
        body.replaceChildren(h("div", { class: "sk-scripture" }, groups.map(([part, quotes]) => h("div", { class: "sk-scripture-part" }, h("h4", {}, part.title), quotes.map((block) => blockView.quote(block))))));
      } else if (currentLens === "step") {
        const list = steps(reading);
        step = Math.min(step, list.length - 1);
        const holder = h("div", { class: "sk-step-body" });
        const rail = h("ol", { class: "sk-rail" }, list.map((item, index) => h("li", {},
          h("button", { type: "button", onclick: () => { step = index; drawStep(holder, rail, list); } }, h("i", {}, String(index + 1).padStart(2, "0")), h("span", {}, item.title)))));
        drawStep(holder, rail, list);
        body.replaceChildren(rail, holder);
      } else {
        body.replaceChildren(strip.view(reading), h("div", { class: `${pre}-parts` }, reading.parts.map((part) => h("div", { class: `${pre}-part` }, h("h4", {}, part.title), part.blocks.map((block) => blockView[block.k](block))))), prompts(reading));
      }
    }
    const lensPills = pills("Ways to read this", LENSES, currentLens, (id) => { currentLens = id; step = 0; drawLens(); onLens(id); });
    function draw(next) {
      reading = next;
      step = 0;
      const nextReading = study.readings[(study.readings.indexOf(reading) + 1) % study.readings.length];
      drawLens();
      return [
        h("nav", { class: "sk-list", "aria-label": "All the readings" }, study.readings.map((item) => h("button", { type: "button", class: `sk-list-item${item === reading ? " is-on" : ""}`, "aria-current": item === reading ? "true" : "false", onclick: () => onChoose(item.slug) },
          h("b", {}, item.title), h("small", {}, passages[item.read[0]].label)))),
        h("div", { class: "sk-reader" },
          h("header", { class: `${pre}-panel-head` },
            h("div", {},
              h("p", { class: `${pre}-kind` }, "Reading ", h("b", {}, reading.n)),
              h("h3", { tabindex: "-1", id: `${pre}-reading-title` }, reading.title),
              h("p", { class: `${pre}-hook` }, runs(reading.hook))),
            h("button", { type: "button", class: `${pre}-close`, "aria-label": `Close the reading: ${reading.title}`, onclick: () => onClose() }, art(closeIcon))),
          h("p", { class: "sk-begin" }, h("span", {}, "Begin with the passage: "), reading.read.flatMap((id, i) => [i ? " · " : null, refLink(id, passages[id].label)])),
          setting ? h("p", { class: `${pre}-setting` }, h("span", {}, "Its setting: "), runs(setting(reading))) : null,
          lensPills, body,
          h("footer", { class: `${pre}-panel-foot` },
            h("button", { type: "button", class: `${pre}-next`, onclick: () => onChoose(nextReading.slug) }, `Next: ${nextReading.title} →`),
            h("button", { type: "button", class: `${pre}-next`, onclick: () => onClose() }, "Close this reading ↑"))),
      ];
    }
    return { draw, setLens: (id) => { currentLens = id; lensPills.set(id); if (reading) drawLens(); } };
  }

  // ── Threads: older passages on the left, the letters using them on the right, a curve for each pair ──
  const BOOKS = "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV".split(" ");
  const canonKey = (id) => { const [book, chapter, verse] = id.split("."); return BOOKS.indexOf(book) * 1e6 + Number(chapter) * 1e3 + Number.parseInt(verse, 10); };
  const SVG = "http://www.w3.org/2000/svg";
  function threads({ pairs, label, onShow, describe, isDashed = () => false, acrossFrom = 0 }) {
    const left = [...pairs].sort((a, b) => canonKey(a.older) - canonKey(b.older));
    const right = [...pairs].sort((a, b) => canonKey(a.letter) - canonKey(b.letter));
    const ROW = 40;
    const height = pairs.length * ROW;
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "sk-threads-lines");
    const parts = new Map();
    const element = h("div", { class: "sk-threads", role: "group", "aria-label": label, style: `--rows:${pairs.length}` });
    function activate(pair, announce) {
      element.classList.add("has-on");
      for (const [key, items] of parts) for (const item of items) item.classList.toggle("is-on", key === pair.id);
      onShow(pair, announce);
    }
    const register = (pair, item) => { if (!parts.has(pair.id)) parts.set(pair.id, []); parts.get(pair.id).push(item); };
    const wire = (item, pair) => {
      item.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") activate(pair, false); });
      item.addEventListener("focus", () => activate(pair, true));
    };
    for (const pair of pairs) {
      const path = document.createElementNS(SVG, "path");
      path.dataset.from = left.indexOf(pair); path.dataset.to = right.indexOf(pair);
      path.setAttribute("vector-effect", "non-scaling-stroke");
      path.setAttribute("class", `sk-thread sk-sec-${pair.section}${isDashed(pair) ? " is-dashed" : ""}`);
      path.dataset.sheet = pair.id;
      wire(path, pair);
      register(pair, path);
      svg.append(path);
    }
    const leftColumn = h("div", { class: "sk-threads-col sk-threads-left" }, left.map((pair) => {
      const button = h("button", { type: "button", class: `sk-thread-end sk-sec-${pair.section}`, "data-sheet": pair.id, "aria-label": describe(pair) },
        h("span", {}, h("b", {}, pair.olderLabel), h("small", {}, pair.sectionName)), h("i"));
      wire(button, pair); register(pair, button);
      return button;
    }));
    const rightColumn = h("div", { class: "sk-threads-col sk-threads-right" }, right.map((pair) => {
      const button = h("button", { type: "button", class: `sk-thread-end sk-sec-${pair.section}`, "data-sheet": pair.id, tabindex: "-1", "aria-hidden": "true" }, h("i"), h("span", {}, h("b", {}, pair.letterLabel)));
      wire(button, pair); register(pair, button);
      return button;
    }));
    element.append(leftColumn, svg, rightColumn);
    // Across: the letters on top and the older passages underneath. Down: older on the left, letters on the right.
    const wide = acrossFrom ? matchMedia(`(min-width: ${acrossFrom}px)`) : null;
    function layOut() {
      const across = Boolean(wide?.matches);
      element.classList.toggle("is-across", across);
      if (across) element.prepend(rightColumn, svg); else element.prepend(leftColumn, svg);
      element.append(across ? leftColumn : rightColumn);
      svg.setAttribute("viewBox", across ? `0 0 ${pairs.length} 100` : `0 0 100 ${height}`);
      for (const path of svg.children) {
        const from = Number(path.dataset.from) + .5, to = Number(path.dataset.to) + .5;
        path.setAttribute("d", across ? `M${to} 0C${to} 50 ${from} 50 ${from} 100` : `M0 ${from * ROW}C50 ${from * ROW} 50 ${to * ROW} 100 ${to * ROW}`);
      }
    }
    layOut();
    wide?.addEventListener("change", layOut);
    element.show = (pair) => activate(pair, false);
    return element;
  }

  return { h, art, pills, chips, readingPanel, threads };
})();
