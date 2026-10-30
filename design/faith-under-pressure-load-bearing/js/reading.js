// One reading, opened under the wall: its pier drawn large with what presses, calls, bears and is not promised set at their own
// heights, then the text with the study's cautions and sources standing in the margin beside the sentence they qualify.
window.LBReading = (({ h, refLink, runs, sourceIds, remember, state: firstState }) => {
  const { study, passages, strips } = window.FP;
  const flagKinds = new Set(["care", "other", "open", "source"]);
  const LENSES = [["whole", "Whole reading"], ["step", "Step by step"], ["scripture", "Scripture only"]];

  const flag = {
    care: (b) => h("aside", { class: "flag flag-care" }, h("span", { class: "flag-label" }, "A detail to handle carefully"), h("p", {}, runs(b.runs))),
    other: (b) => h("aside", { class: "flag flag-other" }, h("span", { class: "flag-label" }, "Another reading, labelled as such"), h("p", {}, runs(b.runs))),
    open: (b) => h("aside", { class: "flag flag-open" }, h("span", { class: "flag-label" }, "Open question · this study does not choose"), h("p", {}, runs(b.runs))),
    source: (b) => {
      const source = sourceIds.get(b.src);
      return h("aside", { class: "flag flag-source" }, h("span", { class: "flag-label" }, "Named source"), h("p", {}, runs(b.runs)), h("small", {}, source.name, ". ", source.note));
    },
  };
  const mainBlock = (b) => (b.k === "quote"
    ? h("figure", { class: "cut" }, h("blockquote", {}, b.t), h("figcaption", {}, refLink(b.r, b.label), " · BSB"))
    : h("p", {}, runs(b.runs)));

  // Text and its marginal notes travel in pairs of columns, so a caution stays level with the sentence it belongs to.
  function partView(part) {
    const rows = [];
    let row = null;
    for (const block of part.blocks) {
      const isFlag = flagKinds.has(block.k);
      if (!row || (!isFlag && row.side.length)) { row = { main: [], side: [] }; rows.push(row); }
      (isFlag ? row.side : row.main).push(isFlag ? flag[block.k](block) : mainBlock(block));
    }
    return h("section", { class: "part" }, h("h4", {}, part.title),
      rows.map((r) => {
        // Beside the text only as many notes as it can stand level with; the rest run full width beneath it, still in order.
        const beside = r.side.slice(0, 2), beneath = r.side.slice(2);
        return [
          h("div", { class: `part-row${r.main.length ? "" : " only-side"}` }, h("div", { class: "part-main" }, r.main), beside.length ? h("div", { class: "part-side" }, beside) : null),
          beneath.length ? h("div", { class: "part-beneath" }, beneath) : null,
        ];
      }));
  }

  function elevation(reading, olderFor) {
    const cells = strips.filter((strip) => strip.place === reading.slug).flatMap((strip) => strip.cells);
    return h("div", { class: "elevation" },
      h("figure", { class: "elevation-draw" }, Stones.pier(reading, cells, olderFor(reading.slug), { big: true }), h("figcaption", {}, `Stones run in reading order: ${strips.filter((strip) => strip.place === reading.slug).map((strip) => strip.label).join(", then ")}. Choose a stone to open its verse. Dashed stones under the ground: what this passage does not promise.`)),
      h("div", { class: "elevation-text" },
        h("h4", {}, "The pressure, the call, the ground"),
        h("dl", {},
          h("div", { class: "at at-P" }, h("dt", {}, "The pressure"), h("dd", {}, runs(reading.pressure))),
          h("div", { class: "at at-C" }, h("dt", {}, "The call"), h("dd", {}, runs(reading.call))),
          h("div", { class: "at at-G" }, h("dt", {}, "The ground"), h("dd", {}, runs(reading.ground))),
          h("div", { class: "at at-N" }, h("dt", {}, "What it does not promise · this site's reading"), h("dd", {}, runs(reading.limit))))));
  }
  const closing = (reading) => h("section", { class: "respond" },
    h("div", {}, h("h4", {}, "Look closely"), h("p", {}, runs(reading.look))),
    h("div", {}, h("h4", {}, "Your response"), h("p", {}, runs(reading.response))));

  // Scripture only: the reading's whole passages, with the study's marks shown in the sentence.
  function scriptureView(reading) {
    return strips.filter((strip) => strip.place === reading.slug).map((strip) => h("section", { class: "script" },
      h("h4", {}, refLink(strip.p, strip.label), " · BSB"),
      h("p", {}, strip.cells.map((cell) => [
        h("a", { class: "script-v", href: `?sheet=${cell.r}`, "data-sheet": cell.r, "aria-label": cell.label }, String(cell.v)),
        cell.segs.map((seg) => (seg.k.length ? h("mark", { class: seg.k.map((k) => `m-${k}`).join(" ") }, seg.t) : seg.t)), " ",
      ]))));
  }

  function create({ olderFor, onChoose, onClose, onLens }) {
    let lens = firstState.lens;
    const body = (reading) => {
      if (lens === "scripture") return scriptureView(reading);
      if (lens === "whole") return [elevation(reading, olderFor), reading.parts.map(partView), closing(reading)];
      const steps = [["The pressure, the call, the ground", () => elevation(reading, olderFor)], ...reading.parts.map((part) => [part.title, () => partView(part)]), ["Your response", () => closing(reading)]];
      const at = Math.min(LB.state.step, steps.length - 1);
      const rail = h("ol", { class: "rail" }, steps.map(([title], index) => h("li", {}, h("button", {
        type: "button", "aria-current": index === at ? "step" : "false",
        onclick: () => { remember({ step: index }); redraw(reading); document.querySelector(`.rail li:nth-child(${index + 1}) button`)?.focus({ preventScroll: true }); },
      }, h("i", {}, String(index + 1).padStart(2, "0")), h("span", {}, title)))));
      return [rail, h("div", { class: "step-body" }, steps[at][1]())];
    };
    const slot = h("div", { class: "lens-body" });
    function redraw(reading) {
      slot.replaceChildren(...[body(reading)].flat(Infinity));
    }
    function draw(reading) {
      const index = study.readings.indexOf(reading);
      const next = study.readings[(index + 1) % study.readings.length];
      redraw(reading);
      const lensButtons = LENSES.map(([id, text]) => h("button", {
        type: "button", "aria-pressed": String(id === lens),
        onclick: (event) => {
          lens = id;
          for (const button of event.currentTarget.parentElement.children) button.setAttribute("aria-pressed", String(button === event.currentTarget));
          onLens(id); redraw(reading);
        },
      }, text));
      const close = h("button", { type: "button", class: "reading-close", "aria-label": `Close the reading: ${reading.title}`, onclick: () => onClose() });
      close.innerHTML = icon("x", 18);
      return [
        h("nav", { class: "reading-tabs", "aria-label": "All the readings" }, study.readings.map((r) => h("button", { type: "button", "aria-current": String(r === reading), onclick: () => onChoose(r.slug) }, h("b", {}, r.title), h("small", {}, passages[r.read[0]].label)))),
        h("header", { class: "reading-head" },
          h("div", {},
            h("p", { class: "reading-kind" }, "Reading ", h("b", {}, reading.n)),
            h("h3", { id: "reading-title", tabindex: "-1" }, reading.title),
            h("p", { class: "reading-hook" }, runs(reading.hook)),
            h("p", { class: "reading-line" }, runs(reading.line))),
          close),
        h("div", { class: "reading-begin" },
          h("p", {}, h("span", {}, "Begin with the passage: "), reading.read.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)])),
          h("p", {}, h("span", {}, "Its setting: "), runs(reading.setting))),
        h("div", { class: "lens-switch", role: "group", "aria-label": "Ways to read this" }, lensButtons),
        slot,
        h("footer", { class: "reading-foot" },
          h("button", { type: "button", onclick: () => onChoose(next.slug) }, `Next: ${next.title} →`),
          h("button", { type: "button", onclick: () => onClose() }, "Close this reading ↑")),
      ];
    }
    return { draw, setLens: (id) => { lens = id; } };
  }
  return { create };
})(window.LB);
