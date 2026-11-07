// Following Jesus: the band. A whole passage drawn as one mark per verse, so any line can be seen inside its whole.
// Used four ways: the map in 00, the thin band that follows the reader through parts 01–06, the small band in each
// part's head, and the Law-and-Prophets arch in part 05. Numbers only go into the SVG; text goes in as text nodes.
window.FJBand = (() => {
  const { s } = FJKit;
  const W = 1000;
  const GAP = 16; // between chapters

  // x position of every verse, with a small gap where a chapter turns.
  function layout(verses) {
    const chapters = new Set(verses.map(([cv]) => cv.split(":")[0])).size;
    const step = (W - GAP * (chapters - 1)) / Math.max(verses.length - 1, 1);
    const xs = new Map();
    let x = 0, last = null;
    verses.forEach(([cv], index) => {
      const chapter = cv.split(":")[0];
      if (last !== null && chapter !== last) x += GAP;
      xs.set(cv, index === 0 ? 0 : x);
      x += step;
      last = chapter;
    });
    return { xs, step };
  }
  const mid = (xs, cvs) => (xs.get(cvs[0]) + xs.get(cvs[cvs.length - 1])) / 2;

  // options: verses, top (y of the ticks), tall, parts {n: [cv]}, current (part n), skip Set, arches [{a:[cv], b:[cv], lift, cls, text}],
  // marks [{cv, kind}], labels (show text), label {cv, text}
  function draw(options) {
    const { verses, top = 100, tall = 40, parts = {}, current = null, skip = new Set(), arches = [], marks = [], labels = true } = options;
    const { xs } = layout(verses);
    const height = top + tall + (labels ? 52 : 6);
    const svg = s("svg", { viewBox: `-12 0 ${W + 24} ${height}`, class: "fj-band-svg", "aria-hidden": "true" });
    const inPart = new Set(current && parts[current] ? parts[current] : []);
    arches.forEach((arch) => {
      const x1 = mid(xs, arch.a), x2 = mid(xs, arch.b), foot = top - 6, crown = top - arch.lift;
      svg.append(s("path", { class: `fj-arch ${arch.cls}`, d: `M${x1} ${foot}C${x1} ${crown} ${x2} ${crown} ${x2} ${foot}` }));
      arch.a.concat(arch.b).forEach((cv) => svg.append(s("line", { class: `fj-arch-foot ${arch.cls}`, x1: xs.get(cv), x2: xs.get(cv), y1: foot, y2: top - 1 })));
      if (labels && arch.text) svg.append(s("text", { class: `fj-arch-text ${arch.cls}`, x: (x1 + x2) / 2, y: top - arch.lift * 0.75 - 6, "text-anchor": "middle" }, arch.text));
    });
    verses.forEach(([cv]) => {
      const cls = ["fj-tick", skip.has(cv) ? "is-skip" : "", inPart.has(cv) ? "is-here" : ""].join(" ").trim();
      svg.append(s("line", { class: cls, x1: xs.get(cv), x2: xs.get(cv), y1: top, y2: top + tall }));
    });
    if (labels) drawParts(svg, xs, parts, current, top + tall);
    if (labels) drawChapters(svg, verses, xs, top + tall + 44);
    marks.forEach((mark, index) => drawMark(svg, xs, mark, top, tall, marks.slice(0, index).filter((m) => m.cv === mark.cv).length));
    if (options.label && xs.has(options.label.cv)) drawLabel(svg, xs.get(options.label.cv), options.label.text, top);
    return { svg, xs };
  }

  function drawParts(svg, xs, parts, current, y) {
    Object.entries(parts).forEach(([n, cvs]) => {
      const x1 = xs.get(cvs[0]), x2 = xs.get(cvs[cvs.length - 1]);
      svg.append(s("line", { class: `fj-span${n === current ? " is-here" : ""}`, x1, x2, y1: y + 10, y2: y + 10 }));
      svg.append(s("text", { class: `fj-span-text${n === current ? " is-here" : ""}`, x: (x1 + x2) / 2, y: y + 27, "text-anchor": "middle" }, n));
    });
  }

  function drawChapters(svg, verses, xs, y) {
    const seen = new Set();
    verses.forEach(([cv]) => {
      const chapter = cv.split(":")[0];
      if (seen.has(chapter)) return;
      seen.add(chapter);
      svg.append(s("text", { class: "fj-chapter-text", x: xs.get(cv), y }, `${chapter}:${cv.split(":")[1]}`));
    });
  }

  // Shapes as well as colour: the line is a tall mark with a dot, who is a square, before a ring, after an arrow.
  function drawMark(svg, xs, mark, top, tall, stack) {
    const x = xs.get(mark.cv);
    if (x === undefined) return;
    const y = top - 12 - stack * 13;
    if (mark.kind === "line") {
      svg.append(s("line", { class: "fj-mark-line", x1: x, x2: x, y1: y, y2: top + tall + 4 }));
      svg.append(s("circle", { class: "fj-mark-dot", cx: x, cy: y, r: 5 }));
    } else if (mark.kind === "who") {
      svg.append(s("rect", { class: "fj-mark fj-mark-who", x: x - 4, y: y - 4, width: 8, height: 8 }));
    } else if (mark.kind === "before") {
      svg.append(s("circle", { class: "fj-mark fj-mark-before", cx: x, cy: y, r: 4.5 }));
    } else if (mark.kind === "after") {
      svg.append(s("path", { class: "fj-mark fj-mark-after", d: `M${x - 4} ${y - 5}L${x + 5} ${y}L${x - 4} ${y + 5}Z` }));
    } else if (mark.kind === "famous") {
      svg.append(s("circle", { class: "fj-mark-famous", cx: x, cy: top - 6, r: 2.5 }));
    }
  }

  function drawLabel(svg, x, text, top) {
    const anchor = x < 220 ? "start" : x > 780 ? "end" : "middle";
    svg.append(s("line", { class: "fj-label-rule", x1: x, x2: x, y1: top - 70, y2: top - 26 }));
    svg.append(s("text", { class: "fj-label-text", x: anchor === "start" ? x - 4 : anchor === "end" ? x + 4 : x, y: top - 76, "text-anchor": anchor }, text));
  }

  // Which verse is under the pointer: the nearest by x, in the band's own units.
  function verseAt(svg, xs, clientX) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    const x = point.matrixTransform(matrix.inverse()).x;
    let best = null, distance = Infinity;
    for (const [cv, at] of xs) if (Math.abs(at - x) < distance) { best = cv; distance = Math.abs(at - x); }
    return best;
  }

  return { draw, verseAt, layout };
})();
