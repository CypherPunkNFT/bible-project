// Direction F, the merge the owner picked (2026-10-20): the "Grace to you" hero from E (study style), then 01 About the
// project with the four convictions from C (now glory, free, open, gathered), then 02 the founder's letter from A, shorter
// and about him rather than the site. Wording is a draft for Lucas to correct; facts per shared/contact.js. Verses are KJV.
(() => {
  const main = ContactMock.mount("merged");
  const theme = SS_THEMES.epistle;
  const ART = {
    cross: '<path d="M60 16V84M44 34H76" stroke-width="2"/><path d="M60 6V10M30 20L34 24M90 20L86 24M22 44H28M92 44H98M30 66L34 62M90 66L86 62" class="cv-accent"/><path d="M36 84H84" class="cv-faint"/>',
    bowl: '<path d="M22 52H98Q94 76 60 78Q26 76 22 52Z"/><path d="M60 46C52 38 56 28 60 20C64 28 68 38 60 46Z" class="cv-accent"/><path d="M40 34L46 40M80 34L74 40M60 10V14" class="cv-faint"/><path d="M34 84H86" class="cv-faint"/>',
    door: '<path d="M34 84V36A26 26 0 0 1 86 36V84"/><path d="M60 14V84" class="cv-faint"/><path d="M60 84L82 78V40Q80 22 62 14" class="cv-paper"/><path d="M38 84L18 88M86 84L104 88" class="cv-accent"/><circle cx="76" cy="54" r="2" class="cv-dot"/>',
    books: '<path d="M18 84H102"/><path d="M24 84V30H38V84M38 84V22H52V84" /><path d="M56 84L66 26L80 28L70 86" class="cv-paper"/><path d="M84 84V44Q92 38 100 44V84" /><path d="M28 40H34M42 34H48M28 48H34" class="cv-faint"/><path d="M66 40L76 42" class="cv-accent"/>',
  };
  const CONVICTIONS = [
    ["I", "For the glory of God.", "Not for attention, and not for a name. Every page is offered back to the One it is about.", "Whatsoever ye do, do all to the glory of God.", "1 Corinthians 10:31", "cross"],
    ["II", "Free, always.", "There is no subscription and nothing to buy. What the Church received as a gift should be passed on as one.", "Freely ye have received, freely give.", "Matthew 10:8", "bowl"],
    ["III", "Open to everyone.", "Believer or skeptic, scholar or simply curious: the door is open to anyone who wants to come in.", "Ho, every one that thirsteth, come ye to the waters.", "Isaiah 55:1", "door"],
    ["IV", "Gathered in one place.", "Scripture, the creeds, the teachers and the hard questions, scattered for centuries, brought into one source and linked together.", "Wisdom is the principal thing; therefore get wisdom.", "Proverbs 4:7", "books"],
  ];
  const svg = (kind) => `<svg viewBox="0 0 120 92" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ART[kind]}</svg>`;
  const margin = (side, text, cite) => `<aside class="la-note la-note-${side}"><p>${text}</p><cite>${cite}</cite></aside>`;

  main.insertAdjacentHTML("beforeend", `<div class="ss mg">
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
  </div>

  <div class="cv mg">
    <section class="cv-why mg-why" aria-labelledby="mg-about">
      <header class="cv-why-head">
        <p class="ss-eyebrow"><span>01</span> · About the project</p>
        <h2 id="mg-about">Gathered, connected,<em>given freely.</em></h2>
        <p class="mg-text">For two thousand years believers have copied the Scriptures, confessed the creeds, preached, argued and prayed.
          Most of that inheritance survives, but it is scattered across libraries and archives, in books long out of print, and much
          of it behind a paywall. Bible Project gathers it into one source and gives it away, for the glory of God.</p>
      </header>
      <ol class="cv-list">${CONVICTIONS.map(([numeral, title, text, verse, ref, art]) => `<li>
        <span class="cv-numeral" aria-hidden="true">${numeral}</span>
        <div class="cv-art">${svg(art)}</div>
        <h3>${title}</h3>
        <p>${text}</p>
        <blockquote>“${verse}”<cite>${ref}</cite></blockquote>
      </li>`).join("")}</ol>
    </section>
  </div>

  <div class="la mg">
    <section class="la-letter-wrap" aria-labelledby="mg-letter">
      <p class="ss-eyebrow mg-center" id="mg-letter"><span>02</span> · Who builds it · a letter from the founder</p>
      <article class="la-letter mg-letter">
        <div class="mg-ruled">
        <header><span>Bible Project</span><span>${ABOUT.place}</span></header>
        <p class="la-dear">Dear reader,</p>
        <div class="la-body">
          <p>Thank you for stopping here. I wanted you to know who is on the other side of this page. My name is ${ABOUT.first},
            and I build Bible Project by myself.</p>
          ${margin("right", "Whatsoever ye do, do all to the glory of God.", "1 Corinthians 10:31")}
          <p>I do it because I believe what these pages hold. The faith came to me through people who copied, preached and
            prayed long before I was born. I want to pass it on the way it came to me: freely, and for the glory of God.</p>
          <p>So if something here helps you, troubles you, or you simply want to say hello, write to me. I read every letter
            myself, and I would be glad to hear from you.</p>
        </div>
        <footer>
          <p class="la-close">Grace and peace,</p>
          <p class="la-sign">${ABOUT.name}</p>
          <p class="la-role">${ABOUT.role}, Bible Project</p>
          <p class="la-ps"><b>P.S.</b> When I'm not building this, I serve on the greet team at my church and lead RedeemerForge,
            a faith-based program for young people.</p>
        </footer>
        </div>
        <div class="la-links mg-links">
          <a href="../other-work/">See my other work${icon("arrowRight", 15)}</a>
          <a href="${ABOUT.faithPage}">Read about my faith${icon("arrowRight", 15)}</a>
        </div>
        <span class="la-wax" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M32 4c6 2 9-1 14 3s3 8 7 12 1 9 3 14-2 8-4 13-7 5-11 9-9 1-14 3-8-2-13-4-5-7-9-11-1-9-3-14 2-8 4-13 7-5 11-9 9-1 15-3Z"/><path d="M32 18V46M23 28H41" class="la-wax-cross"/></svg></span>
      </article>
    </section>
  </div>`);
})();
