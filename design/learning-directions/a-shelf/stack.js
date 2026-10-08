// A · The shelf: what the stack does. Pointing at a book lifts it and fills the panel; clicking keeps it. The age bar
// (and the left and right keys) slides one stack out and the next in; the address keeps the age (#a/teens) without
// redrawing the page. The slide is a Web Animation named "the stack sliding", so the ticker can slow and step it.
(() => {
  const SLIDE_MS = 680, EASE = "cubic-bezier(.65, 0, .25, 1)";

  function wireStack(wrap, firstAge) {
    const stage = wrap.querySelector(".st-stage"), bar = wrap.querySelector(".ag-switch"), chips = [...wrap.querySelectorAll(".sh-kind")];
    const order = LEARN.AUDIENCES.map((a) => a.id);
    let age = firstAge, kind = null, slide = null;

    const defaultBook = (v) => (v.querySelector(".bk.ready") ?? v.querySelector(".bk"));
    // The lead: a thin line from the shown book's right end to the panel's rule.
    function lead(v, el) {
      const line = v.querySelector(".st-lead"), panel = v.querySelector(".st-panel");
      if (!el || getComputedStyle(panel).borderLeftStyle === "none") { line.hidden = true; return; }
      const box = v.getBoundingClientRect(), b = el.getBoundingClientRect(), p = panel.getBoundingClientRect();
      const x1 = b.right - box.left + 6, x2 = p.left - box.left;
      line.hidden = x2 - x1 < 8;
      Object.assign(line.style, { left: `${x1}px`, width: `${x2 - x1}px`, top: `${b.top + b.height / 2 - box.top}px` });
    }
    function show(v, el) {
      v.querySelector(".st-panel").innerHTML = DIRS.a.panel(LEARN.I[el.dataset.id]);
      v.querySelectorAll(".bk.is-on").forEach((x) => x.classList.remove("is-on"));
      el.classList.add("is-on");
      lead(v, el);
    }
    function keep(v, el) {
      v.querySelectorAll(".bk[aria-pressed='true']").forEach((x) => x.setAttribute("aria-pressed", "false"));
      el.setAttribute("aria-pressed", "true");
      v.kept = el;
      show(v, el);
    }
    function lightKind(v) {
      v.querySelectorAll(".bk").forEach((el) => { el.classList.toggle("dim", !!kind && el.dataset.kind !== kind); el.classList.toggle("lit", !!kind && el.dataset.kind === kind); });
      const items = LEARN.forAudience(v.dataset.aud);
      chips.forEach((c) => { const n = items.filter((it) => it.kind === c.dataset.kind).length; c.querySelector("[data-count]").textContent = n ? `${n} here` : "None here"; c.classList.toggle("none", !n); });
    }
    function wireView(v) {
      const stackEl = v.querySelector(".st-stack");
      stackEl.addEventListener("pointerover", (e) => { const el = e.target.closest(".bk"); if (el && !el.classList.contains("is-on")) show(v, el); });
      stackEl.addEventListener("pointerleave", () => { if (v.kept && !v.kept.classList.contains("is-on")) show(v, v.kept); });
      stackEl.addEventListener("click", (e) => { const el = e.target.closest(".bk"); if (el) keep(v, el); });
      v.querySelector(".st-panel").addEventListener("click", (e) => { const b = e.target.closest("[data-page]"); if (b) DIRS.a.viewer(Number(b.dataset.page)); });
      lightKind(v);
      keep(v, defaultBook(v));
    }

    function endSlide() {
      if (!slide) return;
      const s = slide;
      slide = null;
      s.anims.forEach((a) => a.cancel());
      s.old.remove();
      s.next.classList.remove("is-incoming");
      stage.classList.remove("is-sliding");
      lead(s.next, s.next.kept);
    }
    function go(id) {
      if (!LEARN.A[id] || id === age) return;
      endSlide();
      const sign = order.indexOf(id) > order.indexOf(age) ? 1 : -1;
      age = id;
      history.replaceState(null, "", `#a/${id}`);
      bar.querySelectorAll("a").forEach((a) => a.toggleAttribute("aria-current", a.dataset.age === id));
      bar.querySelector("[aria-current]")?.setAttribute("aria-current", "page");
      const old = stage.querySelector(".st-view"), h0 = stage.offsetHeight;
      stage.insertAdjacentHTML("beforeend", DIRS.a.view(LEARN.A[id]));
      const next = stage.lastElementChild;
      next.classList.add("is-incoming");
      stage.classList.add("is-sliding");
      wireView(next);
      const h1 = next.offsetHeight, shift = stage.clientWidth + 64;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const opts = { duration: reduce ? 1 : SLIDE_MS, easing: EASE, fill: "both", id: "the stack sliding" };
      const anims = [old.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-sign * shift}px)` }], opts),
        next.animate([{ transform: `translateX(${sign * shift}px)` }, { transform: "translateX(0)" }], opts),
        stage.animate([{ height: `${h0}px` }, { height: `${h1}px` }], opts)];
      slide = { anims, old, next };
      Promise.all(anims.map((a) => a.finished)).then(() => { if (slide?.next === next) endSlide(); }, () => {});
      Ticker.refresh();
    }

    bar.addEventListener("click", (e) => {
      const a = e.target.closest("[data-age]");
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      go(a.dataset.age);
    });
    const onKey = (e) => {
      if (!wrap.isConnected) { removeEventListener("keydown", onKey); return; }
      if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || document.querySelector(".viewer")) return;
      const i = order.indexOf(age);
      if (e.key === "ArrowRight") { e.preventDefault(); go(order[(i + 1) % order.length]); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(order[(i - 1 + order.length) % order.length]); }
    };
    addEventListener("keydown", onKey);
    chips.forEach((chip) => chip.addEventListener("click", () => {
      kind = chip.getAttribute("aria-pressed") === "true" ? null : chip.dataset.kind;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.kind === kind)));
      stage.querySelectorAll(".st-view").forEach(lightKind);
    }));
    // The bar rides along only while the stack is on screen; below it, it slides away behind the A · B · C · D bar.
    new IntersectionObserver(([entry]) => bar.classList.toggle("is-away", !entry.isIntersecting), { rootMargin: "0px 0px -120px 0px" }).observe(wrap.querySelector(".st-sec"));
    const onResize = () => { if (!wrap.isConnected) { removeEventListener("resize", onResize); return; } const v = stage.querySelector(".st-view:last-child"); if (v?.kept) lead(v, v.querySelector(".bk.is-on") ?? v.kept); };
    addEventListener("resize", onResize);
    wireView(stage.querySelector(".st-view"));
    document.fonts?.ready.then(() => onResize());
  }

  Object.assign(DIRS.a, { wireStack });
})();
