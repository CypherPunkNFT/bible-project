// Layout 1: Paul's letters as one page — the letter picker under the title, then all twelve cards in three rows.

function paulPage() {
  return `
    ${crumbs(["The four collections"], "PAUL'S LETTERS")}
    <header class="intro" style="--tone: var(--epistles)">
      <div class="intro-copy">
        <p class="kicker">Thirteen letters · Paul</p>
        <h1>Paul's letters.<br><em>Written on the road.</em></h1>
        <p>Letters to young churches and to friends, from his first visit to Thessalonica to his last days in Rome. Choose a letter,
          then a card.</p>
      </div>
      <div class="emblem" aria-hidden="true">${icon("route", 120)}<span>EARLY · MAJOR · PRISON · PASTORAL</span></div>
    </header>
    ${letterPicker()}
    ${rowsHtml(PAUL_GROUPS_OF_CARDS(), true)}
    <p class="sources-line">Each letter's people and places, and this page's sources, open from its overview card. <a href="${LIVE}#paul-letters">Where this page comes from →</a></p>`;
}

function paulCardPage(page) {
  if (page === "romans") paulState.letter = "Romans";
  const found = paulCard(page);
  if (!found) return paulPage();
  const { g, c } = found;
  return opened({ path: [`<a href="#/paul">Paul's letters</a>`, g.title], c, right: "PAUL'S LETTERS",
    kicker: PAUL_KICKERS[page] ?? `${g.title} · ${c.eyebrow}`, lead: PAUL_LEADS[page] ?? c.text, body: paulCardBody(c),
    after: rail(`More in ${g.title}`, [...g.cards.map((x) => ({ ...x, current: x.page === page })),
      { art: "paul", tone: "epistles", title: "All of Paul's letters", section: "13 letters · 12 cards", href: "#/paul" }]) });
}

ROUTES.push([/^paul$/, paulPage], [/^paul\/([a-z0-9-]+)$/, (m) => paulCardPage(m[1])]);
