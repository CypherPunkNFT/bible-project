// "Their best-known works, in order": a scroll-snapping row of slim cards, one per known work, with a small year
// track above it that shows where you are and lets you jump. Hovering a card lights its author's tile in the stage.
window.WorksTimeline = (() => {
  const START = 1530, END = 2025;
  const works = R.people.flatMap((p) => p.known.map((k) => ({ ...k, p }))).sort((a, b) => a.y - b.y || a.p.born - b.p.born);
  let scroller, track, windowEl, raf = 0, suppressClick = 0;

  const xOf = (year) => ((year - START) / (END - START)) * 1000;

  // The year track is plain positioned HTML (percentages), so it stays crisp at any width.
  function trackHtml() {
    const stack = new Map();
    const marks = works.map((w, i) => {
      const bucket = Math.round(xOf(w.y) / 8), level = stack.get(bucket) ?? 0;
      stack.set(bucket, level + 1);
      return `<i style="left:${xOf(w.y) / 10}%;bottom:${18 + level * 7}px;--tone:${R.tone(w.p)}" data-i="${i}"></i>`;
    }).join("");
    const years = [1550, 1650, 1750, 1850, 1950].map((y) => `<span style="left:${xOf(y) / 10}%">${y}</span>`).join("");
    return `<div class="wt-axis">${marks}<div class="win"></div><div class="years">${years}</div></div>`;
  }

  function card(w, i) {
    return `<li><button type="button" class="wcard" data-i="${i}" data-id="${w.p.id}" style="--tone:${R.tone(w.p)}">
      <span class="wy">${w.y}</span><span class="wt">${R.esc(w.t)}</span>
      <span class="wf">${R.dot(w.p)}${R.esc(w.p.short)}<em class="${w.inLibrary ? "in" : "out"}">${w.inLibrary ? "In the library" : "Not yet"}</em></span></button></li>`;
  }

  // Keep the highlighted window on the year track in step with the cards in view.
  function syncWindow() {
    raf = 0;
    const cards = scroller.querySelectorAll(".wcard"), left = scroller.scrollLeft, right = left + scroller.clientWidth;
    let first = null, last = null;
    for (const c of cards) {
      const x = c.parentElement.offsetLeft;
      if (x + c.offsetWidth > left && x < right) { first ??= c; last = c; }
    }
    if (!first) return;
    const a = xOf(works[first.dataset.i].y), b = xOf(works[last.dataset.i].y);
    windowEl.style.left = `${Math.max(0, a / 10 - 0.6)}%`;
    windowEl.style.width = `${Math.max(1.2, (b - a) / 10 + 1.2)}%`;
    track.querySelector(".range").textContent = `${works[first.dataset.i].y}–${works[last.dataset.i].y}`;
  }

  function jumpToYear(year, smooth) {
    const i = works.findIndex((w) => w.y >= year);
    const target = scroller.querySelectorAll("li")[i === -1 ? works.length - 1 : i];
    scroller.scrollTo({ left: target.offsetLeft - 8, behavior: smooth && !R.reduced ? "smooth" : "auto" });
  }

  function mount(host) {
    const inLib = works.filter((w) => w.inLibrary).length;
    host.innerHTML = `
      <div class="wt-track"><div class="wt-track-head"><span class="kicker">Year track</span><span class="range"></span>
        <span class="wt-btns"><button type="button" data-dir="-1" aria-label="Earlier">${icon("arrowLeft", 16)}</button><button type="button" data-dir="1" aria-label="Later">${icon("arrowRight", 16)}</button></span></div>
        ${trackHtml()}</div>
      <ol class="wt-row">${works.map(card).join("")}</ol>
      <p class="small-note">${works.length} works, ${inLib} of them in the library. Each square on the track is one work; drag the cards or click the track to move through the years.</p>`;
    scroller = host.querySelector(".wt-row");
    track = host.querySelector(".wt-track");
    windowEl = track.querySelector(".win");
    scroller.addEventListener("scroll", () => { raf ||= requestAnimationFrame(syncWindow); }, { passive: true });
    addEventListener("resize", () => { raf ||= requestAnimationFrame(syncWindow); });
    host.querySelector(".wt-btns").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) scroller.scrollBy({ left: Number(b.dataset.dir) * scroller.clientWidth * 0.8, behavior: R.reduced ? "auto" : "smooth" });
    });
    // Click or drag along the year track.
    const axis = track.querySelector(".wt-axis");
    const yearAt = (e) => { const r = axis.getBoundingClientRect(); return START + ((e.clientX - r.left) / r.width) * (END - START); };
    let scrubbing = false;
    axis.addEventListener("pointerdown", (e) => { scrubbing = true; axis.setPointerCapture(e.pointerId); jumpToYear(yearAt(e), true); });
    axis.addEventListener("pointermove", (e) => { if (scrubbing) jumpToYear(yearAt(e), false); });
    axis.addEventListener("pointerup", () => { scrubbing = false; });
    // Drag the row with a mouse (touch already scrolls natively).
    let drag = null;
    scroller.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") drag = { x: e.clientX, left: scroller.scrollLeft, moved: false }; });
    addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4 && !drag.moved) { drag.moved = true; scroller.classList.add("dragging"); }
      if (drag.moved) scroller.scrollLeft = drag.left - dx;
    });
    addEventListener("pointerup", () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      scroller.classList.remove("dragging");
      if (moved) suppressClick = performance.now() + 120;
    });
    scroller.addEventListener("click", (e) => { const c = e.target.closest(".wcard"); if (c && performance.now() > suppressClick) R.open(c.dataset.id); });
    scroller.addEventListener("pointerover", (e) => { const c = e.target.closest(".wcard"); if (c) R.light(c.dataset.id); });
    scroller.addEventListener("pointerleave", () => R.light(null));
    requestAnimationFrame(syncWindow);
  }

  return { mount };
})();
