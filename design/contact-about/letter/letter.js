// Direction A, "A letter": the contact form beside an envelope, then the About told as a signed letter from the founder,
// on a sheet of paper with notes in its margins and a wax seal. Wording is a draft for Lucas to correct; facts per shared/contact.js.
(() => {
  const main = ContactMock.mount("letter");

  const envelope = `<svg viewBox="0 0 360 290" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <ellipse cx="180" cy="160" rx="168" ry="112" class="la-faint" stroke-dasharray="2 7"/>
    ${[[60, 70], [302, 44], [48, 210], [320, 226], [96, 34], [272, 132]].map(([x, y], i) => `<path class="la-star" style="--i:${i}" d="M${x} ${y - 6}V${y + 6}M${x - 4} ${y - 1}H${x + 4}"/>`).join("")}
    <path class="la-paper" d="M96 150L180 98L264 150"/>
    <g class="la-rise">
      <rect class="la-paper" x="120" y="40" width="120" height="180" rx="3"/>
      <text x="136" y="70" class="la-script">Dear reader,</text>
      ${[0, 1, 2, 3, 4].map((i) => `<path class="la-faint" d="M136 ${88 + i * 12}H${[222, 210, 224, 200, 216][i]}"/>`).join("")}
      <path d="M140 166c4-9 9-9 11-1s7 8 10 0 7-7 10 0 6 5 9-1"/>
    </g>
    <path class="la-paper" d="M96 150L180 208L264 150V246H96Z"/>
    <path class="la-faint" d="M96 246L160 199M264 246L200 199"/>
    <circle class="la-seal" cx="180" cy="208" r="11"/><path class="la-seal-cross" d="M180 201V215M175 205.5H185"/>
  </svg>`;

  const margin = (side, text, cite) => `<aside class="la-note la-note-${side}"><p>${text}</p><cite>${cite}</cite></aside>`;

  main.insertAdjacentHTML("beforeend", `<div class="la">
    <section class="la-hero">
      <div>
        <p class="la-eyebrow">Contact</p>
        <h1>Write to us.<em>Every word is read.</em></h1>
        <p class="la-lead">Questions, corrections, or a word of encouragement. Every message comes to the one person who builds this.</p>
        ${ContactMock.form("la-form")}
      </div>
      <figure class="la-envelope">${envelope}</figure>
    </section>

    <section class="la-letter-wrap" aria-labelledby="la-letter-title">
      <p class="la-eyebrow la-center" id="la-letter-title">About · a letter from the founder</p>
      <article class="la-letter">
        <header><span>Bible Project</span><span>${ABOUT.place}</span></header>
        <p class="la-dear">Dear reader,</p>
        <div class="la-body">
          <p>Bible Project began with a simple conviction: the history, knowledge and wisdom of the Christian faith belong to
            everyone. For two thousand years believers have copied the Scriptures, confessed the creeds, preached, argued and
            prayed. Most of that inheritance survives, but it is scattered across libraries, archives and books long out of
            print, and much of it sits behind a paywall.</p>
          ${margin("right", "Freely ye have received, freely give.", "Matthew 10:8")}
          <p>So I set out to gather it into one source, connect every part of it to the rest, and give it away. There is no
            subscription and nothing to buy. It is free, and fully open to the public.</p>
          ${margin("left", "Whatsoever ye do, do all to the glory of God.", "1 Corinthians 10:31")}
          <p>I build it alone. I am its founder and its only developer, and I do it for one reason: the glory of God. If
            something here helps you read more closely, face a hard question, or simply know Him better, it has done what it
            was made for.</p>
          <p>If you find a mistake, have a question, or want to tell me how it has helped you, write back. Every message comes
            to me.</p>
        </div>
        <footer>
          <p class="la-close">Grace and peace,</p>
          <p class="la-sign">${ABOUT.name}</p>
          <p class="la-role">${ABOUT.role}, Bible Project</p>
          <span class="la-wax" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M32 4c6 2 9-1 14 3s3 8 7 12 1 9 3 14-2 8-4 13-7 5-11 9-9 1-14 3-8-2-13-4-5-7-9-11-1-9-3-14 2-8 4-13 7-5 11-9 9-1 15-3Z"/><path d="M32 18V46M23 28H41" class="la-wax-cross"/></svg></span>
          <p class="la-ps"><b>P.S.</b> When I'm not building this, I serve on the greet team at my church in ${ABOUT.place.split(",")[0]}
            and lead RedeemerForge, a faith-based program for young people. You can see the rest of my work, and read about my faith, below.</p>
          <div class="la-links">
            <a href="${ABOUT.personalSite}">See my other work${icon("arrowRight", 15)}</a>
            <a href="${ABOUT.faithPage}">Read about my faith${icon("arrowRight", 15)}</a>
          </div>
        </footer>
      </article>
    </section>
  </div>`);
})();
