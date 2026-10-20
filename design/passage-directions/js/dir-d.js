// Direction D · Merger, the owner's combination of the other three. A's opening (Romans 5:1 under the lens); B's prologue
// and its three chapters, each with its giant numeral, its strip of copies, sideways scenes and "How an editor reasons";
// one section where A's broken edge and C's four kinds of evidence become one, drawn with C's torn edge of P46 and the
// switch above the drawing; then A's editions, A's cabinet of six witnesses and the closing. B's side dots keep the place.
window.Directions = window.Directions || {};
(() => {
  const { CASES, EDGE } = PM;
  const { sectionHead, closing, cite, recButton, choice } = PMX;
  const A = window.Directions.a.parts, B = window.Directions.b.parts, C = window.Directions.c.parts;

  // The restoration test: the switch first, then C's torn edge with its three labels, then what the switch shows; on the
  // right, "Reading the marks" ties each record of the word to its part of the drawing. Pointing at the switch with a
  // mouse previews the supplied letters; a click or tap turns them on or off for good.
  function restoration(el) {
    el.innerHTML = `<div class="d-edge"><div class="d-edge-main">
        <p class="kicker">${esc(EDGE.where)}</p><h3>${EDGE.title}</h3><p class="cr-lead">${esc(EDGE.lead)}</p>
        <label class="pm-switch d-edge-switch"><input type="checkbox" data-restore><span></span>Show supplied letters</label>
        <figure class="ch-art d-edge-art" aria-hidden="true">${Evidence.edgeArt({ big: true })}
          <span class="ch-tag ch-tag-ink"><i></i>Surviving ink<small>θελ · three letters</small></span>
          <span class="ch-tag ch-tag-break"><i></i>The break<small>papyrus lost at the line’s end</small></span>
          <span class="ch-tag ch-tag-sup"><i></i>Supplied, not seen<small>[ημα] · θέλημα, “will”</small></span></figure>
        <div class="ed-say" role="status"><p>${esc(EDGE.off)}</p></div>
        <small class="pm-note">${esc(EDGE.note)}</small>
        ${cite(EDGE.links)}${recButton("Q1513469", "Open the record for P46")}</div><aside class="d-edge-marks"></aside></div>`;
    const box = el.querySelector(".d-edge"), sw = el.querySelector(".d-edge-switch");
    EdgeMarks.mount(el.querySelector(".d-edge-marks"), box);
    sw.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") box.classList.add("is-preview"); });
    sw.addEventListener("pointerleave", () => box.classList.remove("is-preview"));
    el.querySelector("[data-restore]").addEventListener("change", (e) => {
      box.classList.toggle("is-restored", e.target.checked);
      box.querySelector(".ed-say p").textContent = e.target.checked ? EDGE.on : EDGE.off;
    });
  }

  // The copying model with its paths always shown: no button, and the line beneath says what the paths show.
  function relatedCopies(el) {
    Evidence.copying(el);
    el.querySelector("[data-trace]").remove();
    el.classList.add("is-traced");
    const [h, p] = PM.COPYING.shown;
    el.querySelector(".cp-say").innerHTML = `<b>${esc(h)}</b><p>${esc(p)}</p>`;
  }

  // A's editions, with the short note on the CBGM replaced by the method in five steps beside a flow diagram.
  function editions(sec) {
    A.editions(sec, "06");
    const old = sec.querySelector(".eds-cbgm"), box = document.createElement("div");
    old.replaceWith(box);
    CBGM.mount(box);
  }

  // C's four kinds of evidence; the first is the broken edge above, the other three keep C's own tests.
  function gaps(sec) {
    const kinds = C.KINDS.map((k) => (k.id === "restore" ? { ...k, title: "At the broken edge", mount: restoration } : k.id === "related" ? { ...k, mount: relatedCopies } : k));
    sec.innerHTML = `${sectionHead("05", "At the broken edge · Four kinds of evidence", "Not every gap <em>is the same gap.</em>", "Presence, absence, loss and restoration are different kinds of evidence. Start at the torn edge of P46, then test the other three on real cases.")}
      <div class="c-kinds" role="group" aria-label="Kinds of evidence">${kinds.map((k, i) => `<button type="button" data-kind="${k.id}" aria-pressed="${i === 0}"><svg viewBox="0 0 24 24" aria-hidden="true">${k.icon}</svg><b>${esc(k.title)}</b><small>${esc(k.line)}</small></button>`).join("")}</div>
      <div class="c-kind-stage" aria-live="polite"></div>`;
    const stage = sec.querySelector(".c-kind-stage");
    const show = (id) => { stage.className = "c-kind-stage"; stage.innerHTML = ""; kinds.find((x) => x.id === id).mount(stage); };
    choice(sec, "[data-kind]", (b) => show(b.dataset.kind));
    show("restore");
  }

  function chapters(add) {
    const { chapter, reasonScene, keyList } = B;
    // The desk with its threads kept clear of the lettering.
    const deskScene = (id) => ({ title: "The readings", mount: (el) => Desk.mount(el, { caseId: id, menu: false, clearText: true }) });
    chapter(add("b-gal"), { num: "I", kicker: "Galatians 1:3", title: "Spelling &amp; order. <em>Small differences, different kinds.</em>", lead: esc(CASES[0].context), book: 47,
      keys: keyList([["Q1513469", "P46"], ["Q209285", "B"], ["Q152962", "א"]]), landKey: "galatians",
      scenes: [deskScene("galatians"), { title: "Read the apparatus", mount: (el) => CloseReading.apparatus(el) }, reasonScene("galatians")] });
    chapter(add("b-rom"), { num: "II", kicker: "Romans 5:1", title: "A changed vowel. <em>One letter, a different force.</em>", lead: esc(CASES[1].context), book: 44,
      keys: keyList([["Q1513469", "P46"], ["Q209285", "B"], ["Q152962", "א"]]), landKey: "romans",
      scenes: [deskScene("romans"), { title: "Three questions", mount: (el) => CloseReading.lenses(el) }, reasonScene("romans")] });
    chapter(add("b-mark"), { num: "III", kicker: "Mark 16:8–20", title: "A disputed ending. <em>Twelve verses, several histories.</em>", lead: esc(CASES[2].context), book: 40,
      keys: keyList([["Q697885", "P45"], ["Q209285", "B"], ["Q152962", "א"], ["Q318233", "A"], ["Q6870196", "304"]]), landKey: "mark",
      scenes: [deskScene("mark"), { title: "Read the join", mount: (el) => CloseReading.endings(el) }, reasonScene("mark")] });
  }

  const STOPS = [["a-landing", "Opening"], ["b-prologue", "01 · Before comparing"], ["b-gal", "02 · Galatians"], ["b-rom", "03 · Romans"], ["b-mark", "04 · Mark"], ["d-gaps", "05 · Kinds of evidence"], ["a-editions", "06 · The editions"], ["a-cabinet", "07 · Six witnesses"], ["a-close", "08 · Read further"]];
  const NUM = Object.fromEntries(STOPS.slice(1).map(([id, label]) => [id, label.slice(0, 2)]));

  // The prologue and the chapters are drawn by B without numbers; give their label lines the house "01 · LABEL" form.
  function numberHeads(wrap) {
    for (const id of ["b-prologue", "b-gal", "b-rom", "b-mark"]) {
      const k = wrap.querySelector(`#${id} .pm-head .kicker, #${id} .bc-side > .kicker`);
      if (k && !k.querySelector(".ms-num")) k.insertAdjacentHTML("afterbegin", `<span class="ms-num">${NUM[id]}</span><span class="ms-dot" aria-hidden="true">·</span>`);
    }
  }

  function mount(wrap) {
    const add = (id, cls = "") => { const s = document.createElement("section"); s.id = id; s.className = `t-sec pm-sec sec-${id} ${cls}`; wrap.append(s); return s; };
    const run = (name, fn) => { try { fn(); } catch (error) { console.error(`Direction D: ${name} failed`, error); } };
    run("opening", () => {
      const s = add("a-landing"); A.landing(s);
      // A's route names A's own sections; here it lists D's numbered sections, the same as the side dots.
      s.querySelector(".pm-route").innerHTML = STOPS.slice(1).map(([id, label]) => { const [n, name] = label.split(" · "); return `<a href="#${id}"><span>${n}</span>${esc(name)}</a>`; }).join("");
    });
    run("prologue", () => B.prologue(add("b-prologue")));
    run("chapters", () => chapters(add));
    run("broken edge", () => gaps(add("d-gaps")));
    run("editions", () => editions(add("a-editions")));
    run("cabinet", () => A.cabinet(add("a-cabinet"), "07"));
    run("closing", () => { add("a-close").innerHTML = closing("08"); });
    run("numbers", () => numberHeads(wrap));
    run("rail", () => B.rail(wrap, STOPS));
  }
  window.Directions.d = { mount };
})();
