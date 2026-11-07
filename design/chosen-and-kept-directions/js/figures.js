// The data figures of Chosen and kept. Every phrase drawn here was checked by build-data.py against its verse, and
// every count was computed there. Each figure states its question, carries the sentence that reads it, can be pointed
// at and chosen, and reaches the verse.
window.CKFigures = ({ h, refLink, holder, art, data }) => {
  const { passages } = data;
  const label = (text) => h("span", { class: "ck-label" }, text);
  const cite = (item) => refLink(item.r, item.label);
  const purposeName = Object.fromEntries(data.purposes.map((p) => [p.id, p.name]));
  const head = (question, reading) => [h("p", { class: "ck-fig-q" }, question), reading ? h("p", { class: "ck-fig-read" }, reading) : null];
  const open = (id, from) => document.dispatchEvent(new CustomEvent("ck:open", { detail: { id, from } }));

  // 00 The reading key: four purposes around one question; each lists the passages written to do it.
  function purposeKey() {
    const readout = h("p", { class: "ck-readout", "aria-live": "polite" }, "Point at a passage to read the close's sentence for it; choose it to go to its part.");
    const quarter = (p) => {
      const parts = Object.entries(data.purposeOf).filter(([, v]) => v.kinds.includes(p.id));
      return h("div", { class: `ck-key-q is-${p.id}` },
        h("p", { class: "ck-key-name" }, holder(art.glyphs[p.id], "ck-glyph-wrap"), p.name),
        h("p", { class: "ck-key-says" }, p.says),
        p.misread ? h("p", { class: "ck-key-mis" }, p.misread) : null,
        h("ul", { class: "ck-key-list" }, parts.map(([n, v]) => {
          const part = data.study.parts.find((x) => x.n === n);
          const lead = v.kinds[0] === p.id ? "" : " (with a warning first)";
          const show = () => { readout.textContent = `${n} · ${v.close}${lead}`; };
          return h("li", {}, h("a", { href: `#part-${n}`, onmouseenter: show, onfocus: show },
            h("b", {}, n), part.readings.map((id) => passages[id].label).join("; ")));
        })));
    };
    return h("figure", { class: "ck-key" },
      head("What was it written to do?", `Eight passages, four purposes. ${Object.values(data.purposeOf).filter((v) => v.kinds.includes("comfort")).length} of the ${data.study.parts.length} parts were written, at least in part, to comfort.`),
      h("div", { class: "ck-key-grid" }, data.purposes.map(quarter)),
      readout,
      h("figcaption", {}, "Which purpose each passage serves is this page's reading of the study's own close, where each passage's sentence is quoted; the build checks each sentence is there."));
  }

  // 01 Ephesians 1:3-14: one sentence, three movements, three refrains, and "in Him" again and again.
  function sentence() {
    const verses = data.stanzas.flatMap((s) => s.verses);
    const refrainAt = Object.fromEntries(data.refrain.map((r) => [r.label.split(":")[1], r]));
    const hims = Object.fromEntries(verses.map((cv) => [cv, data.inHim.filter((x) => x.cv === cv)]));
    const all = passages[data.stanzas[0].r] && data.stanzas.map((s) => passages[s.r].verses).flat();
    const textOf = Object.fromEntries(all.map(([cv, t]) => [cv, t]));
    const readout = h("p", { class: "ck-readout", "aria-live": "polite" }, "Point at a verse to read it here; choose it to open the whole sentence.");
    const cells = verses.map((cv, i) => {
      const v = cv.split(":")[1];
      const show = () => {
        const words = textOf[cv];
        const marks = hims[cv].map((x) => x.words);
        const out = [h("b", {}, `1:${v} `)];
        let rest = words;
        marks.forEach((m) => { const at = rest.indexOf(m); if (at >= 0) { out.push(rest.slice(0, at), h("mark", {}, m)); rest = rest.slice(at + m.length); } });
        readout.replaceChildren(...out, rest);
      };
      return h("button", { type: "button", class: `ck-v${refrainAt[v] ? " is-refrain" : ""}`, style: `grid-column:${i + 1}`, "aria-label": `Ephesians ${cv}`,
        onmouseenter: show, onfocus: show, onclick: (e) => open("EPH.1.3-14", e.currentTarget) },
        h("span", { class: "ck-v-him" }, hims[cv].map(() => h("i", {}))), h("span", { class: "ck-v-tick" }), h("span", { class: "ck-v-n" }, v));
    });
    let col = 1;
    // On a phone the last movement is two verses wide, too narrow for its name, so each band also carries its number and
    // a key under the grid (hidden from screen readers, which already hear the names) spells the movements out.
    const bands = data.stanzas.map((s, i) => { const el = h("p", { class: "ck-band", style: `grid-column:${col} / span ${s.verses.length}` }, h("span", { class: "ck-band-i", "aria-hidden": "true" }, String(i + 1)), h("span", { class: "ck-band-name" }, s.name)); col += s.verses.length; return el; });
    const bandKey = h("ol", { class: "ck-band-key", "aria-hidden": "true" }, data.stanzas.map((s) => h("li", {}, s.name, h("span", {}, ` · ${s.label.replace("Ephesians ", "")}`))));
    return h("figure", { class: "ck-sentence" },
      head("One sentence: where does it keep coming back to?", `In ${data.numbers.inHimVerses} of the ${verses.length} verses, "in Him", "in Christ" or "in the Beloved One" (a dot above the verse). Three times, the praise of His glory (a gold verse).`),
      h("div", { class: "ck-sent-grid", style: `--n:${verses.length}` }, cells, bands),
      bandKey,
      h("ul", { class: "ck-refrain-list" }, data.refrain.map((r) => h("li", {}, refLink(r.r, r.label), " ", r.words))),
      readout,
      h("figcaption", {}, "The three movements follow the study's own sentence; where one ends and the next begins (after verses 6 and 12) is this page's division. The refrain is shown in each verse's own words: the Berean has \"to the praise of His glorious grace\" at 1:6 and \"for the praise of His glory\" at 1:12."));
  }

  // 02 Romans 8:29-30, five links; then everything Paul names that cannot separate.
  function chain() {
    return h("figure", { class: "ck-chain" },
      head("Which link depends on you holding on?", "None of them. In every link God is the one who acts, and the same people go from the first to the last."),
      h("ol", { class: "ck-links" }, data.chain.map((c, i) => h("li", {},
        h("span", { class: "ck-link-ring", "aria-hidden": "true" }), h("span", { class: "ck-link-n" }, String(i + 1)),
        h("b", {}, c.verb), refLink(c.r, c.words)))),
      h("figcaption", {}, "Romans 8:29–30 in the Berean, link by link. The study calls the five words \"foreknew, predestined, called, justified, glorified\"."));
  }
  function dangers() {
    const readout = h("p", { class: "ck-readout", "aria-live": "polite" }, "Point at a word to see its verse; choose it to open the verse.");
    const words = data.dangers.map((d, i) => {
      // In Paul's order round the ring, ending at the foot, where the longest ("anything else in all creation") has room.
      const angle = (90 + ((i + 1) / data.dangers.length) * 360) * Math.PI / 180;
      const show = () => { readout.replaceChildren(h("b", {}, d.label), " ", d.words); };
      return h("button", { type: "button", class: "ck-danger", style: `left:${(50 + 41 * Math.cos(angle)).toFixed(1)}%;top:${(50 + 43 * Math.sin(angle)).toFixed(1)}%`, onmouseenter: show, onfocus: show, onclick: (e) => open(d.r, e.currentTarget) }, h("span", {}, d.words));
    });
    return h("figure", { class: "ck-dangers" },
      head("What are you afraid could separate you from God? Find it in Paul's list.", `${data.numbers.dangers} things Paul names in Romans 8:35 and 38–39. None of them crosses the line.`),
      h("div", { class: "ck-ring-fig" }, h("p", { class: "ck-love" }, refLink(data.love.r, data.love.words)), words),
      readout);
  }

  // 03 Romans 9: the three questions Paul answers.
  function objections() {
    return h("figure", { class: "ck-objections" },
      head("What question is Paul answering?", "Three times in this chapter Paul hears a question and answers it. Read each answer as an answer to its question."),
      h("ol", {}, data.objections.map((o, i) => h("li", {},
        h("span", { class: "ck-ob-n" }, String(i + 1)),
        h("p", { class: "ck-asked" }, label(o.ask.r ? "Asked" : "Asked, in the study's words"), h("span", {}, o.ask.r ? refLink(o.ask.r, `“${o.ask.words}”`) : o.ask.words)),
        h("span", { class: "ck-ob-rule", "aria-hidden": "true" }),
        h("p", { class: "ck-answer" }, label("Answered"), h("span", {}, refLink(o.answer.r, `“${o.answer.words}”`)))))));
  }

  // 04 John 6:37 in two halves; John 10:28-29, a hand inside a hand, drawn as two rings.
  function halves() {
    return h("figure", { class: "ck-halves" },
      head("One verse, two sides", "The study reads John 6:37 as two halves: what the Father does, and what is promised to whoever comes."),
      h("div", { class: "ck-halves-row" }, data.halves.map((x) => h("p", {}, label(x.side), refLink(x.r, x.words)))));
  }
  function hands() {
    const readout = h("p", { class: "ck-readout", "aria-live": "polite" }, "Point at a ring to read its words; choose it to open the verse.");
    const ring = (x, r, cls) => {
      const show = () => readout.replaceChildren(h("b", {}, `${x.name} · ${x.label} `), x.words);
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `ck-hand ${cls}`); g.setAttribute("tabindex", "0"); g.setAttribute("role", "button");
      g.setAttribute("aria-label", `${x.name}: ${x.words}, ${x.label}`);
      g.innerHTML = `<circle cx="160" cy="160" r="${r}"/>`;
      g.addEventListener("mouseenter", show); g.addEventListener("focus", show);
      g.addEventListener("click", () => open(x.r, g));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(x.r, g); } });
      return g;
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 320 320"); svg.setAttribute("class", "ck-hands-svg");
    svg.append(ring(data.hands[1], 150, "is-outer"), ring(data.hands[0], 92, "is-inner"));
    const dots = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dots.setAttribute("class", "ck-flock"); dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = [[150, 150], [172, 156], [160, 172], [140, 168], [178, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join("");
    svg.append(dots);
    return h("figure", { class: "ck-hands" },
      head("Whose hands hold the sheep, and who can take them out?", "The Son's hand, inside the Father's hand. No one, said twice."),
      h("div", { class: "ck-hands-row" }, svg,
        h("ul", { class: "ck-hands-words" },
          data.hands.slice().reverse().map((x) => h("li", {}, label(x.name), refLink(x.r, x.words))),
          h("li", {}, label("The sheep"), refLink(data.held.r, data.held.words)))),
      readout,
      h("figcaption", {}, "Two rings for two hands, so that no hand is drawn. The study's sentence: \"The believer is held in the Son's hand, and that hand is inside the Father's hand.\""));
  }

  // 05 Hebrews 6:7-9: one rain, two fields, then the turn.
  function fields() {
    return h("figure", { class: "ck-fields" },
      head("What contrast do the two fields draw?", "The same rain falls on both. What each field produces shows what kind of field it is."),
      h("p", { class: "ck-rain-w" }, label("On both"), refLink(data.rain.r, data.rain.words)),
      holder(art.fields, "ck-fields-art"),
      h("div", { class: "ck-fields-row" }, data.fields.map((f) => h("div", {}, h("p", { class: "ck-field-name" }, f.name),
        h("p", {}, refLink(f.grows.r, f.grows.words)), h("p", { class: "ck-field-end" }, f.end.words)))),
      h("p", { class: "ck-turn" }, label("Then, at once"), refLink(data.turn.r, `“${data.turn.words}”`)));
  }

  // 06 1 John 5: what assurance rests on, and what confirms it.
  function ground() {
    return h("figure", { class: "ck-ground" },
      head("Where do you look first?", "The ground first; the signs stand on it."),
      h("div", { class: "ck-tiers" }, data.ground.slice().reverse().map((g, i) => h("div", { class: `ck-tier ${i === data.ground.length - 1 ? "is-ground" : ""}` },
        h("p", { class: "ck-tier-head" }, g.head),
        h("ul", {}, g.lines.map((l) => h("li", {}, refLink(l.r, l.words), h("small", {}, ` ${l.label}`))))))),
      h("figcaption", {}, "The two headings are the study's own. Of the love and obedience in verses 1–3 it says: \"They are not the price of it.\""));
  }

  // 07 Mark 3:28-30 in its own order.
  function first() {
    return h("figure", { class: "ck-first" },
      head("What does Jesus say first?", "All sins and blasphemies forgiven; then the one that is not; then why He said it."),
      h("ol", {}, data.first.map((x, i) => h("li", { class: `is-${i}` }, label(`${x.name} · ${x.label.split(" ")[1]}`), refLink(x.r, x.words),
        i === 0 ? h("p", { class: "ck-restored" }, data.restored.map((p) => h("span", {}, h("b", {}, p.name), " ", refLink(p.r, `“${p.words}”`)))) : null))));
  }

  // The close: the fears the study names, joined by fine lines to the promise each part sends the reader to.
  function fears() {
    const promises = [];
    data.fears.forEach((f) => { if (!promises.some((p) => p.r === f.promise.r)) promises.push(f.promise); });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ck-fear-lines"); svg.setAttribute("aria-hidden", "true");
    const left = data.fears.map((f, i) => h("li", { class: "ck-fear", "data-i": String(i) },
      h("a", { href: `#part-${f.part}`, onmouseenter: () => light(i), onfocus: () => light(i), onmouseleave: () => light(-1), onblur: () => light(-1) },
        h("b", {}, f.part), h("span", {}, `“${f.says}”`)),
      h("span", { class: "ck-fear-to" }, "→ ", refLink(f.promise.r, f.promise.label))));
    const right = promises.map((p) => h("li", { class: "ck-promise", "data-r": p.r }, refLink(p.r, `“${p.words}”`), h("small", {}, p.label)));
    const box = h("div", { class: "ck-fears-grid" }, svg, h("ol", { class: "ck-fears-l" }, left), h("ul", { class: "ck-fears-r" }, right));
    function light(i) {
      box.querySelectorAll(".is-lit").forEach((el) => el.classList.remove("is-lit"));
      if (i < 0) return;
      left[i].classList.add("is-lit");
      box.querySelector(`[data-r="${data.fears[i].promise.r}"]`)?.classList.add("is-lit");
      svg.querySelector(`[data-i="${i}"]`)?.classList.add("is-lit");
    }
    function draw() {
      const b = box.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
      svg.replaceChildren(...data.fears.map((f, i) => {
        const a = left[i].firstChild.getBoundingClientRect(), z = box.querySelector(`[data-r="${f.promise.r}"]`).getBoundingClientRect();
        const x1 = a.right - b.left + 8, y1 = a.top + a.height / 2 - b.top, x2 = z.left - b.left - 8, y2 = z.top + 14 - b.top;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M${x1} ${y1}C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}`);
        path.setAttribute("data-i", String(i));
        return path;
      }));
    }
    new ResizeObserver(() => requestAnimationFrame(draw)).observe(box);
    const shared = data.numbers.johnSixPromise;
    return h("figure", { class: "ck-fears" },
      head("Which fear brought you here?", `Five fears, in the study's own words, each joined to the promise its part sends you to. ${shared} of them are sent to the same verse.`),
      box,
      h("figcaption", {}, "Point at a fear to light its line; choose it to go to its part. Choose a promise to read its verse."));
  }

  return { purposeKey, sentence, chain, dangers, objections, halves, hands, fields, ground, first, fears, purposeName };
};
