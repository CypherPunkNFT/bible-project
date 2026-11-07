// Section 01. Six prayers as six threads, read upward. Pointing shows the verse on the line beneath; choosing opens it in the sheet.
(() => {
  if (!window.PCK) return;
  const { h, page, sectionHead, runs } = PCK;
  const { study, climbs, kinds } = window.PC;
  const PROMPT = "Point at a line to read its verse here.";
  const line = h("p", { class: "pc-readline" }, PROMPT);
  const show = (station) => { line.replaceChildren(h("b", {}, `${station.label} · `), station.verse); };
  const reset = () => { line.textContent = PROMPT; };
  const stationView = (station) => h("li", { class: `pc-st pc-st-${station.k}` },
    h("a", { href: `?sheet=${station.r}`, "data-sheet": station.r, class: "pc-st-go", onmouseenter: () => show(station), onmouseleave: reset, onfocus: () => show(station), onblur: reset },
      h("span", { class: "pc-st-kind" }, kinds[station.k]),
      h("span", { class: "pc-st-words" }, station.t),
      h("span", { class: "pc-st-ref" }, station.label)));
  // Written from the first station up, and drawn from the bottom up: the list stays in reading order for a screen reader.
  const column = (climb) => h("li", { class: "pc-col" },
    h("h3", { class: "pc-col-name" }, climb.name),
    h("ol", { class: "pc-thread-list" },
      climb.stations[0].k === "thanks" ? null : h("li", { class: "pc-st pc-st-none" }, h("span", { class: "pc-st-kind" }, kinds.thanks), h("span", { class: "pc-st-words" }, "None in these verses")),
      climb.stations.map(stationView)),
    h("a", { class: "pc-col-go", href: `?reading=${climb.reading}#readings`, "data-reading": climb.reading }, "Read it whole →"));
  page.append(h("section", { class: "t-sec pc-climb", id: "climb" },
    sectionHead("01", "Six prayers.", "None stops at the request.", runs(study.climbLead)),
    h("ol", { class: "pc-cols", tabindex: "0", "aria-label": "Six prayers, side by side. On a narrow screen, scroll sideways." }, climbs.map(column)),
    h("p", { class: "pc-swipe" }, "Scroll sideways for all six →"),
    line,
    h("p", { class: "pc-reads" }, runs(study.climbReads))));
})();
