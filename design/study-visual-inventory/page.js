// Draws the visual inventory from inventory.js and sections.json. Every picture follows the site's theme switch.
(() => {
  const { pages, families, tools, approved } = window.INVENTORY;
  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat().filter((c) => c !== null && c !== undefined));
    return element;
  }
  const theme = () => document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const shotAddress = (shot) => `shots/${shot}-${theme()}.png`;
  const pageOf = (shot) => pages[shot.replace(/-\d+$/, "")];
  const themed = []; // [image, function giving its address]
  function picture(addressOf, alt) {
    const image = h("img", { src: addressOf(), alt, loading: "lazy" });
    image.addEventListener("error", () => console.error(`Inventory: picture did not load: ${image.src}`));
    themed.push([image, addressOf]);
    return image;
  }
  addEventListener("themechange", () => { for (const [image, addressOf] of themed) image.src = addressOf(); });

  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap vi-page" });
  main.append(page);

  const inMockups = { yes: "Both mock-ups have this", partial: "The mock-ups have a thin version", none: "Neither mock-up has this" };
  const count = (value) => tools.filter((tool) => tool.mockups === value).length;

  page.append(
    h("header", { class: "vi-hero" },
      h("p", { class: "vi-concepts" }, "Cards · Switches · Explorers · Graphics"),
      h("h1", {}, "What a study ", h("em", {}, "is made of")),
      h("p", { class: "vi-lede" }, `Every visual tool on the eleven studies the standard rates best, cut from the pages themselves: what each tool holds, how a reader uses it, when it fits, and where to see it. This is a record, not a menu: find a study's own shape from its material first, then use this to check it has not repeated a sibling.`),
      h("dl", { class: "vi-figures" },
        [["Visual tools", tools.length, "found on the eleven pages"], ["Studies cut", 11, "theology and academic"], ["In the two Faith mock-ups", count("yes"), `and ${count("partial")} more in a thin version, before their rebuild`], ["Missing from them", count("none"), `of ${tools.length}, on 2026-10-30`]]
          .map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note))))),
    h("section", { class: "vi-compare" },
      h("h2", {}, "Why the two mock-ups looked bare"),
      h("p", {}, "Same kind of section, same site. The difference is a surface, a large drawing and a real choice to make."),
      h("div", { class: "vi-pair" },
        [["daily-life-02", "Faith in daily life, before: a line, a small drawing, bare ground"], ["letters-02", "Letters: a tinted card, a coloured edge, a scene filling the top"]].map(([shot, text]) =>
          h("figure", {}, h("button", { type: "button", class: "vi-shot", onclick: () => openSheet(shot) }, picture(() => shotAddress(shot), text)), h("figcaption", {}, text))))),
  );

  // ── Choosing a family ──
  const params = new URLSearchParams(location.search);
  let family = families.some(([id]) => id === params.get("family")) ? params.get("family") : "all";
  const chips = new Map();
  const chip = (id, label, total) => {
    const button = h("button", { type: "button", class: "vi-chip", "aria-pressed": "false", onclick: () => setFamily(id) }, label, h("b", {}, String(total)));
    chips.set(id, button);
    return button;
  };
  const chooser = h("nav", { class: "vi-chips", "aria-label": "Kinds of visual tool" },
    chip("all", "All", tools.length), families.map(([id, name]) => chip(id, name, tools.filter((tool) => tool.family === id).length)));
  const body = h("div", { class: "vi-body" });
  page.append(chooser, body);

  const toolView = (tool) => h("article", { class: "vi-tool", id: tool.id },
    h("div", { class: "vi-text" },
      h("h3", {}, tool.name),
      h("dl", {},
        h("dt", {}, "What it holds"), h("dd", {}, tool.holds),
        h("dt", {}, "How a reader uses it"), h("dd", {}, tool.use),
        h("dt", {}, "When it fits"), h("dd", {}, tool.when)),
      h("p", { class: `vi-status vi-status-${tool.mockups}` }, inMockups[tool.mockups]),
      tool.gap ? h("p", { class: "vi-gap" }, tool.gap) : null),
    h("div", { class: "vi-shots" }, tool.shots.map((shot) => h("figure", {},
      h("button", { type: "button", class: "vi-shot", "aria-label": `Open the picture: ${pageOf(shot)[0]}`, onclick: () => openSheet(shot) }, picture(() => shotAddress(shot), `${tool.name} on ${pageOf(shot)[0]}`)),
      h("figcaption", {}, h("a", { href: pageOf(shot)[1] }, pageOf(shot)[0], " →"))))));

  function draw() {
    for (const [id, button] of chips) button.setAttribute("aria-pressed", String(id === family));
    body.replaceChildren(...families.filter(([id]) => family === "all" || id === family).map(([id, name, line]) => h("section", { class: "vi-family" },
      h("header", {}, h("h2", {}, name), h("p", {}, line)),
      tools.filter((tool) => tool.family === id).map(toolView))));
  }
  function setFamily(id) {
    family = id;
    history.replaceState(null, "", id === "all" ? location.pathname : `?family=${id}`);
    themed.length = keep;
    draw();
  }

  page.append(h("section", { class: "vi-approved" },
    h("h2", {}, "Sections you approved on other pages"),
    h("p", {}, "Recorded in the design README, in your words. These pictures show the whole mock-up the section came from."),
    h("div", { class: "vi-approved-grid" }, approved.map(([name, id, address, note]) => h("a", { href: address, class: "vi-approved-card" },
      picture(() => `../_gallery/thumbs/${id}-${theme()}.png`, name), h("b", {}, name), h("span", {}, note))))));
  const keep = themed.length;
  draw();

  // ── One picture, large, from the right ──
  const sheetImage = h("img", { alt: "" });
  const sheetTitle = h("p", { class: "vi-sheet-title" });
  const sheet = h("dialog", { class: "vi-sheet", "aria-label": "Section picture", onclick: (event) => { if (event.target === sheet) sheet.close(); } },
    h("form", { method: "dialog" }, sheetTitle, h("button", { class: "vi-sheet-close", "aria-label": "Close the picture" }, "×")), sheetImage);
  document.body.append(sheet);
  let sheetShot = null;
  function openSheet(shot) {
    sheetShot = shot;
    sheetImage.src = shotAddress(shot);
    sheetImage.alt = `Section from ${pageOf(shot)[0]}`;
    sheetTitle.replaceChildren(pageOf(shot)[0]);
    sheet.showModal();
  }
  addEventListener("themechange", () => { if (sheetShot) sheetImage.src = shotAddress(sheetShot); });

  // A shared address names a tool: bring it into view once drawn.
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
})();
