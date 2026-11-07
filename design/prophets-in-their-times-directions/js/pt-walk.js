// The six questions: six gold words on one rule. Choosing one opens its reading beside the rule, with its main passage set out.
(() => {
  if (!window.PTK) return;
  const { h, refLink, runs, plain, page, sectionHead, partView, passageText, roving } = PTK;
  const { study, passages, acts, actLabels } = window.PT;
  const panel = h("div", { class: "pt-reading", id: "reading", tabindex: "-1" });
  const narrow = matchMedia("(max-width: 900px)");
  const rail = study.readings.map((reading) => h("button", { type: "button", class: "pt-word", "aria-pressed": "false", "data-q": reading.slug, onclick: () => choose(reading.slug, true) },
    h("span", { class: "pt-word-n" }, reading.n), h("span", { class: "pt-word-w" }, plain(reading.word)), h("span", { class: "pt-word-ask" }, plain(reading.ask))));
  const actView = (act) => h("section", { class: "pt-act" },
    h("h5", {}, act.title, " ", refLink(act.ref, act.refLabel)),
    h("dl", {}, Object.entries(actLabels).map(([key, label]) => {
      const line = act.lines[key];
      return h("div", { class: line ? "" : "is-empty" }, h("dt", {}, label), h("dd", {}, line ? [`“${line.words}” `, refLink(line.r, line.label)] : "The text does not say."));
    }), h("div", { class: "is-empty" }, h("dt", {}, "Left unsaid"), h("dd", {}, act.unsaid))));
  const neighbours = (index) => h("nav", { class: "pt-neighbours", "aria-label": "Other questions" },
    index > 0 ? h("button", { type: "button", class: "pt-action", onclick: () => choose(study.readings[index - 1].slug, true, true) }, `← ${plain(study.readings[index - 1].word)}`) : h("span"),
    index < study.readings.length - 1 ? h("button", { type: "button", class: "pt-action", onclick: () => choose(study.readings[index + 1].slug, true, true) }, `${plain(study.readings[index + 1].word)} →`) : null);
  function drawReading(reading) {
    const [main, ...also] = reading.read;
    panel.replaceChildren(...[
      h("p", { class: "pt-small" }, `${reading.n} · ${plain(reading.word)}`),
      h("h3", {}, reading.title),
      h("p", { class: "pt-ask" }, runs(reading.ask)),
      h("p", { class: "pt-hook" }, runs(reading.hook)),
      h("section", { class: "pt-main" },
        h("p", { class: "pt-small" }, "Read first · ", refLink(main, passages[main].label), " · Berean Standard Bible"),
        passageText(main),
        also.length ? h("p", { class: "pt-also" }, "Then: ", also.flatMap((id, index) => [index ? ", " : "", refLink(id, passages[id].label)]), ".") : null),
      reading.slug === "act" ? h("div", { class: "pt-acts" }, h("p", { class: "pt-small" }, "The same four questions of three acts"), h("div", { class: "pt-acts-row" }, acts.map(actView))) : null,
      ...reading.parts.map(partView),
      h("section", { class: "pt-after" }, h("p", { class: "pt-pass" }, "Look closely"), h("p", {}, runs(reading.look))),
      h("section", { class: "pt-after" }, h("p", { class: "pt-pass" }, "Your response"), h("p", {}, runs(reading.response))),
      neighbours(study.readings.indexOf(reading)),
    ].filter(Boolean));
  }
  function choose(slug, keep, move) {
    if (keep) PTK.setView({ q: slug });
    drawReading(PTK.readings.get(slug));
    for (const button of rail) button.setAttribute("aria-pressed", String(button.dataset.q === slug));
    if (move || (keep && narrow.matches)) { panel.scrollIntoView({ block: "start", behavior: PTK.reducedMotion.matches ? "auto" : "smooth" }); panel.focus({ preventScroll: true }); }
  }
  page.append(h("section", { class: "t-sec pt-walk", id: "questions" },
    sectionHead("02", "Six questions,", "asked of any prophet", ...runs(study.frame)),
    h("div", { class: "pt-walk-grid" }, h("div", { class: "pt-rail" }, rail), panel)));
  roving(rail);
  choose(PTK.state.q, false);
  PTK.syncers.push(() => choose(PTK.state.q, false));
})();
