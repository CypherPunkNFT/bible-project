// Direction D, "The lamp in the window": a cinema landing (the contact form over a night drawing of Jacksonville, the key
// figures in one bar beneath), then three chapters with giant numerals and a sky of stars behind them, and the approved side
// navigation of dots with a pill. Wording is a draft for Lucas to correct; facts per shared/contact.js.
(() => {
  const main = ContactMock.mount("lamp");
  const CHAPTERS = [["contact", "Contact"], ["work", "I · The work"], ["builder", "II · The builder"], ["reason", "III · The reason"]];
  // ?v=psalm | shiloh | hill | night picks one of the biblical scenes (lamp-scenes.js); without it, the first Jacksonville version.
  const scene = LAMP_SCENES[new URLSearchParams(location.search).get("v")];

  const landing = scene ? `
      <div class="lp-landing-copy">
        <p class="lp-eyebrow">Contact · ${scene.title}</p>
        <h1>${scene.h1}</h1>
        <p class="lp-lead">${scene.lead}</p>
        ${ContactMock.form("lp-form")}
      </div>
      <figure class="lp-scene">${scene.draw()}</figure>` : `
      <div class="lp-landing-copy">
        <p class="lp-eyebrow">Contact</p>
        <h1>A light left on<em>for whoever writes.</em></h1>
        <p class="lp-lead">Questions, corrections, or a word of encouragement. Every message reaches the one person who builds
          Bible Project, at a desk in ${ABOUT.place}.</p>
        ${ContactMock.form("lp-form")}
      </div>
      <figure class="lp-scene">${lampScene()}</figure>`;
  const under = scene ? `<p class="lp-verse"><q>${scene.verse}</q><cite>${scene.ref} · KJV</cite></p>` : `<dl class="lp-bar">
      <div><dt>Founded by</dt><dd>${ABOUT.name}</dd></div>
      <div><dt>Team</dt><dd>One sole developer</dd></div>
      <div><dt>Built in</dt><dd>${ABOUT.place}</dd></div>
      <div><dt>Price</dt><dd>Free, for everyone</dd></div>
      <div><dt>For</dt><dd>Soli Deo gloria</dd></div>
    </dl>`;

  main.insertAdjacentHTML("beforeend", `<div class="lp">
    <nav class="lp-dots" aria-label="Sections">${CHAPTERS.map(([id, label]) => `<a href="#lp-${id}" data-id="${id}"><span>${label}</span></a>`).join("")}</nav>
    ${scene ? `<p class="lp-back"><a href="../lamp-variations/">${icon("arrowLeft", 14)}All four scenes</a></p>` : ""}
    <section class="lp-landing" id="lp-contact">${landing}</section>
    ${under}

    <section class="lp-chapter" id="lp-work" data-numeral="I">
      <p class="lp-eyebrow">I · The work</p>
      <div class="lp-chapter-grid">
        <h2>Two thousand years of faith,<em>gathered and given away.</em></h2>
        <div class="lp-prose">
          <p>Believers have copied the Scriptures, confessed the creeds, preached, argued and prayed for two thousand years. Most
            of that inheritance survives, but it is scattered across libraries and archives, in books long out of print, and much
            of it behind a paywall.</p>
          <p>Bible Project gathers the history, knowledge and wisdom of Christianity into one source, connects every part to the
            rest, and gives it away. It is free, and fully open to the public.</p>
        </div>
      </div>
    </section>

    <section class="lp-chapter" id="lp-builder" data-numeral="II">
      <p class="lp-eyebrow">II · The builder</p>
      <div class="lp-chapter-grid">
        <div><h2>${ABOUT.name.replace("Saint Laurent", "")}<em>Saint Laurent.</em></h2><p class="lp-role">${ABOUT.role}</p></div>
        <div class="lp-prose">
          <p>Bible Project is the work of one person. ${ABOUT.first} founded it and is its only developer. He lives in
            ${ABOUT.place}, where he ${ABOUT.church} and ${ABOUT.forge}.</p>
          <div class="lp-links"><a href="${ABOUT.personalSite}">See his other work${icon("arrowRight", 15)}</a><a href="${ABOUT.faithPage}">Read his faith${icon("arrowRight", 15)}</a></div>
        </div>
      </div>
    </section>

    <section class="lp-chapter lp-reason" id="lp-reason" data-numeral="III">
      <p class="lp-eyebrow">III · The reason</p>
      <blockquote>“Whether therefore ye eat, or drink, or whatsoever ye do,<em>do all to the glory of God.”</em><cite>1 Corinthians 10:31 · KJV</cite></blockquote>
      <p class="lp-prose lp-reason-line">That is the whole reason. Not attention, and not a name: so that the history, knowledge and
        wisdom of the faith can be open to anyone who wants it.</p>
    </section>
  </div>`);

  // The side dots: the pill follows whichever section holds the middle of the screen.
  const links = [...document.querySelectorAll(".lp-dots a")];
  const watch = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) links.forEach((link) => link.classList.toggle("is-on", `lp-${link.dataset.id}` === entry.target.id));
  }, { rootMargin: "-45% 0px -45% 0px" });
  CHAPTERS.forEach(([id]) => watch.observe(document.getElementById(`lp-${id}`)));
})();
