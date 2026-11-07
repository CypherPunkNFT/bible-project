// Section 03. After the last line: only those Scripture sees again run on, each to its verses. The rest are named once, plainly. Then the older Scripture already in the room.
(() => {
  if (!window.ENK) return;
  const { h, drawing, phrase, page, sectionHead, runs } = ENK;
  const { study, meetings, older } = window.EN;
  const back = meetings.filter((m) => m.later.length);
  const gone = meetings.filter((m) => !m.later.length);
  const openButton = (m) => h("button", { type: "button", class: "en-after-name", "data-meeting": m.id, onclick: (event) => ENK.openMeeting(m.id, event.currentTarget) }, m.name);
  page.append(h("section", { class: "t-sec en-after-sec", id: "after" },
    sectionHead("03", "After", "the last line", runs(study.afterLead)),
    h("ol", { class: "en-runs" }, back.map((m) => h("li", {},
      drawing(m.art, "en-run-art"),
      h("div", { class: "en-run-who" }, openButton(m), h("span", { class: "en-at" }, phrase(m.end))),
      h("span", { class: "en-run-rule", "aria-hidden": "true" }),
      h("ul", { class: "en-run-later" }, m.later.map((item) => h("li", {}, phrase(item))))))),
    h("div", { class: "en-gone" }, h("p", { class: "en-small" }, "Not seen again, as far as the record lets us tell"), h("p", {}, gone.map((m, index) => [index ? h("span", { class: "en-gone-sep", "aria-hidden": "true" }, " · ") : null, openButton(m)]))),
    h("p", { class: "en-reads" }, runs(study.afterReads)),
    h("h3", { class: "en-sub" }, "Older Scripture ", h("em", {}, "in the room")),
    h("p", { class: "en-sub-lead" }, runs(study.olderLead)),
    h("ul", { class: "en-older" }, older.map((row) => h("li", {},
      h("p", { class: "en-older-now" }, phrase(row.now)),
      h("span", { class: "en-older-link" }, h("span", { class: "en-small" }, `${row.by} draws this`)),
      h("p", { class: "en-older-then" }, phrase(row.then)),
      h("p", { class: "en-older-note" }, runs(row.note)))))));
})();
