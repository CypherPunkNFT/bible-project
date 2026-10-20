// Direction C, "Convictions": a short contact band, then why Bible Project exists as four convictions (giant numeral,
// line drawing, one verse each), then the founder as a signature band with his facts in a single bar.
// Wording is a draft for Lucas to correct; facts per shared/contact.js. Verses are the King James Version.
(() => {
  const main = ContactMock.mount("convictions");
  const ART = {
    bowl: '<path d="M22 52H98Q94 76 60 78Q26 76 22 52Z"/><path d="M60 46C52 38 56 28 60 20C64 28 68 38 60 46Z" class="cv-accent"/><path d="M40 34L46 40M80 34L74 40M60 10V14" class="cv-faint"/><path d="M34 84H86" class="cv-faint"/>',
    door: '<path d="M34 84V36A26 26 0 0 1 86 36V84"/><path d="M60 14V84" class="cv-faint"/><path d="M60 84L82 78V40Q80 22 62 14" class="cv-paper"/><path d="M38 84L18 88M86 84L104 88" class="cv-accent"/><circle cx="76" cy="54" r="2" class="cv-dot"/>',
    books: '<path d="M18 84H102"/><path d="M24 84V30H38V84M38 84V22H52V84" /><path d="M56 84L66 26L80 28L70 86" class="cv-paper"/><path d="M84 84V44Q92 38 100 44V84" /><path d="M28 40H34M42 34H48M28 48H34" class="cv-faint"/><path d="M66 40L76 42" class="cv-accent"/>',
    cross: '<path d="M60 16V84M44 34H76" stroke-width="2"/><path d="M60 6V10M30 20L34 24M90 20L86 24M22 44H28M92 44H98M30 66L34 62M90 66L86 62" class="cv-accent"/><path d="M36 84H84" class="cv-faint"/>',
  };
  const CONVICTIONS = [
    ["I", "Free, always.", "There is no subscription and nothing to buy. What the Church received as a gift should be passed on as one.", "Freely ye have received, freely give.", "Matthew 10:8", "bowl"],
    ["II", "Open to everyone.", "Believer or skeptic, scholar or simply curious: the door is open to anyone who wants to come in.", "Ho, every one that thirsteth, come ye to the waters.", "Isaiah 55:1", "door"],
    ["III", "Gathered in one place.", "Scripture, the creeds, the teachers and the hard questions, scattered for centuries, brought into one source and linked together.", "Wisdom is the principal thing; therefore get wisdom.", "Proverbs 4:7", "books"],
    ["IV", "For the glory of God.", "Not for attention, and not for a name. Every page is offered back to the One it is about.", "Whatsoever ye do, do all to the glory of God.", "1 Corinthians 10:31", "cross"],
  ];
  const svg = (kind) => `<svg viewBox="0 0 120 92" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ART[kind]}</svg>`;

  main.insertAdjacentHTML("beforeend", `<div class="cv">
    <section class="cv-contact">
      <div>
        <p class="cv-eyebrow">Contact</p>
        <h1>Talk to the person<em>who builds it.</em></h1>
        <p class="cv-lead">Questions, corrections, or a word of encouragement. There is no team and no help desk: every message
          comes to ${ABOUT.first}, and every one is read.</p>
      </div>
      ${ContactMock.form("cv-form")}
    </section>

    <section class="cv-why" aria-labelledby="cv-why-title">
      <header class="cv-why-head">
        <p class="cv-eyebrow">About · why it exists</p>
        <h2 id="cv-why-title">Four convictions.<em>One reason.</em></h2>
      </header>
      <ol class="cv-list">${CONVICTIONS.map(([numeral, title, text, verse, ref, art]) => `<li>
        <span class="cv-numeral" aria-hidden="true">${numeral}</span>
        <div class="cv-art">${svg(art)}</div>
        <h3>${title}</h3>
        <p>${text}</p>
        <blockquote>“${verse}”<cite>${ref}</cite></blockquote>
      </li>`).join("")}</ol>
    </section>

    <section class="cv-founder" aria-labelledby="cv-founder-title">
      <div class="cv-mark" aria-hidden="true">
        <svg viewBox="0 0 140 140" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="70" cy="70" r="66" class="cv-faint"/><circle cx="70" cy="70" r="56"/>
          <text x="70" y="82" text-anchor="middle" class="cv-mono">LCSL</text><path d="M70 22V40M63 29H77" class="cv-accent" stroke-width="1.6"/></svg>
      </div>
      <div class="cv-founder-copy">
        <p class="cv-eyebrow">Who builds it</p>
        <h2 id="cv-founder-title">${ABOUT.name}</h2>
        <p class="cv-founder-line">One man founded Bible Project, and he is still the only one building it. He does it for the glory
          of God, so that the history, knowledge and wisdom of Christianity can be gathered in one place and given freely to anyone.</p>
        <dl class="cv-bar">
          <div><dt>Role</dt><dd>Founder</dd></div>
          <div><dt>Team</dt><dd>Sole developer</dd></div>
          <div><dt>Home</dt><dd>${ABOUT.place}</dd></div>
          <div><dt>Church</dt><dd>Greet team</dd></div>
          <div><dt>Also leads</dt><dd>RedeemerForge</dd></div>
        </dl>
        <div class="cv-links"><a href="${ABOUT.personalSite}">See his other work${icon("arrowUp", 15)}</a><a href="${ABOUT.faithPage}">Read his faith${icon("arrowUp", 15)}</a></div>
      </div>
    </section>
  </div>`);
})();
