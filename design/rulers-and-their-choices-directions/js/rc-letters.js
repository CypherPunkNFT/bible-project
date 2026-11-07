// Section 03, second half. Three royal letters, one row for each hand. A real table on a wide screen; on a narrower one each letter reads down on its own, with the same labels.
(() => {
  if (!window.RCK) return;
  const { h, art, refLink, runs } = RCK;
  const { study, letters } = window.RC;
  const filling = (item) => (item.none ? h("span", { class: "rc-cell-none" }, item.none) : [h("span", { class: "rc-words" }, `“${item.t}”`), " ", h("span", { class: "rc-at" }, refLink(item.r, item.label))]);
  const table = h("table", { class: "rc-letters" },
    h("caption", { class: "rc-small" }, "Three letters, read down. Each line is a different hand."),
    h("thead", {}, h("tr", {}, h("td", {}), letters.letters.map((letter) => h("th", { scope: "col" }, letter.title, h("span", { class: "rc-at" }, refLink(letter.read.r, letter.read.t)))))),
    h("tbody", {}, letters.rows.map((rowName, index) => h("tr", {}, h("th", { scope: "row" }, rowName), letters.letters.map((letter) => h("td", {}, filling(letter.cells[index])))))));
  const stacked = h("div", { class: "rc-letters-stacked" }, letters.letters.map((letter) => h("section", {},
    h("h4", {}, letter.title, " ", h("span", { class: "rc-at" }, refLink(letter.read.r, letter.read.t))),
    h("dl", {}, letters.rows.map((rowName, index) => h("div", {}, h("dt", { class: "rc-small" }, rowName), h("dd", {}, filling(letter.cells[index]))))))));
  const section = document.getElementById("beyond");
  section.append(h("div", { class: "rc-seal-head" }, art(RCArt.seal, "rc-seal-art"), h("div", {}, h("h3", {}, "Three letters,", " ", h("em", {}, "many hands")), h("p", {}, runs(study.sealLead)))),
    table, stacked,
    h("p", { class: "rc-turn" }, h("b", {}, "And then Esther turns. "), letters.turn.map((item, index) => [index ? " · " : "", `“${item.t}” `, refLink(item.r, item.label)])),
    h("p", { class: "rc-reads" }, runs(study.sealReads)),
    h("p", { class: "rc-note" }, runs(study.sealCare)));
})();
