// The site's outside scroll (src/components/OutsideScroll.tsx) for the mock-ups: the panel's content scrolls with no
// scrollbar of its own, and a pill-shaped thumb with no track sits just outside the panel's right edge, kept in step.
// OutsideScroll.wrap(panel) moves the panel's children into the scrolling part and returns
// { content, reset() }: write into `content`, call reset() to go back to the top.
(() => {
  const LONGEST_TRACK = 12; // beyond this many screens the bar stands for the list at a reduced scale, so the pill never becomes a dot

  function wrap(panel) {
    const frame = document.createElement("div"), viewport = document.createElement("div"), content = document.createElement("div");
    const bar = document.createElement("div"), extent = document.createElement("div");
    frame.className = "os-frame"; viewport.className = "os-viewport"; content.className = "os-content";
    bar.className = "os-bar"; bar.setAttribute("aria-hidden", "true"); bar.tabIndex = -1; extent.className = "os-extent";
    content.append(...panel.childNodes);
    viewport.append(content); frame.append(viewport); bar.append(extent);
    panel.classList.add("os-area"); panel.append(frame, bar);
    viewport.tabIndex = 0;

    const scale = () => {
      const listRange = viewport.scrollHeight - viewport.clientHeight, barRange = bar.scrollHeight - bar.clientHeight;
      return listRange > 0 && barRange > 0 ? barRange / listRange : 1;
    };
    const mirrored = new WeakMap();
    function measure() {
      bar.style.top = `${viewport.getBoundingClientRect().top - panel.getBoundingClientRect().top}px`;
      bar.style.height = `${viewport.clientHeight}px`;
      extent.style.height = `${Math.min(viewport.scrollHeight, viewport.clientHeight * LONGEST_TRACK)}px`;
      bar.hidden = viewport.scrollHeight <= viewport.clientHeight + 1;
      const target = viewport.scrollTop * scale();
      mirrored.set(bar, target); bar.scrollTop = target;
    }
    function sync(from, to) {
      const expected = mirrored.get(from);
      mirrored.delete(from);
      if (expected !== undefined && Math.abs(expected - from.scrollTop) <= 1) return;
      const ratio = scale(), target = from === viewport ? from.scrollTop * ratio : from.scrollTop / ratio;
      if (Math.abs(to.scrollTop - target) > 1) { mirrored.set(to, target); to.scrollTop = target; }
    }
    viewport.addEventListener("scroll", () => sync(viewport, bar));
    bar.addEventListener("scroll", () => sync(bar, viewport));
    const observer = new ResizeObserver(measure);
    observer.observe(viewport); observer.observe(content);
    measure();
    return { content, reset() { viewport.scrollTop = 0; measure(); } };
  }

  window.OutsideScroll = { wrap };
})();
