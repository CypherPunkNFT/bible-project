// Layout 3: Paul's page with a compact top (title, figures, three section cards). The chosen section's four parts sit
// below the cards; Paul's story is chosen to begin with, and choosing another card wipes its parts in from the left.

function sectionCard(g, n, chosen) {
  const text = g.id === "inside" ? "Choose any of the thirteen; all four parts follow it." : g.lead;
  return card({ art: g.art, tone: g.tone, icon: { story: "route", inside: "book", side: "compare" }[g.id], eyebrow: `Section ${pad2(n)} · four parts`, title: g.title, text,
    foot: SECTION_PARTS[g.id].map((p) => p.eyebrow).join(" · "), cta: chosen ? "Shown below" : "Show this section", href: SECTION_HREF[g.id] }, n)
    .replace('class="card"', `class="card section-card" data-slide aria-current="${chosen ? "page" : "false"}"`);
}

function paulPage(sectionId) {
  const groups = PAUL_GROUPS_OF_CARDS(), current = groups.find((g) => g.id === sectionId) ?? groups[0], at = groups.indexOf(current);
  const verses = P.letters.reduce((s, l) => s + l.verses, 0);
  return `
    ${crumbs(["The four collections"], "PAUL'S LETTERS")}
    <header class="intro paul-top" style="--tone: var(--epistles)">
      <div class="intro-copy">
        <p class="kicker">Thirteen letters · Paul</p>
        <h1>Paul's letters.<br><em>Written on the road.</em></h1>
        <p>Letters to young churches and to friends, from his first visit to Thessalonica to his last days in Rome. Follow his story,
          step inside any one letter, or set the letters side by side.</p>
      </div>
      <div class="emblem" aria-hidden="true">${icon("route", 104)}<span>EARLY · MAJOR · PRISON · PASTORAL</span></div>
    </header>
    <dl class="figures figures-tight">
      <div><dt>Letters</dt><dd>13</dd></div><div><dt>Verses</dt><dd>${verses.toLocaleString("en-US")}</dd></div>
      <div><dt>Journeys</dt><dd>3 + Rome</dd></div><div><dt>Companions</dt><dd>${P.companions.nodes.length - 1}</dd></div>
    </dl>
    <div class="cards cards-3 section-cards">${groups.map((g, i) => sectionCard(g, i + 1, g === current)).join("")}</div>
    <div class="section-slide">
      <div class="row-head section-head"><h2><span>${pad2(at + 1)}</span>${current.title}</h2><p>${current.id === "inside" ? "Choose any of the thirteen; all four parts below follow it." : current.lead}</p></div>
      ${current.id === "inside" ? letterPicker() : ""}
      ${partsHtml(current)}
    </div>
    <p class="sources-line">Each letter's people and places, and this page's sources, are under Inside. <a href="${LIVE}#paul-letters">Where this page comes from →</a></p>`;
}

ROUTES.push(
  [/^paul$/, () => paulPage("story")],
  [/^paul\/(story|inside|side)(?:\/([a-z0-9]+))?$/, (m) => { if (m[2]) scrollToPart(m[2]); return paulPage(m[1]); }],
  [/^paul\/(journeys|romans|ephesians-colossians)$/, (m) => { const [s, part] = OLD_CARD_ADDRESSES[m[1]]; scrollToPart(part); return paulPage(s); }],
);
