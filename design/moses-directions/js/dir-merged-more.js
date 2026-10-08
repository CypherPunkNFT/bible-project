// H · second page (#merged-more): the approved sections that do not fit on the merged page, compact: the constellation
// (D), the cabinet with its intro and the interactive through-time strip (F), and the long memory (G). Each is the
// direction's own code mounted into its own part of this page; only the parts the owner approved are shown.
(() => {
  const PARTS = [
    { id: "constellation", dir: "constellation", n: "I", kick: "The constellation", h: "Everyone and everything around him", intro: /blooms/ },
    { id: "cabinet", dir: "objects", n: "II", kick: "The cabinet", h: "In his hands", intro: /cabinet lights up/ },
    { id: "memory", dir: "memory", n: "III", kick: "The long memory", h: "How the rest of Scripture remembers him", intro: /Light travels/ },
  ];
  DIRECTIONS["merged-more"] = {
    name: "More of Moses", swatch: "#c9842f",
    mount(main) {
      main.innerHTML = `<section class="wrap mm2-head">
          <div class="topline"><a href="#merged">${icon("arrowLeft", 15)}Back to Moses (the merged page)</a><span>Second page · three approved sections</span></div>
          <div class="mm2-title"><h1>More of Moses</h1><nav class="mm2-index" aria-label="On this page">${PARTS.map((p) => `<a href="#merged-more" data-part-go="${p.id}"><b>${p.n}</b>${esc(MORE_PARTS.find((x) => x.id === p.id).name)}</a>`).join("")}</nav></div></section>
        ${PARTS.map((p) => `<section class="mm2-part" id="mm2-${p.id}" data-part="${p.id}"><div class="wrap mm2-part-head"><span class="mg-kick">${p.n} · ${esc(p.kick)}</span>${p.id === "constellation" ? `<h2>${esc(p.h)}</h2>` : ""}</div>
          <div class="dir-${p.dir} mm2-host" data-host="${p.id}"></div></section>`).join("")}`;
      // Each direction plays its opening animation on mount; here it waits until its part is on screen. Until then the
      // part shows its last frame, so nothing is ever half-drawn.
      const run = Clock.run, waiting = new Map(), shown = new Set();
      Clock.run = (job) => {
        const part = PARTS.find((p) => p.intro.test(job.label ?? ""));
        if (part && !shown.has(part.id)) { waiting.set(part.id, job); job.frame(1); job.done?.(); return; }
        run(job);
      };
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        const id = e.target.dataset.part;
        if (!e.isIntersecting || shown.has(id)) return;
        shown.add(id);
        const job = waiting.get(id); if (job) { waiting.delete(id); run(job); }
      }), { threshold: .3 });
      const offs = PARTS.map((p) => {
        try { return DIRECTIONS[p.dir].mount(main.querySelector(`[data-host="${p.id}"]`)) ?? (() => {}); }
        catch (error) { console.error(`merged-more: ${p.dir} failed to mount`, error); main.querySelector(`[data-host="${p.id}"]`).innerHTML = `<p class="wrap">This part failed to draw: ${esc(error.message)}</p>`; return () => {}; }
      });
      main.querySelectorAll(".mm2-part").forEach((s) => io.observe(s));
      const goPart = (id) => main.querySelector(`#mm2-${id}`)?.scrollIntoView({ behavior: "auto" });
      const onClick = (e) => { const a = e.target.closest("[data-part-go]"); if (a) { e.preventDefault(); goPart(a.dataset.partGo); } };
      main.addEventListener("click", onClick);
      let target = null;
      try { target = sessionStorage.getItem("mg-more"); sessionStorage.removeItem("mg-more"); } catch (error) { console.warn("merged-more: could not read the section to open", error); }
      if (target) requestAnimationFrame(() => setTimeout(() => goPart(target), 60)); else scrollTo(0, 0);
      return () => { Clock.run = run; io.disconnect(); offs.forEach((f) => f()); main.removeEventListener("click", onClick); };
    },
  };
})();
