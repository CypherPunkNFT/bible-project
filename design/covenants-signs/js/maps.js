// Several maps: the same five signs physically rearrange into each view's picture of how the covenants fit together.
// The sketches are this site's, to show the difference between the views, and the study does not choose between them.
Cov.drawMaps = () => {
  const { h, s, art, runs, study, covenants, worldName, refLink, sources } = Cov;
  const slugs = Object.keys(covenants);
  if (study.maps.length !== 5) console.error(`Covenants: expected four maps and one shared ground in the study, found ${study.maps.length} blocks`);
  // Where each sign stands in each map, in the order of the study's four views.
  const PLACES = [
    { noah: [70, 318], abraham: [210, 262], sinai: [350, 206], david: [490, 150], new: [630, 94] },
    { noah: [76, 210], abraham: [213, 210], sinai: [350, 210], david: [487, 210], new: [624, 210] },
    { noah: [90, 60], abraham: [90, 150], sinai: [90, 240], david: [90, 330], new: [600, 195] },
    { noah: [100, 262], abraham: [225, 262], sinai: [350, 262], david: [475, 262], new: [600, 262] },
  ];
  const sketch = s("svg", { viewBox: "0 0 700 400", class: "cv-map", "aria-hidden": "true" });
  const scenes = [
    `<path d="M0 362h70v-56h140v-56h140v-56h140v-56h140v-56h70"/><text x="30" y="388">"first of all to Adam"</text><text x="670" y="30" text-anchor="end">"the full discovery"</text>`,
    `<path d="M144 92v240M281 92v240M419 92v240M556 92v240"/><path class="cv-map-line" d="M213 182C300 60 560 60 690 122"/><text x="690" y="106" text-anchor="end">Israel's future</text>`,
    `<path class="cv-map-line" d="M126 60C340 60 400 180 556 192M126 150C340 150 400 186 556 194M126 240C340 240 400 204 556 197M126 330C340 330 400 216 556 199"/>`,
    `<path class="cv-map-line is-dashed" d="M46 300V218C46 60 654 60 654 218V300"/><text x="350" y="84" text-anchor="middle">"one and the same"</text>`,
  ].map((markup, index) => {
    const scene = s("g", { class: "cv-scene", "data-map": index });
    scene.innerHTML = markup; // fixed drawing above
    sketch.append(scene);
    return scene;
  });
  const tokens = slugs.map((slug) => {
    const token = s("g", { class: `cv-token cv-w-${slug}` });
    const face = art(`<svg viewBox="-24 -24 48 48" x="-20" y="-20" width="40" height="40">${CovSigns.mini[slug]}</svg>`).firstChild;
    token.append(s("circle", { r: 27, class: "cv-token-ground" }), face, s("text", { y: 44, "text-anchor": "middle" }, worldName(slug)));
    token.dataset.slug = slug;
    sketch.append(token);
    return token;
  });

  const flag = (className, label, block) => {
    const source = sources.find((item) => item.id === block.src);
    return h("div", { class: `cv-flag ${className}` }, h("span", { class: "cv-flag-label" }, label), h("p", {}, runs(block.runs)),
      source ? h("small", {}, h("a", { href: source.href, rel: "noopener noreferrer", target: "_blank" }, source.name), ". ", source.note) : null);
  };
  Cov.blockView = {
    quote: (b) => h("figure", { class: "cv-quote" }, h("blockquote", {}, b.t), h("figcaption", {}, refLink(b.r, b.label), " · BSB")),
    p: (b) => h("p", {}, runs(b.runs)),
    care: (b) => flag("cv-flag-care", "A detail to handle carefully", b),
    other: (b) => flag("", "Another tradition, labelled as theirs", b),
    open: (b) => flag("cv-flag-open", "Open question · this study does not choose", b),
    source: (b) => flag("", "Named source", b),
    own: (b) => flag("", "Named source · told in this site's words", b),
  };
  const words = h("div", { class: "cv-map-words", "aria-live": "polite" });
  const pickButtons = study.maps.slice(0, 4).map((part, index) => h("button", { type: "button", class: "cv-map-pick", onclick: () => Cov.set({ map: String(index) }) }, part.title));
  const picks = h("div", { class: "cv-map-picks", role: "group", "aria-label": "Choose a map" }, pickButtons);

  function sync(state) {
    const index = Number(state.map);
    const places = PLACES[index];
    tokens.forEach((token) => { const [x, y] = places[token.dataset.slug]; token.style.transform = `translate(${x}px, ${y}px)`; });
    scenes.forEach((scene, i) => scene.classList.toggle("is-on", i === index));
    pickButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    words.replaceChildren(h("h3", {}, study.maps[index].title), ...study.maps[index].blocks.map((block) => Cov.blockView[block.k](block)));
  }
  Cov.onChange((state, before) => { if (state.map !== before.map) sync(state); });
  sync(Cov.state);

  const [first, turn] = study.mapsTitle.split(". ");
  const common = study.maps[4];
  return h("section", { class: "cv-maps", id: "maps" },
    h("div", { class: "wrap" },
      h("header", { class: "cv-head" }, h("h2", {}, `${first}. `, h("em", {}, turn)), h("p", {}, runs(study.mapsLead))),
      picks,
      h("div", { class: "cv-map-body" },
        h("figure", { class: "cv-map-box" }, sketch, h("figcaption", {}, "Sketches by this site, to show how the views differ. They are not the holders' own charts, and this study does not choose.")),
        words),
      h("div", { class: "cv-common" }, h("h3", {}, common.title), common.blocks.map((block) => Cov.blockView[block.k](block)))));
};
