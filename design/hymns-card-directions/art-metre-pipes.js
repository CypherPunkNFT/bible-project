// Directions 01 (Sung in metre) and 02 (The Bible in organ pipes).
(() => {
  const { AG, fmt, reduced, sleep, metreCounts, bookCounts, esc } = HC;

  // 01 · Amazing Grace's first stanza, one bead per sung syllable: 8 · 6 · 8 · 6, Common Metre.
  const STANZA = [
    ["A", "maz", "ing", "grace!", "how", "sweet", "the", "sound"],
    ["That", "saved", "a", "wretch", "like", "me!"],
    ["I", "once", "was", "lost,", "but", "now", "am", "found,"],
    ["Was", "blind,", "but", "now", "I", "see."],
  ];
  const METRES = [
    { key: "CM", name: "Common metre", shape: [8, 6, 8, 6] },
    { key: "LM", name: "Long metre", shape: [8, 8, 8, 8] },
    { key: "7s", name: "Sevens", shape: [7, 7, 7, 7] },
    { key: "SM", name: "Short metre", shape: [6, 6, 8, 6] },
  ];

  CARD_ART.push({
    id: "metre",
    label: "Sung in metre",
    idea: "Amazing Grace's first verse as it is sung, one bead per syllable, lighting at singing pace: 8 · 6 · 8 · 6. Beside it, the four metres most of the hymns were written to, with how many use each.",
    art() {
      const { counts, marked } = metreCounts();
      const lines = STANZA.map((syllables) => `<div class="metre-line"><span class="count">${syllables.length}</span>${syllables
        .map((s) => `<span class="metre-syl"><i></i><small>${esc(s)}</small></span>`).join("")}</div>`).join("");
      const key = METRES.map((m) => `<div class="metre-row${m.key === "CM" ? " on" : ""}"><strong>${m.name}</strong><em>${fmt(counts[m.key])}</em>
        <span class="shape">${m.shape.map((n) => `<b style="height:${(n / 8) * 100}%"></b>`).join("")}<small style="margin-left:6px;font-size:9px;color:var(--muted)">${m.shape.join(".")}</small></span></div>`).join("");
      return `<div class="metre"><div class="metre-stanza">${lines}</div>
        <div class="metre-key"><h3>${fmt(marked)} hymns marked with a metre</h3>${key}</div></div>
        <span class="art-note">${esc(AG.title.replace(/[()]/g, ""))} · ${esc(AG.meterName)} ${esc(AG.meter)}</span>`;
    },
    async start(root) {
      const beads = [...root.querySelectorAll(".metre-syl")];
      if (reduced) { beads.forEach((b) => b.classList.add("sung")); return; }
      for (;;) {
        for (const [i, bead] of beads.entries()) {
          if (i > 0) beads[i - 1].classList.replace("now", "sung");
          bead.classList.add("now");
          await sleep(i % 2 ? 360 : 440); // a little long-short, as a congregation sings it
        }
        beads.at(-1).classList.replace("now", "sung");
        await sleep(2200);
        beads.forEach((b) => b.classList.remove("sung"));
        await sleep(700);
      }
    },
  });

  // 02 · One organ pipe per book, Genesis to Revelation, as tall as the hymns written on it.
  const SECTIONS = [
    { id: "history", label: "Law & history" }, { id: "poetry", label: "Poetry" }, { id: "prophets", label: "Prophets" },
    { id: "gospels", label: "Gospels & Acts" }, { id: "epistles", label: "Letters" }, { id: "revelation", label: "Rev." },
  ];
  const NAMED = { Psalms: "right", Isaiah: "top", Genesis: "top", Luke: "top", Revelation: "end" };

  CARD_ART.push({
    id: "pipes",
    label: "The Bible in organ pipes",
    idea: "One organ pipe for each book of the Bible, Genesis to Revelation, as tall as the number of hymns written on it, in the site's section colours. A slow run sounds across them.",
    art() {
      const books = bookCounts(), max = Math.max(...books.map((b) => b.n)), base = 184, step = 8.6, left = 18;
      const pipes = books.map((b, i) => {
        const x = left + i * step, w = 5.8, h = b.n ? 16 + Math.sqrt(b.n / max) * 150 : 6, top = base - h, tone = `var(--${b.section})`;
        const mouth = b.n ? `<path d="M${x + 1.1} ${base - 7} q${w / 2 - 1.1} -3 ${w - 2.2} 0" stroke="var(--surface)" stroke-width="1.1" fill="none"/>` : "";
        let label = "";
        if (NAMED[b.name] === "right") label = `<text class="pipe-label" x="${x + w + 6}" y="${top + 9}">${b.name}</text><text class="pipe-label n" x="${x + w + 6}" y="${top + 21}">${fmt(b.n)} hymns</text>`;
        else if (NAMED[b.name]) {
          const anchor = NAMED[b.name] === "end" ? "end" : "middle", lx = anchor === "end" ? x + w : x + w / 2;
          label = `<text class="pipe-label" x="${lx}" y="${top - 16}" text-anchor="${anchor}">${b.name}</text><text class="pipe-label n" x="${lx}" y="${top - 5}" text-anchor="${anchor}">${b.n}</text>`;
        }
        return `<g class="pipe" style="color:${tone};animation-delay:${(i * 0.055).toFixed(2)}s;${b.n ? "" : "opacity:.22"}">
          <rect x="${x}" y="${top}" width="${w}" height="${h}" rx="1" fill="currentColor"/>
          <path d="M${x} ${base} L${x + w / 2} ${base + 10} L${x + w} ${base}" fill="currentColor" fill-opacity=".45"/>${mouth}</g>${label}`;
      }).join("");
      const sections = SECTIONS.map((s) => {
        const idx = books.flatMap((b, i) => (b.section === s.id ? [i] : []));
        const x1 = left + idx[0] * step, x2 = left + idx.at(-1) * step + 5.8;
        return `<path d="M${x1} 203 V206 H${x2} V203" fill="none" stroke="var(--${s.id})" stroke-opacity=".6"/>
          <text class="pipe-section" x="${(x1 + x2) / 2}" y="217" text-anchor="middle">${s.label}</text>`;
      }).join("");
      const sung = books.filter((b) => b.n).length;
      return `<svg class="${reduced ? "" : "pipes-sounding"}" viewBox="0 0 600 236" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Hymns written on each book of the Bible">
          <text class="pipe-section" x="590" y="12" text-anchor="end">${sung} of 66 books sung · one pipe per book</text>
          <path d="M10 196 H590" stroke="var(--line)" stroke-width="1.5"/>${pipes}${sections}</svg>`;
    },
    start() {},
  });
})();
