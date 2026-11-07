// The figures of Children and the home, one per part, drawn from data.js (every word in them was proved in its verse
// by figures.py). Each answers a question stated beside it and carries one sentence that reads it. All text goes in as
// text nodes; the only markup strings are this file's own fixed SVG shapes.
window.CHFigures = (() => {
  let h, refLink, setParam;
  const use = (tools) => ({ h, refLink, setParam } = tools);
  const q = (text) => `“${text}”`;
  const svg = (tag, attrs = {}) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    return element;
  };
  const words = (item) => [h("q", { class: "ch-fig-words" }, item.words), " ", refLink(item.r, item.label)];
  const figure = (question, reading, ...body) => h("figure", { class: "ch-fig" },
    h("p", { class: "ch-fig-q" }, question), ...body, h("figcaption", { class: "ch-fig-read" }, reading));

  // 01 From the heart outward: five nested rooms, the heart innermost. Choose one to read its words.
  function rings(data) {
    const W = 600, H = 360, n = data.rings.length;
    const plan = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "ch-rings-svg", "aria-hidden": "true" });
    const reading = h("p", { class: "ch-rings-reading", "aria-live": "polite" });
    const buttons = [];
    const groups = data.rings.map((ring, i) => {
      const step = i + 1, inset = 26;
      const x = W / 2 - 60 - step * inset * 1.9, y = H / 2 - 22 - step * inset;
      const g = svg("g", { class: "ch-ring", "data-ring": ring.id });
      g.append(svg("rect", { x, y, width: W - 2 * x, height: H - 2 * y, rx: 6, class: "ch-ring-rect" }));
      const label = svg("text", { x: W / 2, y: y + 17, "text-anchor": "middle", class: "ch-ring-label" });
      label.textContent = ring.name;
      g.append(label);
      g.addEventListener("mouseenter", () => choose(i, false));
      g.addEventListener("click", () => choose(i, true));
      return g;
    });
    groups.reverse().forEach((g) => plan.append(g));
    groups.reverse();
    function choose(index, remember) {
      const ring = data.rings[index];
      groups.forEach((g, i) => g.classList.toggle("is-on", i === index));
      buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
      reading.replaceChildren(h("b", {}, ring.name), " · ", ...ring.items.flatMap((item, i) => [i ? " · " : "", ...words(item)]));
      if (remember) setParam("ring", ring.id);
    }
    data.rings.forEach((ring, i) => buttons.push(h("button", { type: "button", class: "ch-ring-btn", "aria-pressed": "false", onclick: () => choose(i, true) },
      h("span", { class: "ch-ring-n" }, String(i + 1)), ring.name)));
    const asked = new URLSearchParams(location.search).get("ring");
    const start = Math.max(0, data.rings.findIndex((r) => r.id === asked));
    choose(start, false);
    return figure("Where does Moses put the words first, and how far out do they go?",
      "The passage moves outward and never steps back: the heart in verse 6, the children and the day in verse 7, hand and forehead in verse 8, doorpost and gate in verse 9.",
      h("p", { class: "ch-crown" }, data.crown.flatMap((item, i) => [i ? " · " : "", ...words(item)])),
      h("div", { class: "ch-rings" }, plan, h("div", { class: "ch-ring-row", role: "group", "aria-label": "From the heart outward" }, buttons)),
      reading);
  }

  // 02 The answer's order, five links of Psalm 78, and Timothy's three.
  function answer(steps) {
    return figure("When a child asks what the commands mean, where does the answer begin?",
      "The answer begins with the rescue. The commands come after it, as the way a rescued people lives.",
      h("ol", { class: "ch-steps" }, steps.map((s) => h("li", {}, h("span", { class: "ch-step-name" }, s.step), h("span", {}, ...words(s))))));
  }
  function chain(data, tim) {
    const links = h("ol", { class: "ch-chain" }, data.links.map((link) => h("li", {}, h("span", { class: "ch-link-ring", "aria-hidden": "true" }), h("span", {}, q(link)))));
    return figure("How many generations does Psalm 78 name in one breath?",
      "Five links, in order, in Psalm 78:5–6. Verse 8 hands down a warning about the people who handed the faith down.",
      h("div", { class: "ch-chain-wrap" }, links, h("p", { class: "ch-chain-src" }, refLink(data.r, data.label))),
      h("p", { class: "ch-warning" }, h("span", { class: "ch-link-ring is-broken", "aria-hidden": "true" }), ...words(data.warning)),
      h("div", { class: "ch-tim" },
        h("p", { class: "ch-tim-q" }, "And in one household:"),
        h("ol", { class: "ch-chain is-small" }, tim.links.map((link) => h("li", {}, h("span", { class: "ch-link-ring", "aria-hidden": "true" }), h("span", {}, q(link))))),
        h("p", { class: "ch-tim-note" }, refLink(tim.r, tim.label), ". Beside them, a father: ", ...words(tim.father), ". Acts does not say he believed.")));
  }

  // 03 Three times "in vain", then the turn; and the blessing's path in Psalm 128.
  function vain(data) {
    return figure(`How often does Psalm 127 say ${q("in vain")} before it turns?`,
      "Three times, and then the turn: the work rests on God, and He gives sleep. Psalm 128 starts its blessing with the one who fears the LORD and ends it with all Israel.",
      h("div", { class: "ch-vain" },
        h("ol", { class: "ch-vain-lines" }, data.lines.map((line) => {
          const at = line.toLowerCase().lastIndexOf("in vain");
          const first = line.toLowerCase().startsWith("in vain");
          return h("li", {}, first ? [h("span", { class: "ch-vain-word" }, line.slice(0, 7)), line.slice(7)] : [line.slice(0, at), h("span", { class: "ch-vain-word" }, line.slice(at))]);
        })),
        h("p", { class: "ch-vain-count" }, h("b", {}, String(data.count)), " times · ", refLink(data.r, data.label)),
        h("p", { class: "ch-turn" }, ...words(data.turn))),
      h("ol", { class: "ch-path" }, data.table.map((item) => h("li", {}, ...words(item)))));
  }

  // 04 Two loves a generation apart, and the reason Genesis gives for each.
  function loves(data, renamed, robe) {
    const row = (love) => h("div", { class: "ch-love" },
      h("span", { class: `ch-love-who${/Jacob/.test(love.who) ? " is-jacob" : ""}` }, love.who), h("span", { class: "ch-love-arrow", "aria-hidden": "true" }, "→"),
      h("span", { class: `ch-love-whom${love.whom === "Jacob" ? " is-jacob" : ""}` }, love.whom),
      h("span", { class: "ch-love-why" }, love.whyItem ? words(love.whyItem) : ["Genesis gives no reason. ", refLink(love.r, love.label)]));
    return figure("Why does each parent love the child they love?",
      "The son his mother favoured grows up to favour a son of his own. Genesis tells it without approving it.",
      h("div", { class: "ch-loves" },
        h("p", { class: "ch-gen" }, "One generation"), row(data[0]), row(data[1]),
        h("p", { class: "ch-gen is-next" }, "The next: Jacob is renamed. ", ...words(renamed)), row(data[2]),
        h("p", { class: "ch-robe" }, robe.flatMap((item, i) => [i ? " Then: " : "", ...words(item)]))));
  }

  // 05 Two threads in one courtyard; what Eli did and did not do; two robes.
  function threads(data, eli, robes) {
    const total = data.reduce((sum, t) => sum + t.verses, 0);
    const strip = h("div", { class: "ch-strip", role: "group", "aria-label": "1 Samuel 2:12–26 by whom each part is about" },
      data.map((t) => h("a", { class: `ch-strip-part is-${t.who}`, href: `?ref=${t.r}`, "data-ref": t.r, style: `flex:${t.verses} 1 0` },
        h("span", { class: "ch-strip-bar", "aria-hidden": "true" }), h("span", { class: "ch-strip-name" }, t.who === "sons" ? "Eli's sons" : "Samuel"),
        h("span", { class: "ch-strip-ref" }, t.label.replace("1 Samuel ", "")))));
    return figure("How does the story keep Samuel in view while it tells of Eli's sons?",
      `It moves between them ${["no", "once", "twice", "three", "four"][data.length - 1] || data.length - 1}${data.length > 3 ? " times" : ""} in ${total} verses. Choose a stretch to read it.`,
      strip,
      h("ol", { class: "ch-eli" }, eli.map((s) => h("li", { class: s.done ? "is-done" : "is-not" },
        h("span", { class: "ch-eli-mark", "aria-hidden": "true" }, s.done ? "✓" : "✕"), h("span", { class: "ch-eli-step" }, s.step), h("span", {}, ...words(s))))),
      h("p", { class: "ch-robes" }, "Two robes: ", ...words(robes[0]), ", a sign of favour over brothers; ", ...words(robes[1]), ", a mother's gift to a son she gave to God's service."));
  }

  // 06 A saying beside its opposite; both sides spoken to; the father's five acts on the road.
  function road(pair, spoken, data) {
    const acts = h("ol", { class: "ch-road-acts" }, data.acts.map((act) => h("li", {}, h("span", { class: "ch-road-dot", "aria-hidden": "true" }), q(act))));
    return figure("What kind of sentence is each one, and what does it ask?",
      "A saying works beside its opposite, and wisdom knows which fits. The commands speak to children and to fathers alike. Luke 15:20 gives the father five acts, in this order; what a waiting parent takes from them is this site's application, not a rule Jesus gave.",
      h("div", { class: "ch-pair" }, pair.map((item) => h("p", {}, ...words(item)))),
      h("div", { class: "ch-spoken" }, spoken.map((side) => h("div", {}, h("p", { class: "ch-spoken-to" }, `To ${side.to.toLowerCase()}`), side.items.map((item) => h("p", {}, ...words(item)))))),
      h("div", { class: "ch-road" }, h("p", { class: "ch-road-start" }, q(data.start), " · ", refLink(data.r, data.label)), acts));
  }

  return { use, rings, answer, chain, vain, loves, threads, road };
})();
