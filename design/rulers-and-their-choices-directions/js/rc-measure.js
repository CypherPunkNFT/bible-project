// Section 01. Two beams, every ruler a string as long as the stated reign, every bob the writer's verdict, threads back to the two names that come back most.
// Wide: strings hang and threads arc above. Narrow: the same buttons become cords from a left spine, and the words carry the threads.
(() => {
  if (!window.RCK) return;
  const { h, art, page, sectionHead, runs, refLink } = RCK;
  const { study, rulers, numbers, passages } = window.RC;
  const SVG = "http://www.w3.org/2000/svg";
  const WIDE = matchMedia("(min-width: 951px)");
  const longest = numbers.longYears;
  const scale = (ruler) => Math.max(ruler.years, 2) / longest;
  const SHAPE = {
    charge: { art: RCArt.bobCharge, word: "a charge" },
    right: { art: RCArt.bobRight, word: "did right" },
    both: { art: RCArt.bobBoth, word: "both are said" },
    none: { art: RCArt.bobNone, word: "no line of verdict" },
  };
  const verdictLine = (ruler) => (ruler.verdict ? `“${ruler.verdict.t}”` : "No line of verdict.");
  const rowWords = (ruler) => [ruler.verdict ? `“${ruler.verdict.t}”` : "No line of verdict", ruler.against ? ` · “${ruler.against.t}”` : "", ruler.thread ? ` · “${ruler.thread.t}”` : ""].join("");

  const line = h("p", { class: "rc-readline" }, "Point at a ruler to read the verdict here; choose one to open the record.");
  function show(ruler) {
    line.replaceChildren(h("b", {}, `${ruler.name} · ${ruler.length}`), " ", verdictLine(ruler), " ", ruler.verdict ? refLink(ruler.verdict.r, ruler.verdict.label) : refLink(ruler.reign, ruler.reignLabel));
  }

  const buttons = new Map();
  function rulerButton(ruler) {
    const shape = SHAPE[ruler.shape];
    const button = h("button", { type: "button", class: `rc-ruler rc-shape-${ruler.shape}${ruler.short_reign ? " is-long" : ""}${ruler.note || ruler.hight ? " is-noted" : ""}`, "data-ruler": ruler.id,
      "aria-label": `${ruler.name}. ${ruler.length}. ${shape.word}. Open the record.`, onclick: (event) => RCK.openRuler(ruler.id, event.currentTarget),
      onpointerenter: () => { show(ruler); glow(ruler.id); }, onpointerleave: () => glow(null), onfocus: () => { show(ruler); glow(ruler.id); }, onblur: () => glow(null) },
    h("span", { class: "rc-ruler-name" }, h("span", { class: "rc-ruler-short" }, ruler.short), h("span", { class: "rc-ruler-full" }, ruler.name)),
    h("span", { class: "rc-cord" }, h("span", { class: "rc-string" }), art(shape.art, "rc-bob")),
    h("span", { class: "rc-row-words" }, h("span", { class: "rc-row-length" }, ruler.length), " ", rowWords(ruler)));
    button.style.setProperty("--reach", String(Number(scale(ruler))));
    buttons.set(ruler.id, button);
    return button;
  }

  // Threads are drawn in the beam's own proportions, so they stay right at any width with nothing to measure.
  const threadPaths = new Map();
  function threadsOver(kingdom, list, slots, offset) {
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("class", "rc-threads");
    svg.setAttribute("viewBox", "0 0 1000 120");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    const x = (slot) => ((Number(slot) + 0.5) / Number(slots)) * 1000;
    for (const ruler of list) {
      if (!ruler.thread) continue;
      const from = x(ruler.at + offset), to = x(0);
      const lift = 30 + 170 * ((from - to) / 1000);
      const path = document.createElementNS(SVG, "path");
      path.setAttribute("d", `M${from} 120Q${(from + to) / 2} ${120 - lift} ${to} 120`);
      path.setAttribute("class", ruler.thread.rel === "not" ? "rc-thread is-not" : "rc-thread");
      svg.append(path);
      threadPaths.set(ruler.id, path);
    }
    return svg;
  }
  function glow(id) {
    for (const [key, path] of threadPaths) path.classList.toggle("is-on", key === id);
  }

  function beam(kingdom, title, sentence) {
    const list = rulers.filter((ruler) => ruler.kingdom === kingdom);
    const isJudah = kingdom === "judah";
    const peg = isJudah ? h("a", { class: "rc-peg", href: "?sheet=1KI.15.5", "data-sheet": "1KI.15.5", "aria-label": "David, the peg: not one of the rulers counted. Read 1 Kings 15:5." }, h("span", { class: "rc-peg-mark", "aria-hidden": "true" }), h("span", { class: "rc-ruler-name" }, h("span", { class: "rc-ruler-short" }, "David"), h("span", { class: "rc-ruler-full" }, "David, before the kingdoms parted. Not counted."))) : null;
    const slots = list.length + (isJudah ? 1 : 0);
    const row = h("div", { class: `rc-beam rc-beam-${kingdom}` }, peg, list.map(rulerButton));
    row.style.setProperty("--slots", String(Number(slots)));
    return h("figure", { class: "rc-kingdom", "aria-label": `${title}: ${list.length} rulers` },
      h("figcaption", {}, h("h3", {}, title), h("p", {}, sentence)),
      threadsOver(kingdom, list, slots, isJudah ? 1 : 0), row);
  }
  const legend = h("ul", { class: "rc-legend", "aria-label": "How to read the beams" },
    [[RCArt.bobCharge, `${numbers.chargeCount} · the line charges the ruler, each in its own words`], [RCArt.bobRight, `${numbers.rightCount} · “did what was right”`], [RCArt.bobBoth, "1 · both are said, a verse apart"], [RCArt.bobNone, "2 · no line of verdict"]].map(([mark, words]) => h("li", {}, art(mark, "rc-bob"), words)),
    h("li", {}, h("span", { class: "rc-key-tick" }), "a note under the line"),
    h("li", {}, h("span", { class: "rc-key-long" }), `${numbers.shortCount} · under two years, drawn longer than scale`),
    h("li", { class: "rc-only-wide" }, h("span", { class: "rc-key-thread" }), "thread: named as the measure"),
    h("li", { class: "rc-only-wide" }, h("span", { class: "rc-key-thread is-not" }), "dashed: named as the one not matched"));

  const israel = beam("israel", "Israel", "Order within the kingdom, not time. Its verdicts tie later kings back to its first.");
  const judah = beam("judah", "Judah", "Order within the kingdom, not time. This beam does not line up with the one above. Some verdicts look back to David, the peg at its start.");

  // One tab stop for each beam. Across a beam: left and right, or up and down on the narrow rows. Between beams: up and down on the wide ones.
  function wireKeys() {
    const groups = ["israel", "judah"].map((kingdom) => rulers.filter((r) => r.kingdom === kingdom).map((r) => buttons.get(r.id)));
    const mark = (group, button) => group.forEach((b) => { b.tabIndex = b === button ? 0 : -1; });
    groups.forEach((group, which) => {
      mark(group, group[0]);
      const other = groups[1 - which];
      group.forEach((button, index) => {
        button.addEventListener("focus", () => mark(group, button));
        button.addEventListener("keydown", (event) => {
          const across = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
          const down = { ArrowDown: 1, ArrowUp: -1 }[event.key];
          let target = null;
          if (across || (down && !WIDE.matches)) target = group[(index + (across ?? down) + group.length) % group.length];
          else if (down) target = other[Math.min(other.length - 1, Math.round((index / (group.length - 1)) * (other.length - 1)))];
          if (event.key === "Home") target = group[0];
          if (event.key === "End") target = group[group.length - 1];
          if (target) { event.preventDefault(); target.focus(); }
        });
      });
    });
  }
  wireKeys();

  const recordLine = (label, phrase) => h("div", { class: "rc-record-line" }, h("p", { class: "rc-small" }, label), h("p", { class: "rc-record-words" }, `“${phrase.t}”`), h("p", { class: "rc-record-ref" }, refLink(phrase.r, phrase.label)));
  RCK.drawRuler = (body, ruler) => {
    const kingdom = ruler.kingdom === "israel" ? "Israel" : "Judah";
    body.replaceChildren(...[
      h("p", { class: "rc-small" }, `${kingdom} · ${ruler.at + 1} of ${numbers[ruler.kingdom]} on the beam`),
      h("h3", { tabindex: "-1" }, ruler.name),
      h("p", { class: "rc-record-reign" }, ruler.length, " · ", refLink(ruler.reign, ruler.reignLabel)),
      ruler.verdict ? recordLine(ruler.against ? "The LORD says" : "The writer's line", ruler.verdict) : h("div", { class: "rc-record-line" }, h("p", { class: "rc-small" }, "The writer's line"), h("p", { class: "rc-record-words" }, "None is given.")),
      ruler.against ? recordLine("The writer says", ruler.against) : null,
      ruler.thread ? recordLine(ruler.thread.rel === "not" ? (ruler.kingdom === "judah" ? "Not as David" : "Named") : ruler.kingdom === "judah" ? "As David" : "Tied to Jeroboam son of Nebat", ruler.thread) : null,
      ruler.names ? recordLine("Named beside it", ruler.names) : null,
      ruler.note ? recordLine("A qualification", ruler.note) : null,
      ruler.hight ? recordLine("The note beneath", ruler.hight) : null,
      ruler.removed ? recordLine("The note beneath", ruler.removed) : null,
      ruler.said ? h("div", { class: "rc-flag" }, h("p", { class: "rc-flag-label" }, "This study notes"), h("p", {}, runs(ruler.said))) : null,
      h("p", { class: "rc-sheet-links" }, h("a", { href: `/people/${ruler.person}` }, `${ruler.short} on the People page →`), h("a", { href: `/read/bsb/${passages[ruler.reign].code}/${passages[ruler.reign].chapters[0]}` }, `Open ${ruler.reignLabel.replace(/:.*/, "")} in the reader →`)),
    ].filter(Boolean));
  };

  page.append(h("section", { class: "t-sec rc-measure", id: "measure" },
    sectionHead("01", "Two beams,", "and a line for every ruler", runs(study.measureLead)),
    israel, judah, line, legend,
    h("p", { class: "rc-reads" }, runs(study.measureReads)),
    h("p", { class: "rc-note" }, runs(study.measureCare))));
})();
