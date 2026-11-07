// Section 03. Five doors in the New Testament's order, each with the same four lines. The one only asked for is drawn shut.
(() => {
  if (!window.BWK) return;
  const { h, art, refLink, runs, page, sectionHead } = BWK;
  const { study, doors } = window.BW;
  const ASKED_ONLY = "chains";
  const line = (label, ...value) => h("div", {}, h("dt", {}, label), h("dd", {}, ...value));
  const doorView = (door) => h("li", { class: "bw-link" },
    art(door.id === ASKED_ONLY ? BWArt.doorShut : BWArt.doorAjar, "bw-link-art"),
    h("p", { class: "bw-link-ref" }, refLink(door.r, door.label)),
    h("h3", {}, door.head),
    h("blockquote", {}, `“${door.words}”`),
    h("dl", {},
      line("Who opens it", door.opener),
      line("Beside it", `“${door.beside}” `, h("span", { class: "bw-beside-ref" }, refLink(door.besideR, door.besideLabel)))),
    h("p", { class: "bw-link-note" }, runs(door.note)));
  page.append(h("section", { class: "t-sec bw-thread-sec", id: "doors" },
    sectionHead("03", "Five doors,", "and what stands beside them", runs(study.doorsLead)),
    h("ol", { class: "bw-thread" }, doors.map(doorView)),
    h("p", { class: "bw-reads" }, runs(study.doorsReads))));
})();
