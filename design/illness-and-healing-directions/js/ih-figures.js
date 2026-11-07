// What Scripture promises the sick: the figures each part draws beside its text. Every phrase comes from data.js,
// where build-data.py has checked it in its verse; every count is the Berean's.
window.IHFigures = (() => {
  if (!window.IHCore) return null;
  const { h, label, refLink, phrase } = window.IHCore;
  const { psalms, figures } = window.IH;

  // 02: each psalm as a row of ticks, one per verse; the verse the study quotes is marked; the last verse is quoted.
  function psalmEnds() {
    return h("figure", { class: "ih-fig ih-psalms" },
      h("figcaption", { class: "ih-fig-q" }, label("Where does each prayer end?"), " Each tick is one verse. The mark is the verse this part quotes; the words are the psalm's last verse."),
      psalms.map((p) => h("div", { class: `ih-psalm${p.psalm === 88 ? " is-dark" : ""}` },
        h("p", { class: "ih-psalm-name" }, refLink(p.r, `Psalm ${p.psalm}`), h("small", {}, `${p.count} verses`)),
        h("div", { class: "ih-ticks", "aria-hidden": "true" }, Array.from({ length: p.count }, (_, i) => h("i", { class: i + 1 === p.marked.verse ? "is-marked" : (i + 1 === p.count ? "is-last" : "") }))),
        h("p", { class: "ih-psalm-end" }, h("b", {}, p.ends), " ", phrase(p.last)))),
    );
  }

  // 03: Hezekiah in five steps, with the fifteen years drawn as a span from the answer to his death.
  function hezekiah() {
    return h("figure", { class: "ih-fig ih-steps" },
      h("figcaption", { class: "ih-fig-q" }, label("What happened, in order?"), " A word, a prayer, an answer, a remedy, and in time an end."),
      h("ol", {}, figures.hezekiah.map((s, i) => h("li", { class: i >= 2 ? "in-span" : "" }, h("span", { class: "ih-step-n" }, s.step), phrase(s)))),
      h("p", { class: "ih-span-note" }, h("span", { "aria-hidden": "true" }), "Fifteen years, from the answer to his death"));
  }

  // 04: the two verses the part's own question asks the reader to set side by side.
  function pair() {
    return h("figure", { class: "ih-fig ih-pair" },
      h("figcaption", { class: "ih-fig-q" }, label("Side by side"), " Two friends of Paul, two endings, both written down."),
      h("div", { class: "ih-pair-row" }, figures.pair.map((p, i) => [i ? h("span", { class: "ih-pair-rule", "aria-hidden": "true" }) : null,
        h("div", { class: "ih-pair-side" }, h("span", { class: "ih-who" }, p.who), phrase(p))])),
      h("p", { class: "ih-pair-beneath" }, label("Beneath both"), " ", phrase(figures.pairBeneath)));
  }

  // 05: four prayers in their own words and what followed. The amount of faith does not set the outcome.
  function faith() {
    return h("figure", { class: "ih-fig ih-faith" },
      h("figcaption", { class: "ih-fig-q" }, label("Does more faith mean healing?"), " Four prayers in their own words, and what followed each."),
      h("div", { class: "ih-faith-grid" }, figures.faith.map((f) => h("div", { class: "ih-faith-cell" },
        h("span", { class: "ih-who" }, f.who), phrase(f.asked, "is-asked"), h("span", { class: "ih-arrow", "aria-hidden": "true" }, "↓"), phrase(f.followed, "is-followed")))),
      h("p", { class: "ih-fig-line" }, figures.faithLine));
  }

  // 06: who acts in James 5:14-16, each in the verse's words.
  function actors() {
    return h("figure", { class: "ih-fig ih-actors" },
      h("figcaption", { class: "ih-fig-q" }, label("Who acts?"), " Four parts in one passage, each in its own words."),
      h("ol", {}, figures.actors.map((a) => h("li", {}, h("span", { class: "ih-who" }, a.who), phrase(a)))));
  }

  // 07: one song, read two ways by the New Testament.
  function song() {
    return h("figure", { class: "ih-fig ih-song" },
      h("figcaption", { class: "ih-fig-q" }, label("One song, two readings"), " Matthew and Peter quote the same song and apply it to different things."),
      h("div", { class: "ih-song-grid" }, figures.song.map((s) => h("div", { class: "ih-song-col" },
        h("p", { class: "ih-song-from" }, phrase(s.from)),
        h("span", { class: "ih-arrow", "aria-hidden": "true" }, "↓"),
        h("p", { class: "ih-song-to" }, phrase(s.to)),
        h("p", { class: "ih-song-applied" }, h("b", {}, s.applied), " ", phrase(s.context))))));
  }

  // Where each figure stands in its part: after the part's first block quotation, or at the end of the reading.
  return { "02": [psalmEnds, "quote"], "03": [hezekiah, "quote"], "04": [pair, "end"], "05": [faith, "end"], "06": [actors, "quote"], "07": [song, "quote"] };
})();
