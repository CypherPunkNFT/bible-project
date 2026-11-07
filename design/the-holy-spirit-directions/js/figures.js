// The Holy Spirit: the data figures, each drawn from data.js, whose every phrase build-data.py has checked in its verse.
// hs.js passes in its element helper, so all text goes in as text nodes. Only the fixed drawings in art.js are markup.
window.HSFigures = ({ h, refLink, label, art, data }) => {
  const { passages, beams, targets, does, strips, nations, flesh, fruit, gifts, shared } = data;
  const SVG = "http://www.w3.org/2000/svg";
  const s = (tag, attrs = {}, ...children) => {
    const element = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    element.append(...children);
    return element;
  };
  const target = (id) => targets.find((t) => t.id === id);
  const sayBeam = (beam) => [h("b", {}, beam.part), " ", refLink(beam.r, passages[beam.r].label), " ", h("q", {}, beam.words), " ", beam.close];

  // The floodlight: six beams from a lamp above the frame, never drawn, onto the three places the study names.
  function floodlight() {
    const W = 1000, H = 400, top = 40, foot = 300, src = [500, -900];
    const spots = { jesus: 190, life: 500, others: 810 };
    const readout = h("p", { class: "hs-readout", "aria-live": "polite" }, "Point at a beam to read where it falls; choose it to open its verse.");
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "hs-flood-svg", role: "group", "aria-label": "Six readings, each a beam of light falling on what the Spirit points to" });
    const fade = s("linearGradient", { id: "hs-top-fade", x1: 0, y1: 0, x2: 0, y2: 1 },
      s("stop", { offset: "0", class: "hs-fade-a" }), s("stop", { offset: "1", class: "hs-fade-b" }));
    svg.append(s("defs", {}, fade), s("rect", { class: "hs-flood-top", x: 0, y: 0, width: W, height: top * 2.2, fill: "url(#hs-top-fade)" }));
    const groups = [];
    beams.forEach((beam) => {
      const second = beams.filter((b) => b.target === beam.target).indexOf(beam) === 1;
      const land = spots[beam.target] + (second ? 70 : -70);
      const y = top + (second ? 74 : 30); // the second beam of a pair carries its label lower, so the two never collide
      const at = (x, y) => src[0] + (x - src[0]) * ((y - src[1]) / (foot - src[1]));
      const half = 46;
      const points = [[at(land - half, 0), 0], [at(land + half, 0), 0], [land + half, foot], [land - half, foot]];
      const g = s("g", { class: `hs-beam-g is-${beam.section}`, tabindex: "0", role: "button", "aria-label": `${beam.part}, ${passages[beam.r].label}: ${beam.words}. ${beam.close}` });
      g.append(s("polygon", { class: "hs-beam-shape", points: points.map((p) => p.join(",")).join(" ") }),
        s("text", { class: "hs-beam-n", x: at(land, y), y, "text-anchor": "middle" }, beam.part),
        s("text", { class: "hs-beam-ref", x: at(land, y + 18), y: y + 18, "text-anchor": "middle" }, passages[beam.r].label));
      const show = () => { groups.forEach((x) => x.classList.toggle("is-dim", x !== g)); readout.replaceChildren(...sayBeam(beam)); };
      const hide = () => groups.forEach((x) => x.classList.remove("is-dim"));
      g.addEventListener("pointerenter", show); g.addEventListener("focus", show);
      g.addEventListener("pointerleave", hide); g.addEventListener("blur", hide);
      const open = () => document.dispatchEvent(new CustomEvent("hs:open", { detail: { id: beam.r, from: g } }));
      g.addEventListener("click", open);
      g.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
      groups.push(g);
      svg.append(g);
    });
    svg.append(s("path", { class: "hs-flood-ground", d: `M0 ${foot}H${W}` }));
    targets.forEach((t) => {
      const x = spots[t.id];
      const mark = s("g", { transform: `translate(${x - 24} ${foot + 4})`, class: "hs-flood-mark", "aria-hidden": "true" });
      mark.innerHTML = art.targets[t.id]; // fixed drawing from art.js
      svg.append(mark, s("text", { class: "hs-flood-name", x, y: foot + 76, "text-anchor": "middle" }, t.name));
    });
    const list = h("div", { class: "hs-flood-list" }, targets.map((t) => h("div", {},
      h("h3", {}, t.name), h("ul", {}, beams.filter((b) => b.target === t.id).map((b) => h("li", {}, sayBeam(b)))))));
    return h("figure", { class: "hs-flood" },
      h("p", { class: "hs-flood-note" }, label("The lamp is not drawn"), " A floodlight is not meant to be looked at. Each beam is one reading, in the colour of its part of the Bible; it lands on what the Spirit points to there."),
      svg, readout, list,
      h("figcaption", {}, "Two readings land on each place. The sentence on each beam is the study's own close; the words in quotation marks are the verse that shows the direction."));
  }

  function pointer(part) {
    const beam = beams.find((b) => b.part === part);
    const t = target(beam.target);
    return h("aside", { class: `hs-points is-${beam.section}` },
      h("span", { class: "hs-points-mark" }, art.svg(art.targets[t.id], "0 0 48 48")),
      h("div", {}, label("Where He points"), h("p", { class: "hs-points-to" }, t.name),
        h("p", {}, h("q", {}, beam.words), " ", refLink(beam.r, passages[beam.r].label), ". ", beam.close, beam.why ? ` The study adds: ${beam.why}` : "")));
  }

  function doesRow(part) {
    return h("div", { class: "hs-does" }, label("In this passage, the Spirit"),
      h("ul", {}, does.filter((d) => d.part === part).map((d) => h("li", {}, refLink(d.r, d.words)))));
  }

  function strip(part) {
    const item = strips[part];
    if (!item) return null;
    return h("figure", { class: `hs-strip is-${item.kind}` }, h("figcaption", {}, label(item.title)),
      h("ol", {}, item.steps.map((step, i) => h("li", {}, h("span", { class: "hs-strip-k" }, step.label),
        h("span", { class: "hs-strip-w" }, step.words), refLink(step.r, step.label_ref),
        i < item.steps.length - 1 ? h("span", { class: "hs-strip-join", "aria-hidden": "true" }) : null))),
      item.note ? h("p", { class: "hs-strip-note" }, item.note) : null);
  }

  function nationsRoll() {
    return h("figure", { class: "hs-nations" },
      h("figcaption", {}, label(`${nations.words.length} peoples and places`), " in Luke's order ", refLink(nations.r, passages[nations.r].label)),
      h("ol", {}, nations.words.map((name) => h("li", {}, name))),
      h("p", {}, "Each heard them ", h("q", {}, "declaring the wonders of God in our own tongues"), " ", refLink(nations.hr, passages[nations.hr].label), "."));
  }

  function ring() {
    const svg = s("svg", { viewBox: "0 0 360 300", class: "hs-ring-svg", "aria-hidden": "true" });
    const c = [180, 150], r = 78, n = fruit.words.length;
    svg.append(s("circle", { class: "hs-ring-one", cx: c[0], cy: c[1], r }));
    fruit.words.forEach((word, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const named = fruit.named.includes(word);
      const [x1, y1, x2, y2] = [c[0] + Math.cos(a) * (r - 6), c[1] + Math.sin(a) * (r - 6), c[0] + Math.cos(a) * (r + 6), c[1] + Math.sin(a) * (r + 6)];
      const tx = c[0] + Math.cos(a) * (r + 16), ty = c[1] + Math.sin(a) * (r + 16) + 4;
      const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
      svg.append(s("path", { class: named ? "hs-ring-tick is-named" : "hs-ring-tick", d: `M${x1} ${y1}L${x2} ${y2}` }),
        s("text", { class: named ? "hs-ring-word is-named" : "hs-ring-word", x: tx, y: ty, "text-anchor": anchor }, word));
    });
    svg.append(s("text", { class: "hs-ring-centre", x: c[0], y: c[1] + 5, "text-anchor": "middle" }, "one fruit"));
    return svg;
  }

  function harvest() {
    const marked = new Set(flesh.middleWords);
    return h("figure", { class: "hs-harvest" },
      h("div", { class: "hs-harvest-flesh" }, label("What the flesh produces"), " ", refLink(flesh.r, passages[flesh.r].label),
        h("ul", {}, flesh.words.map((w) => h("li", { class: marked.has(w) ? "is-between" : "" }, w))),
        h("p", {}, h("b", {}, `${marked.size} of ${flesh.words.length}`), " are about how people treat one another: the run the study quotes from the middle of the list.")),
      h("div", { class: "hs-harvest-fruit" }, label("What the Spirit grows"), " ", refLink(fruit.r, passages[fruit.r].label),
        ring(),
        h("ul", { class: "hs-ring-list" }, fruit.words.map((w) => h("li", { class: fruit.named.includes(w) ? "is-named" : "" }, w))),
        h("p", {}, h("b", {}, `${fruit.words.length} sides, one fruit.`), " ", h("q", {}, fruit.singular[1]), " is singular. Marked: the ", String(fruit.named.length), " the study names for a quarrelling church.")));
  }

  function giftLists() {
    return h("figure", { class: "hs-gifts" },
      gifts.map((list) => h("div", {}, h("p", {}, label(list.name), " ", refLink(list.r, passages[list.r].label)),
        h("ol", {}, list.words.map((w) => h("li", { class: shared.includes(w) ? "is-both" : "" }, w, shared.includes(w) ? h("small", {}, "on both lists") : null))))),
      h("figcaption", {}, `${gifts[0].words.length} gifts in one letter, ${gifts[1].words.length} in the other, ${shared.length} on both, each in its letter's order. Paul does not rank them, and no list in the New Testament claims to be complete.`));
  }

  function verbs() {
    const list = does.filter((d) => d.verb);
    return h("figure", { class: "hs-verbs" },
      h("figcaption", {}, label(`${list.length} things these passages say He does`), " Each is in its verse. A force does not decide."),
      h("ul", {}, list.map((d) => h("li", {}, h("span", { class: "hs-verb" }, d.verb), refLink(d.r, d.words)))));
  }

  return { floodlight, pointer, doesRow, strip, nationsRoll, harvest, giftLists, verbs };
};
