// What Scripture promises the sick: the seven parts and the close. Called by ih.js once the opening is drawn.
window.IHParts = () => {
  const { page, h, art, label, refLink, runs, sectionHead, study, passages, figures, sources, toConfirm } = window.IHPage;

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "hook": return h("p", { class: "ih-hook" }, runs(block.runs));
      case "h3": return h("h3", { class: "ih-h3" }, block.t);
      case "quote": return h("figure", { class: "ih-quote" },
        h("blockquote", {}, block.part || passages[block.r].verses.map((v) => v[1]).join(" ")),
        h("figcaption", {}, refLink(block.r, block.label), block.part ? " · Berean Standard Bible, part of the verse" : " · Berean Standard Bible"));
      case "care": return h("aside", { class: "ih-care" }, label("With care"), h("p", {}, runs(block.runs)));
      case "open": return h("aside", { class: "ih-open" }, label("Read differently"), h("p", {}, runs(block.runs)));
      default: console.error(`What Scripture promises the sick: unknown block ${block.k}`); return "";
    }
  }

  // Views where Christians differ sit side by side under one label, and the page does not choose.
  function views(list) {
    return h("div", { class: "ih-views" }, label("Shown, not chosen"),
      h("div", { class: "ih-views-grid" }, list.map((v) => h("div", { class: "ih-view" }, h("h4", {}, v.label), h("p", {}, runs(v.runs))))));
  }

  function body(part) {
    const holder = h("div", { class: "ih-body" });
    const [draw, place] = window.IHFigures[part.n] || [];
    let drawn = false, pending = [];
    const flush = () => { if (pending.length) holder.append(views(pending)); pending = []; };
    part.blocks.filter((b) => b.k !== "hook").forEach((block) => {
      if (block.k === "view") { pending.push(block); return; }
      flush();
      holder.append(renderBlock(block));
      if (draw && !drawn && place === block.k) { holder.append(draw()); drawn = true; }
    });
    flush();
    if (draw && !drawn) holder.append(draw());
    holder.append(h("dl", { class: "ih-ask" },
      h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(part.consider))),
      h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(part.reflect)))));
    return holder;
  }

  const parts = h("div", { class: "ih-parts" });
  study.parts.forEach((part) => {
    const [name, ...rest] = part.title.split(": ");
    const hook = part.blocks.find((b) => b.k === "hook");
    parts.append(h("section", { class: "t-sec ih-part", id: `part-${part.n}`, "aria-labelledby": `part-${part.n}-title` },
      h("header", { class: "ih-part-head" },
        h("span", { class: "ih-part-n", "aria-hidden": "true" }, part.n),
        h("div", { class: "ih-part-title" },
          h("h2", { id: `part-${part.n}-title` }, name, rest.length ? [h("span", { class: "ih-colon" }, ": "), h("em", {}, rest.join(": "))] : null),
          hook ? h("p", { class: "ih-hook" }, runs(hook.runs)) : null,
          h("p", { class: "ih-readings" }, label("Main readings"), " ", runs(part.readings_runs))),
        art(IHArt.parts[part.n], "ih-mini-wrap")),
      body(part)));
  });
  page.append(parts);

  // ── Close: what He does not promise, what He does, the question, and the promises printed in full ──
  const close = study.close;
  const [summary, again] = close.blocks;
  const [title, turn] = close.title.split(", ");
  page.append(h("section", { class: "t-sec ih-close", id: "close" },
    sectionHead("→", title + ",", turn + "."),
    h("p", { class: "ih-close-text" }, runs(summary.runs)),
    h("div", { class: "ih-ledger" },
      h("div", { class: "ih-not" }, h("h3", {}, "He does not promise"), h("ul", {}, figures.notPromised.map((line) => h("li", {}, line)))),
      h("div", { class: "ih-does" }, h("h3", {}, "He does promise"), h("ul", {}, figures.promises.map((p) => h("li", {}, p.line, " ", refLink(p.r, p.label)))))),
    h("p", { class: "ih-question" }, runs(close.question)),
    h("p", { class: "ih-again" }, runs(again.runs)),
    h("div", { class: "ih-promised" }, figures.promises.map((p) => h("figure", {},
      h("blockquote", {}, passages[p.r].verses.map((v) => v[1]).join(" ")), h("figcaption", {}, refLink(p.r, p.label), " · BSB")))),
    art(IHArt.close, "ih-close-art"),
    h("div", { class: "ih-sources", id: "to-confirm" }, h("h3", {}, "Sources"),
      h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use))),
      h("p", {}, `† marks ${toConfirm.length} places where the wording of an outside source, or a fact about it, is not yet compared with the published text.`)),
    h("a", { class: "ih-back", href: "/study/theology?area=life" }, art(icon("arrowLeft", 16)), "Back to Living the Christian Life")));
};
