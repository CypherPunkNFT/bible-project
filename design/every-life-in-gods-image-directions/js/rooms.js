// The figures of Every life in God's image: "Who is in the room?" plans, the reason said twice, and the table of
// 2 Samuel 9. Every word and count comes from data.js (built and checked by build-data.py). Text goes in as text
// nodes; the only markup strings are the fixed plans in art.js.
window.ELFigures = (() => {
  let h, refLink, passages;
  const SVG = "http://www.w3.org/2000/svg";
  function s(tag, attrs = {}, ...children) {
    const element = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(attrs)) if (value !== undefined && value !== null) element.setAttribute(key, value);
    element.append(...children);
    return element;
  }
  function art(markup, className) {
    const holder = h("div", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }
  const lit = (parts, className) => parts.map(([text, on]) => (on ? h("mark", { class: className }, text) : text));

  // 01 The same reason, before the flood and after it.
  function twice(f) {
    return h("figure", { class: "el-twice" },
      h("ol", { class: "el-twice-rows" }, f.rows.map((row, i) => h("li", {},
        h("span", { class: "el-twice-when" }, h("b", {}, String(i + 1)), row.when),
        h("p", { class: "el-twice-text" }, lit(row.parts, "el-lit")),
        h("span", { class: "el-twice-ref" }, refLink(row.r, row.ref))))),
      h("figcaption", {}, "The reason is the same both times: ", h("q", {}, f.phrase), ". ",
        refLink(f.nr, passages[f.nr].label), " names no one by strength or use. Not named: ",
        f.notNamed.map((word, i) => [i ? " · " : "", h("span", { class: "el-unnamed" }, `the ${word}`)]), "."));
  }

  // 02–06 Who is in the room? A plan with its people; one button finds the one who cannot speak.
  function room(data) {
    const reading = h("p", { class: "el-room-reading", "aria-live": "polite" });
    const silent = data.marks.find((m) => m.silent);
    const plan = art(window.ELArt.rooms[data.art], "el-plan");
    const svg = plan.querySelector("svg");
    const listItems = [];
    const groups = [];
    function show(mark) {
      groups.forEach((g) => g.classList.toggle("is-on", g.dataset.id === mark.id));
      listItems.forEach((li) => li.classList.toggle("is-on", li.dataset.id === mark.id));
      const source = mark.r ? [" ", refLink(mark.r, passages[mark.r].label)] : [" ", h("span", { class: "el-own" }, "the study's words")];
      reading.replaceChildren(h("b", {}, mark.label), " ", h("q", {}, mark.words || mark.study), ...source);
    }
    const find = h("button", { type: "button", class: "el-find", "aria-pressed": "false" }, "Who here cannot speak?");
    find.addEventListener("click", () => {
      const on = find.getAttribute("aria-pressed") !== "true";
      find.setAttribute("aria-pressed", String(on));
      wrap.classList.toggle("is-found", on);
      if (on) reading.replaceChildren(h("b", {}, silent.label), /^[a-z]/.test(silent.why) ? ", " : ": ", h("span", {}, silent.why.replace(/[.]?$/, ".")), " ",
        h("q", {}, silent.words), " ", silent.r ? refLink(silent.r, passages[silent.r].label) : "");
      else reading.replaceChildren(h("span", { class: "el-hint" }, "Choose anyone in the room to read the words that place them there."));
    });
    data.marks.forEach((mark) => {
      const side = mark.lp === "right" || mark.lp === "left";
      const anchor = mark.lp === "right" ? "start" : mark.lp === "left" ? "end" : mark.x < 140 ? "start" : mark.x > 500 ? "end" : "middle";
      const dx = mark.lp === "right" ? 16 : mark.lp === "left" ? -16 : anchor === "start" ? -10 : anchor === "end" ? 10 : 0;
      const ly = side || mark.kind === "words" ? mark.y + 5 : mark.y < 160 && mark.lp !== "below" ? mark.y - 18 : mark.y + 26;
      const g = s("g", { class: `el-mark is-${mark.kind}${mark.silent ? " is-silent" : ""}`, tabindex: "0", role: "button",
        "aria-label": `${mark.label}: show the words`, "data-id": mark.id });
      if (mark.kind === "person") g.append(s("circle", { class: "el-ring", cx: mark.x, cy: mark.y, r: 10 }), s("circle", { class: "el-hit", cx: mark.x, cy: mark.y, r: 22 }));
      if (mark.kind === "thing") g.append(s("rect", { class: "el-ring", x: mark.x - 7, y: mark.y - 7, width: 14, height: 14, rx: 2 }), s("circle", { class: "el-hit", cx: mark.x, cy: mark.y, r: 22 }));
      const label = s("text", { class: "el-mark-label", x: mark.x + dx, y: ly, "text-anchor": anchor });
      label.textContent = mark.label;
      g.append(label);
      g.addEventListener("click", () => show(mark));
      g.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); show(mark); } });
      svg.append(g);
      groups.push(g);
      const li = h("li", { "data-id": mark.id, class: mark.silent ? "is-silent" : "" },
        h("button", { type: "button", onclick: () => show(mark) }, mark.label));
      listItems.push(li);
    });
    const wrap = h("figure", { class: `el-room is-${data.art}`, "aria-label": `Who is in the room: ${data.name}` },
      h("div", { class: "el-room-head" },
        h("span", { class: "el-room-name" }, data.name),
        find),
      data.applied ? h("p", { class: "el-applied" }, `${data.applied}: Proverbs 31:8–9 was first spoken to a king. The study applies it here.`) : null,
      plan,
      h("ul", { class: "el-room-list", "aria-label": "Who is in the room" }, listItems),
      reading);
    reading.replaceChildren(h("span", { class: "el-hint" }, "Choose anyone in the room to read the words that place them there."));
    return wrap;
  }

  // 03 The chapter as a long table: thirteen places, one a verse.
  function table(t) {
    const line = h("p", { class: "el-strip-reading", "aria-live": "polite" });
    const verses = passages[t.r].verses;
    function show(v) {
      cells.forEach((c) => c.setAttribute("aria-pressed", String(Number(c.dataset.v) === v.v)));
      const text = verses.find(([cv]) => cv === `9:${v.v}`)[1];
      line.replaceChildren(h("b", {}, `Verse ${v.v}`), " ", text);
    }
    const cells = t.verses.map((v) => h("button", { type: "button", class: `el-place${v.table ? " has-table" : ""}${v.lame ? " has-lame" : ""}`, "data-v": String(v.v), "aria-pressed": "false",
      "aria-label": `Verse ${v.v}${v.table ? ", at the king's table" : ""}${v.always ? ", always" : ""}${v.lame ? ", lame in both feet" : ""}`, onclick: () => show(v) },
      h("span", { class: "el-place-n" }, String(v.v)),
      h("span", { class: "el-place-plate", "aria-hidden": "true" }),
      v.always ? h("span", { class: "el-place-always", "aria-hidden": "true" }, "always") : null,
      v.lame ? h("span", { class: "el-place-lame", "aria-hidden": "true" }, "lame") : null));
    line.append(h("span", { class: "el-hint" }, "Choose a verse."));
    return h("figure", { class: "el-strip" },
      h("figcaption", {}, h("span", { class: "el-label" }, "The chapter at one table"), " ", refLink(t.r, passages[t.r].label), ", one place a verse. A plate where the verse sets Mephibosheth at the king's table (",
        String(t.atTable.length), "); “always” where it stands beside it (", String(t.always.length), "); “lame” where the verse names his feet (verses ", t.lame.join(" and "), "). Verse 13 holds both."),
      h("div", { class: "el-places", role: "group", "aria-label": "2 Samuel 9, verse by verse" }, cells),
      line,
      t.note ? h("p", { class: "el-editor" }, h("span", { class: "el-check-tag" }, "for the editor"), " ", t.note) : null);
  }

  // The close: the five people the study names, one from each room, and what the answer will often be.
  function close(rooms, acts) {
    return h("figure", { class: "el-five" },
      h("ol", {}, rooms.map((r) => h("li", {}, h("a", { href: `#part-${r.part}` },
        h("span", { class: "el-five-ring", "aria-hidden": "true" }), h("span", { class: "el-five-place" }, r.place), h("span", { class: "el-five-who" }, r.silent_name))))),
      h("figcaption", {}, h("span", { class: "el-label" }, "Often small and costly"), " ", acts.map((a, i) => [i ? h("span", { class: "el-dash", "aria-hidden": "true" }) : "", h("span", { class: "el-act" }, a)])));
  }

  return { use: (ctx) => ({ h, refLink, passages } = ctx), twice, room, table, close };
})();
