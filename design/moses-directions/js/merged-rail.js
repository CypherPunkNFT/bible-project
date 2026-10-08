// H · the vertical navigation from C (cinema), brought back: one dot per section at the right edge, and a pill that
// moves to the section you are in. Choosing a dot jumps there. On a phone it folds into a small pill of dots.
(() => {
  window.MergedRail = {
    html: (items) => `<nav class="mg-rail" aria-label="Sections of this page"><i class="mg-rail-pill" aria-hidden="true"></i>
      ${items.map((s, i) => `<a href="#${s.target}" data-rail="${s.target}" style="--i:${i}"><i></i><span>${esc(s.label)}</span></a>`).join("")}</nav>`,
    // The section that holds the middle of the screen is the current one; the pill slides to its dot.
    wire(main, items) {
      const rail = main.querySelector(".mg-rail"), links = [...rail.querySelectorAll("[data-rail]")], pill = rail.querySelector(".mg-rail-pill");
      const sections = items.map((s) => main.querySelector(`#${s.target}`));
      let current = -1;
      const setCurrent = (i) => {
        if (i === current || i < 0) return; current = i;
        links.forEach((a, k) => a.toggleAttribute("aria-current", k === i));
        const a = links[i];
        pill.style.transform = `translateY(${(a.offsetTop + a.offsetHeight / 2).toFixed(1)}px) translateY(-50%)`;
      };
      const update = () => {
        const mid = innerHeight * .45;
        let best = 0;
        sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= mid) best = i; });
        setCurrent(best);
      };
      let raf = 0;
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
      const onClick = (e) => { const a = e.target.closest("[data-rail]"); if (!a) return; e.preventDefault(); main.querySelector(`#${a.dataset.rail}`)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
      addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); rail.addEventListener("click", onClick);
      update();
      return () => { cancelAnimationFrame(raf); removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); };
    },
  };
})();
