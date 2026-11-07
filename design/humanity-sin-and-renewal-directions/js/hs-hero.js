// The heading, and the figure of dust: motes gather into one outline, hold, and loosen, inside a ring that never goes away.
// The outline stays faintly drawn through the whole loop, because the page does not teach that the image ever disappears.
(() => {
  if (!window.HSK) return;
  const { h, art, runs, plain, refLink, page, reducedMotion } = HSK;
  const { study, numbers } = window.HS;
  const motto = plain(study.motto).split(" / ");
  const LOOP_MS = 22000, GATHER = 0.3, HOLD = 0.62, BOX_W = 200, BOX_H = 420;
  const canvas = h("canvas", { class: "hs-dust", "aria-hidden": "true" });
  const pauseButton = h("button", { type: "button", class: "hs-pause", "aria-pressed": "false" }, "Pause the moving dust");

  const figures = [
    ["Passages walked", numbers.passages, `${numbers.verses} verses in all. A selection, not a census: the rest is named under the line.`],
    ["Places on the image thread", numbers.places, `In ${numbers.states} stages, chosen to follow the thread. Not every verse that mentions the image.`],
    ["Parts of one body", numbers.bodyParts, `In Paul's list, as this page counts them. ${numbers.sameWord} meet the same English word used well.`],
    ["Rows Paul sets side by side", numbers.contrasts, `In Romans 5. In ${numbers.stepRows} of them he says the two sides are not equal.`],
  ];
  page.append(h("section", { class: "t-sec-landing hs-hero", id: "top" },
    h("div", { class: "hc-intro hs-intro" },
      h("div", {},
        h("nav", { class: "hs-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "hs-here" }, study.title)),
        h("p", { class: "hs-concepts" }, plain(study.concepts)),
        h("h1", {}, "Humanity, sin", h("em", {}, "and renewal")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "hs-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "hs-hero-art" },
        h("div", { class: "hs-stage" }, art(HSArt.orbits), canvas),
        h("figcaption", {},
          h("span", { class: "hs-motto" }, motto[0], h("br"), h("span", {}, motto[1])),
          h("span", { class: "hs-art-note" }, "One human outline drawn in dust, with no face, gathering and loosening. It is a picture of the motto, not of any person, and never of God or of Christ."),
          pauseButton))),
    h("dl", { class: "hs-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note))))));

  const context = canvas.getContext("2d");
  const coarse = matchMedia("(max-width: 700px)");
  const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);
  let motes = [], width = 0, height = 0, clock = LOOP_MS * GATHER, frame = 0, last = 0, visible = true, paused = false, colours = null;

  function readColours() {
    const style = getComputedStyle(page);
    colours = { ink: style.getPropertyValue("--ink").trim(), gold: style.getPropertyValue("--accent").trim(), muted: style.getPropertyValue("--muted").trim() };
  }
  function homes(count) {
    // Points inside the outline, found by drawing it once off-screen and keeping the pixels it covered.
    const sample = document.createElement("canvas");
    sample.width = BOX_W; sample.height = BOX_H;
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    sampleContext.fill(new Path2D(HSArt.head));
    sampleContext.fill(new Path2D(HSArt.trunk));
    const pixels = sampleContext.getImageData(0, 0, BOX_W, BOX_H).data, inside = [];
    for (let y = 0; y < BOX_H; y += 2) for (let x = 0; x < BOX_W; x += 2) if (pixels[(y * BOX_W + x) * 4 + 3] > 128) inside.push([x, y]);
    return Array.from({ length: count }, () => inside[Math.floor(Math.random() * inside.length)]);
  }
  function makeMotes() {
    const count = coarse.matches ? 400 : 900;
    motes = homes(count).map(([x, y], index) => ({ x, y, angle: Math.random() * 6.283, reach: 0.25 + Math.random() * 0.75, size: 0.5 + Math.random() * 0.9, phase: Math.random(), gold: index % 11 === 0 }));
  }
  function resize() {
    const box = canvas.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const ratio = pixelRatio();
    width = box.width; height = box.height;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }
  const ease = (t) => t * t * (3 - 2 * t);
  function gathered(progress) {
    // 0 is loose, 1 is the held figure.
    if (progress < GATHER) return ease(progress / GATHER);
    if (progress < HOLD) return 1;
    return 1 - ease((progress - HOLD) / (1 - HOLD));
  }
  function draw() {
    if (!width || !colours) return;
    const scale = (height * 0.78) / BOX_H, originX = width / 2 - (BOX_W * scale) / 2, originY = height * 0.11;
    const still = reducedMotion.matches;
    const amount = still ? 1 : gathered((clock % LOOP_MS) / LOOP_MS);
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(originX, originY);
    context.scale(scale, scale);
    context.globalAlpha = 0.28;
    context.strokeStyle = colours.muted;
    context.lineWidth = 1 / scale;
    context.stroke(new Path2D(HSArt.outline));
    context.restore();
    for (const mote of motes) {
      const loose = (1 - amount) * mote.reach * width * 0.46;
      const drift = still ? 0 : Math.sin(clock / 2600 + mote.phase * 6.283) * 1.2;
      const x = originX + mote.x * scale + Math.cos(mote.angle) * loose + drift;
      const y = originY + mote.y * scale + Math.sin(mote.angle) * loose * 0.92 - drift;
      context.globalAlpha = 0.3 + 0.55 * amount;
      context.fillStyle = mote.gold ? colours.gold : colours.ink;
      context.beginPath();
      context.arc(x, y, mote.size, 0, 6.283);
      context.fill();
    }
    context.globalAlpha = 1;
  }
  const shouldRun = () => visible && !paused && !reducedMotion.matches && !document.hidden;
  function tick(now) {
    frame = 0;
    if (!shouldRun()) return;
    clock += Math.min(now - last, 50);
    last = now;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function update() {
    cancelAnimationFrame(frame);
    frame = 0;
    pauseButton.hidden = reducedMotion.matches;
    if (reducedMotion.matches) draw();
    if (shouldRun()) { last = performance.now(); frame = requestAnimationFrame(tick); }
  }
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Play the moving dust" : "Pause the moving dust";
    update();
  });
  readColours();
  makeMotes();
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; update(); }).observe(canvas);
  document.addEventListener("visibilitychange", update);
  addEventListener("pageshow", update);
  reducedMotion.addEventListener("change", update);
  coarse.addEventListener("change", () => { makeMotes(); draw(); });
  new MutationObserver(() => { readColours(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  resize();
  update();
})();
