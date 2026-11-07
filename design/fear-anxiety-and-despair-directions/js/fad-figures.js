// Fear, anxiety and despair: each part's own figure. Every phrase drawn here was checked in its verse by build-data.py
// (drawn.py); this file only finds those phrases in the Berean text it is given and lights them.
window.FADFigures = (C, D) => {
  const { h, refLink, label, verseText } = C;
  const { passages } = D;
  const short = (id) => passages[id].label.split(" ").pop();
  // A verse with some of its words marked. Phrases are looked up in the verse text itself, never typed here.
  function marked(text, phrases, cls = "fad-mark") {
    const spans = phrases.map((p, i) => [text.indexOf(p), p.length, i]).filter(([at]) => at >= 0).sort((a, b) => a[0] - b[0]);
    const out = [];
    let last = 0;
    for (const [at, length, i] of spans) {
      if (at < last) continue;
      out.push(text.slice(last, at), h("mark", { class: cls, "data-mark": String(i) }, text.slice(at, at + length)));
      last = at + length;
    }
    return [...out, text.slice(last)];
  }
  const figure = (cls, question, sentence, ...body) => h("figure", { class: `fad-fig ${cls}` },
    h("figcaption", { class: "fad-fig-q" }, h("strong", {}, question), " ", sentence), ...body);
  const lightAll = (root, i) => root.querySelectorAll("mark").forEach((m) => m.classList.toggle("is-lit", m.dataset.mark === String(i)));

  // 01 What Moses says he cannot do, and God's answer, word against word.
  function match() {
    const M = D.match;
    const said = M.pairs.map((p) => p[0]), answer = M.pairs.map((p) => p[1]);
    const root = h("div", { class: "fad-match-row" },
      h("p", {}, label("Moses", "is-cry"), marked(verseText(M.cry), said), " ", refLink(M.cry)),
      h("ol", { class: "fad-match-pairs" }, M.pairs.map(([a, b], i) => h("li", { tabindex: "0", onmouseenter: () => lightAll(root, i), onfocus: () => lightAll(root, i), onmouseleave: () => lightAll(root, -1) },
        h("span", {}, a), h("i", { "aria-hidden": "true" }), h("span", {}, b)))),
      h("p", {}, label("God", "is-next"), marked(verseText(M.answer), answer), " ", refLink(M.answer)));
    return figure("fad-match", "How does God's answer match what Moses said?", "Three of Moses' phrases come back in God's reply. Point at a pair to find it in both verses.", root);
  }

  // 02 The order of God's care, along the road from the broom tree to Horeb and back.
  function care() {
    return figure("fad-care", "In what order does God care for Elijah?", "Sleep and bread first, twice; then the road, a question asked twice, a quiet voice, and only then work and a companion. The order is the verses' own.",
      h("ol", { class: "fad-care-road" }, D.care.map((s, i) => h("li", { class: i < 3 ? "is-body" : "" },
        h("b", {}, String(i + 1).padStart(2, "0")), h("span", { class: "fad-care-name" }, s.name), h("q", {}, s.t), refLink(s.r, short(s.r))))),
      h("p", { class: "fad-rule-note" }, "The first three are care for the body, marked with a filled step. The names of the steps are this study's; the quoted words are the Berean's."));
  }

  // 03 Jeremiah 20:7–18, verse by verse: praise in 13 and a curse in 14, with nothing between.
  function swing() {
    const S = D.swing;
    const out = h("p", { class: "fad-swing-read", "aria-live": "polite" });
    const show = (v) => out.replaceChildren(h("b", {}, v.name), " ", h("q", {}, v.t), " ", refLink(v.r));
    const first = S.verses.find((v) => v.name);
    show(first);
    return figure("fad-swing", "What happens between Jeremiah 20:13 and 20:14?", "Nothing. Praise, then the curse, in neighbouring verses. Each step is one verse; the ones the study quotes carry this study's one-word reading. Point at one to read it.",
      h("ol", { class: "fad-swing-row" }, S.verses.map((v) => v.name
        ? h("li", { class: `is-q${v.v === "13" ? " is-praise" : v.v === "14" ? " is-curse" : ""}`, tabindex: "0", onmouseenter: () => show(v), onfocus: () => show(v) }, h("span", {}, v.v), h("small", {}, v.name))
        : h("li", { "aria-hidden": "true" }, h("span", {}, v.v)))),
      out, h("p", { class: "fad-rule-note" }, "Read the whole passage: ", refLink(S.r), ". Verse 17 is not quoted on this page."));
  }

  // 04 Psalms 42–43 in miniature: the refrain comes back three times. The verse text is the Berean, set small.
  function refrain() {
    const R = D.refrain;
    return figure("fad-refrain", "How many times does the refrain come?", "Three. The sadness comes back between, and so does the refrain. The two psalms are set here in small type; the refrain is in full ink.",
      h("p", { class: "fad-mini-text" }, passages[R.r].verses.map(([cv, text]) => h("span", { class: R.refrain.includes(cv) ? "is-refrain" : "" }, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "fad-rule-note" }, "Found by script: the verses holding “", R.words, "” are ", R.refrain.join(", "), ". ", refLink(R.r)));
  }
  // 04 Psalm 88 in miniature: no refrain and no turn, but the words of trust are there.
  function dark() {
    const R = D.refrain;
    const trust = R.trust.map((t) => t.t);
    return figure("fad-dark", "What words in Psalm 88 show the psalmist still trusting?", "He names “the God of my salvation” and keeps praying, day and night and in the morning. The psalm ends in the dark; it is still a prayer.",
      h("p", { class: "fad-mini-text is-dark" }, passages[R.dark].verses.map(([cv, text], i, all) => h("span", { class: i === all.length - 1 ? "is-last" : "" }, h("sup", {}, cv), " ", marked(text, trust, "fad-trust"), " "))),
      h("p", { class: "fad-rule-note" }, R.trust.map((t, i) => [i ? " · " : "", h("q", {}, t.t), " ", refLink(t.r, t.v)])));
  }

  // 05 Psalm 46's "though" clauses against its refrain; Psalm 56:3, fear and trust in one sentence.
  function though() {
    const T = D.though;
    return figure("fad-though", "What makes it possible to say “we will not fear”?", "Not a calm world: four upheavals stand in the same breath. The refrain gives the reason twice.",
      h("div", { class: "fad-though-row" },
        h("div", {}, h("p", { class: "fad-though-lead" }, h("q", {}, T.lead), ", though…"), h("ul", {}, T.clauses.map((c) => h("li", {}, c))), refLink(T.r)),
        h("div", { class: "fad-though-refrain" }, label("The refrain", "is-next"), h("q", {}, T.refrain.t), h("span", {}, T.refrain.rs.map((r, i) => [i ? " · " : "", refLink(r, short(r))])))),
      h("p", { class: "fad-afraid" }, h("span", { class: "is-fear" }, T.afraid.fear), h("i", { "aria-hidden": "true" }), h("span", { class: "is-trust" }, T.afraid.trust), " ", refLink(T.afraid.r)));
  }

  // 06 Every "do not fear" in the two readings, each with the reason that follows it.
  function reasons() {
    const R = D.reasons;
    return figure("fad-reasons", "What reason follows each “do not fear”?", `Every one is about God: who He is, or what He will do or has done. Found by script: these are all ${R.items.length} in the two readings.`,
      h("ol", { class: "fad-reason-list" }, R.items.map((r) => h("li", {}, h("span", { class: "fad-command" }, r.command), h("span", { class: "fad-reason" }, r.reason), refLink(r.r, short(r.r))))),
      h("p", { class: "fad-when" }, label("When, not if", "is-next"), h("q", {}, R.when.t), " ", refLink(R.when.r)));
  }

  return { match, care, swing, refrain, dark, though, reasons };
};
