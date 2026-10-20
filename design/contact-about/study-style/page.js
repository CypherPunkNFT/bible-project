// The study-style contact page (?v=<theme key>, themes.js): the hero of the recent studies (title, two short lines,
// lead, form; the tilted drawing with its caption), the figures bar, then 01 About the project and 02 Who builds it.
(() => {
  const main = ContactMock.mount("study-sets");
  const theme = SS_THEMES[new URLSearchParams(location.search).get("v")] ?? SS_THEMES.codex;

  main.insertAdjacentHTML("beforeend", `<div class="ss">
    <p class="ss-crumbs"><a href="../study-sets/">${icon("arrowLeft", 13)}All twelve themes</a><span>/</span>Set ${theme.set.numeral} · ${theme.name}</p>
    <section class="ss-hero">
      <div class="ss-hero-copy">
        <p class="ss-kicker">${theme.kicker}</p>
        <h1>${theme.h1[0]}<em>${theme.h1[1]}</em></h1>
        <p class="ss-sub">${theme.sub[0]}<br>${theme.sub[1]}</p>
        <p class="ss-lead">Questions, corrections, or a word of encouragement. Write below, or to <a href="mailto:${ABOUT.address}">${ABOUT.address}</a>.</p>
        ${ContactMock.form("ss-form")}
      </div>
      <figure class="ss-art">${SS_ART[theme.key]()}<figcaption><span></span><b>${theme.cap[0]}</b>${theme.cap[1]}</figcaption></figure>
    </section>

    <dl class="ss-figures">
      <div><dt>Built by</dt><dd>1</dd><small>founder and sole developer</small></div>
      <div><dt>Cost to read</dt><dd>$0</dd><small>free, fully open to the public</small></div>
      <div><dt>Gathered</dt><dd>2,000 <i>yrs</i></dd><small>of Christian history, knowledge and wisdom</small></div>
      <div><dt>Messages</dt><dd>Every one</dd><small>read by the founder</small></div>
      <div><dt>Purpose</dt><dd>Soli Deo gloria</dd><small>1 Corinthians 10:31</small></div>
    </dl>

    <section class="ss-section" aria-labelledby="ss-about">
      <p class="ss-eyebrow"><span>01</span> · About the project</p>
      <h2 id="ss-about">Gathered, connected,<em>given freely.</em></h2>
      <p class="ss-text">For two thousand years believers have copied the Scriptures, confessed the creeds, preached, argued and prayed.
        Most of that inheritance survives, but it is scattered across libraries and archives, in books long out of print, and much
        of it behind a paywall. Bible Project gathers it into one source and gives it away, for the glory of God.</p>
      <ol class="ss-steps">
        <li><span class="ss-step-icon">${icon("library", 26)}</span><div><p class="ss-num">01</p><h3>Gathered</h3><p>The history, knowledge and wisdom of Christianity in one source.</p></div></li>
        <li><span class="ss-step-icon">${icon("branch", 26)}</span><div><p class="ss-num">02</p><h3>Connected</h3><p>Each part linked to the rest, so one question leads to the next.</p></div></li>
        <li><span class="ss-step-icon">${icon("book", 26)}</span><div><p class="ss-num">03</p><h3>Given freely</h3><p>Free, and fully open to the public. Nothing to buy.</p></div></li>
      </ol>
    </section>

    <section class="ss-section ss-builder" aria-labelledby="ss-builder">
      <div>
        <p class="ss-eyebrow"><span>02</span> · Who builds it</p>
        <h2 id="ss-builder">One founder.<em>One developer.</em></h2>
        <p class="ss-text">Bible Project is the work of one person. ${ABOUT.name} founded it and is its only developer. He builds it
          for the glory of God, so that the history, knowledge and wisdom of Christianity can be gathered in one place and given
          freely to anyone who wants it.</p>
        <div class="ss-links"><a href="${ABOUT.personalSite}">See his other work${icon("arrowUp", 14)}</a><a href="${ABOUT.faithPage}">Read his faith${icon("arrowUp", 14)}</a></div>
      </div>
      <aside class="ss-record">
        <p class="ss-eyebrow">The record</p>
        <dl>
          <div><dt>Name</dt><dd>${ABOUT.name}</dd></div>
          <div><dt>Role</dt><dd>${ABOUT.role}</dd></div>
          <div><dt>Purpose</dt><dd>For the glory of God</dd></div>
          <div><dt>Serves</dt><dd>Greet team at his church</dd></div>
          <div><dt>Also leads</dt><dd>RedeemerForge</dd></div>
        </dl>
      </aside>
    </section>
  </div>`);
})();
