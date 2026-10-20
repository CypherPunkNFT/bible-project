// Direction B, "Front matter": the page as the opening pages of a book, in open spreads with a spine between the pages
// and roman page numbers. Correspondence (the form) faces the title page; the dedication faces the preface; the author
// faces the colophon. Wording is a draft for Lucas to correct; facts per shared/contact.js.
(() => {
  const main = ContactMock.mount("front-matter");
  const ornament = `<svg class="fm-ornament" viewBox="0 0 160 20" aria-hidden="true"><path d="M0 10H64M96 10H160"/><path d="M80 2V18M74 7H86"/><circle cx="68" cy="10" r="1.6"/><circle cx="92" cy="10" r="1.6"/></svg>`;
  const page = (number, label, body, extra = "") => `<div class="fm-page ${extra}"><p class="fm-running">${label}</p>${body}<p class="fm-folio">${number}</p></div>`;
  const spread = (left, right, id = "") => `<section class="fm-spread" ${id}>${left}<span class="fm-spine" aria-hidden="true"></span>${right}</section>`;

  main.insertAdjacentHTML("beforeend", `<div class="fm">
    ${spread(
      page("i", "Correspondence", `<div class="fm-flow">
        <h1 class="fm-h">Write to us.<em>Every word is read.</em></h1>
        <p class="fm-small">Questions, corrections, or a word of encouragement. Every letter reaches the one person who builds this.</p>
        ${ContactMock.form("fm-form")}</div>`),
      page("ii", "Title page", `<div class="fm-title">
        <p class="fm-caps">Bible Project</p>
        ${ornament}
        <p class="fm-sub">The history, knowledge and wisdom<br>of the Christian faith,<br><em>gathered in one place and given freely.</em></p>
        <div class="fm-imprint"><p>Gathered by</p><p class="fm-name">${ABOUT.name}</p><p>${ABOUT.place} · MMXXVI</p></div></div>`, "fm-centred"),
      'aria-label="Correspondence and title page"')}

    ${spread(
      page("iii", "Dedication", `<div class="fm-dedication">
        <p>To the glory of God,</p><p>and to every reader</p><p>who wants to know Him better.</p>
        ${ornament}<p class="fm-caps fm-caps-small">Soli Deo gloria</p></div>`, "fm-centred"),
      page("iv", "Preface", `<div class="fm-flow fm-prose">
        <h2 class="fm-h2">Preface</h2>
        <p class="fm-drop">For two thousand years believers have copied the Scriptures, confessed the creeds, preached, argued and
          prayed. Most of that inheritance survives, but it is scattered: across libraries and archives, in books long out of print,
          and much of it behind a paywall.</p>
        <p>Bible Project gathers the history, knowledge and wisdom of Christianity into one source, connects every part of it to
          the rest, and gives it away. There is no subscription and nothing to buy. It is free, and fully open to the public.</p>
        <p>It is built for one reason: the glory of God. If it helps anyone read more closely, face a hard question honestly, or
          know Him better, it has done what it was made for.</p>
        <p class="fm-initials">L. C. S. L.</p></div>`),
      'aria-label="Dedication and preface"')}

    ${spread(
      page("v", "About the author", `<div class="fm-flow fm-prose">
        <h2 class="fm-h2">About the author</h2>
        <p class="fm-author">${ABOUT.name}</p>
        <p class="fm-caps fm-caps-small fm-role">${ABOUT.role}</p>
        <p>${ABOUT.first} founded Bible Project and is its only developer. He lives in ${ABOUT.place}, where he ${ABOUT.church}
          and ${ABOUT.forge}.</p>
        <p>His other work, and his own account of his faith, are on his personal pages.</p>
        <div class="fm-links"><a href="${ABOUT.personalSite}">His other work${icon("arrowRight", 15)}</a><a href="${ABOUT.faithPage}">His faith${icon("arrowRight", 15)}</a></div></div>`),
      page("vi", "Colophon", `<div class="fm-colophon">
        <h2 class="fm-h2">Colophon</h2>
        <dl>
          <div><dt>Built by</dt><dd>One person, its founder and only developer</dd></div>
          <div><dt>Price</dt><dd>Free, with no subscription and nothing to buy</dd></div>
          <div><dt>Open to</dt><dd>Anyone, believer or skeptic, scholar or curious</dd></div>
          <div><dt>Set in</dt><dd>Literata and Archivo</dd></div>
          <div><dt>Made in</dt><dd>${ABOUT.place}</dd></div>
        </dl>
        <blockquote>“Whatsoever ye do, do all to the glory of God.”<cite>1 Corinthians 10:31</cite></blockquote></div>`),
      'aria-label="About the author and colophon"')}
  </div>`);
})();
