// The card sheet (?view=card): one card per article type across the six field colours, every state (rest, hover,
// keyboard focus, read, saved, pressed in the app, the longest title), and the contrast of the field-coloured text on the
// card's wash, measured in this browser from the real computed colours.
(() => {
  if (new URLSearchParams(location.search).get("view") !== "card") return;
  const { icon, articleCard, SURFACE } = window.APF;
  const { page } = window.APF_DRAW_CARD_SHEET;
  const F = {
    god: { title: "God & reality", short: "God", color: "accent" }, jesus: { title: "Jesus & resurrection", short: "Jesus", color: "gospels" },
    bible: { title: "Bible & reliability", short: "Bible", color: "history" }, doubt: { title: "Suffering & doubt", short: "Suffering", color: "poetry" },
    faith: { title: "Faith & witness", short: "Faith", color: "epistles" }, reformed: { title: "Reformed theology", short: "Reformed", color: "history" },
  };
  const card = (format, field, title, summary, minutes, sources, extra = {}) => ({ format, field: F[field], title, summary, minutes, sources, ...extra });
  const types = [
    card("short-answer", "faith", "Do Baptists have creeds?", "Confessions, not creeds over conscience: what Baptists have written and why.", 4, 7),
    card("essay", "jesus", "Did Jesus rise? The historical case", "The creed of 1 Corinthians 15, the empty tomb, the appearances and the critics.", 16, 22, { parts: 7 }),
    card("objections", "god", "The kalam argument and the beginning of the universe", "The argument in two steps, and the strongest objections to each.", 6, 11),
    card("debate-guide", "reformed", "Four covenant frameworks Baptists hold", "What all four affirm, then each on its own terms, side by side.", 8, 12),
    card("figure", "reformed", "Spurgeon: Calvinist and evangelist", "The preacher who held both, in his own words.", 5, 6),
    card("reading", "jesus", "Did Jesus exist? What non-Christian writers say", "Tacitus, Josephus, Pliny, Suetonius and Lucian, read slowly with notes.", 5, 8),
    card("timeline", "faith", "Nicaea to Chalcedon, 325–451", "Four councils and what each settled about who Christ is.", 6, 9),
    card("glossary", "doubt", "Words for hard questions", "Theodicy, defence, gratuitous evil, privation, lament and more.", 12, 5),
    card("faq", "faith", "Sharing the gospel: questions people ask", "Short answers to the questions that come up most.", 6, 7),
    card("case-study", "bible", "Three famous variants", "The end of Mark, the woman caught in adultery, and 1 John 5:7-8.", 7, 9),
    card("unknown", "god", "An article whose type the card does not know", "Falls back to the plain document icon and the word \"Article\".", 3, 2),
  ];
  const base = card("objections", "doubt", "The hiddenness argument and replies", "Schellenberg's \"nonresistant nonbelief\", with Pascal and Butler.", 6, 10);
  const states = [
    ["At rest", "", base], ["Pointer over it (website)", "is-hover", base], ["Keyboard focus", "is-focus", base],
    ["Read", "", { ...base, read: true }], ["Saved", "", { ...base, saved: true }],
    ["Longest title (3 lines, then cut)", "", card("debate-guide", "doubt", "Free will, providence and suffering: how Baptists read it when the doctrines are pressed hardest", "Calvinist and free-will Baptist accounts side by side, and what both affirm.", 8, 12)],
  ];
  if (SURFACE === "app") states.splice(1, 2, ["Pressed (the app's hover)", "is-pressed", base]);

  page.innerHTML = `<header class="fp-hero"><p class="ap-eyebrow">The new article card</p><h1>Title first, <em>a faded mark behind.</em></h1>
    <p class="fp-lede">Eyebrow (type · field), serif title, one-line summary, and a meta line pinned to the foot. The type's icon sits faded in the top-right corner behind the text, as on the Library dashboard's issue cards. No lift, no shadow, no glow.${SURFACE === "app" ? " App values: icon 80 px on phones and 96 on tablets, no fade mask (Android has none), a 40×40 save target." : ""}</p></header>
    <section class="cs-sec"><div class="fp-head"><p class="ap-eyebrow">01 · One icon per type</p><h2>Eleven types, six field colours.</h2></div>
      <div class="ap-article-grid">${types.map((s) => articleCard(s)).join("")}</div></section>
    <section class="cs-sec"><div class="fp-head"><p class="ap-eyebrow">02 · States</p><h2>What changes, and what never does.</h2><p class="fp-sub">Read never greys the card out. Saved fills the bookmark only. Drafts are removed before the page is drawn.</p></div>
      <div class="ap-article-grid">${states.map(([label, cls, s]) => `<figure class="cs-state"><figcaption>${label}</figcaption>${articleCard(s, cls)}</figure>`).join("")}</div></section>
    <section class="cs-sec"><div class="fp-head"><p class="ap-eyebrow">03 · Contrast</p><h2>Field colour on the card's wash, measured.</h2>
      <p class="fp-sub">The eyebrow (.61rem, capitals, weight 600) is the smallest text in a field colour. AA asks 4.5:1 for text this size. Measured here, in this theme, against the wash at the eyebrow's position.</p></div>
      <table class="cs-table" id="contrast"><thead><tr><th>Field colour</th><th>Used by</th><th>Eyebrow on wash</th><th>Muted text on wash</th><th>AA (4.5)</th></tr></thead><tbody></tbody></table></section>`;

  // WCAG relative luminance of an rgb() colour from getComputedStyle.
  const rgb = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
  const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const probe = document.createElement("div");
  document.body.append(probe);
  const resolve = (css) => { probe.style.color = css; return rgb(getComputedStyle(probe).color); };
  const surface = resolve("var(--surface)");
  const tones = [["accent", "God & reality"], ["gospels", "Jesus & resurrection"], ["history", "Bible & reliability, Reformed theology"], ["poetry", "Suffering & doubt"], ["prophets", "Religions & worldviews"], ["epistles", "Faith & witness"]];
  // The eyebrow sits near the card's top-left, where the 125° wash is at about its full 6% (10% on hover).
  const mix = (tone, share) => tone.map((v, i) => Math.round(v * share + surface[i] * (1 - share)));
  document.querySelector("#contrast tbody").innerHTML = tones.map(([name, used]) => {
    const tone = resolve(`var(--${name})`), muted = resolve("var(--muted)");
    const rest = ratio(tone, mix(tone, 0.06)), hover = ratio(tone, mix(tone, 0.10)), mutedRest = ratio(muted, mix(tone, 0.06));
    const pass = Math.min(rest, hover) >= 4.5;
    return `<tr><td><span class="cs-swatch" style="background:var(--${name})"></span>--${name}</td><td>${used}</td><td>${rest.toFixed(2)}:1 (hover ${hover.toFixed(2)})</td><td>${mutedRest.toFixed(2)}:1</td><td class="${pass ? "ok" : "no"}">${pass ? "passes" : "fails"}</td></tr>`;
  }).join("");
  probe.remove();
  document.documentElement.dataset.contrast = "measured";
})();
