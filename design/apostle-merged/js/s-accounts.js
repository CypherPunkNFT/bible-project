// 04 · One moment, several accounts: one moment of his story in each book's own KJV words, each account in its own
// container (its book's colour, its own heading), so the comparison reads as several voices rather than one long
// column. "Only here" underlines the words that just one account has.
window.Accounts = (() => {
  const words = (t) => t.toLowerCase().replace(/[^a-z\s'’-]/g, " ").split(/\s+/).filter((w) => w.length > 3);
  function mount(host, d) {
    const sec = document.createElement("section");
    sec.className = "sec"; sec.dataset.sec = "accounts";
    if (!d.accounts.length) {
      sec.innerHTML = `${secHead("04", "Side by side", "One moment, <em>several accounts</em>", `No moment of ${esc(d.short)}'s story is told by more than one book: Acts alone tells how he was chosen.`)}
        <div class="acc-one"><blockquote><p>${markNames(d.verses[d.landing.line.v] ?? "", d.names)}</p><footer>${refLink([d.landing.line.v, d.landing.line.v])} · KJV, the only account</footer></blockquote></div>`;
      host.append(sec); return;
    }
    sec.innerHTML = `${secHead("04", "Side by side", "One moment, <em>several accounts</em>", `${plural(d.accounts.length, "moment")} of his story told by more than one book, each in its own words in the King James Version. His names are marked; switch on "only here" to underline the words that just one account has.`)}
      <div class="acc-tools"><div class="seg acc-pick" role="group" aria-label="Moment">${d.accounts.map((a, i) => `<button type="button" data-a="${i}" aria-pressed="${i === 0}">${esc(a.title)}<small>${a.cols.length}</small></button>`).join("")}</div>
        <label class="acc-only"><input type="checkbox"> Only here</label></div>
      <div class="acc-cards"></div>`;
    host.append(sec);
    const cards = sec.querySelector(".acc-cards"), only = sec.querySelector("input");
    let cur = 0;
    function draw() {
      const a = d.accounts[cur], sets = a.cols.map((c) => new Set(c.verses.flatMap((v) => words(v.text))));
      const unique = (w, i) => sets.every((s, j) => j === i || !s.has(w));
      cards.style.setProperty("--n", a.cols.length);
      cards.innerHTML = a.cols.map((c, i) => {
        const name = bookName(c.book);
        return `<article class="acc-card" style="--tone:${BOOK_TONE(c.book)}"><span class="acc-letter" aria-hidden="true">${esc(name.replace(/^\d\s*/, "").slice(0, 1))}</span>
          <header>${c.label.includes("·") ? `<p class="kicker">${esc(c.label.split("·").slice(1).join("·").trim())}</p>` : ""}<h3>${esc(name)}</h3><p class="acc-ref">${c.spans.map((s) => refLink(s)).join(" · ")}</p></header>
          <div class="acc-text">${c.verses.map((v) => { let t = markNames(v.text, d.names); if (only.checked) t = t.replace(/(<[^>]+>|&#?\w+;)|([A-Za-z’']{4,})/g, (m, tag, w) => (tag ? tag : unique(w.toLowerCase(), i) ? `<u>${w}</u>` : w)); return `<p class="${c.mark === v.id ? "his" : ""}"><sup>${chapterOf(v.id).ch}:${chapterOf(v.id).v}</sup> ${t}</p>`; }).join("")}</div>
          <footer>${plural(c.verses.length, "verse")}${c.verses.length >= 12 ? ", the first 12 shown" : ""}</footer></article>`;
      }).join("");
    }
    sec.querySelector(".acc-pick").addEventListener("click", (e) => { const b = e.target.closest("[data-a]"); if (!b) return; cur = Number(b.dataset.a); sec.querySelectorAll(".acc-pick [data-a]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); });
    only.addEventListener("change", draw);
    draw();
  }
  return { mount };
})();
