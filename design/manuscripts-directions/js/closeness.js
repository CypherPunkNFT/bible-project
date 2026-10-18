// B · 02 How close to the writing? For each New Testament book: when it was written (a wide, approximate editorial
// range) and the oldest copy in the open data that holds it, with the years between. Pointing at a book names the copy
// and the next oldest on the line below; choosing it opens the copy's record.
(() => {
  const { mid, holderText, byDate } = MSX;
  const short = (r) => r.g && /^P\d/.test(r.g) ? r.g : r.n.replace(/^Rylands Library Papyrus /, "");

  function rows() {
    return Object.entries(MS.written).map(([b, [a, z]]) => {
      const book = MS.books[b];
      const copies = MS.records.filter((r) => "e" in r && !r.lect && r.b?.includes(Number(b))).sort(byDate);
      const first = copies[0];
      return { b: Number(b), book, a, z, copies, first, gap: first ? Math.max(0, Math.round((mid(first) - (a + z) / 2) / 5) * 5) : null };
    });
  }

  function mount(section, { num }) {
    const list = rows();
    const end = Math.ceil(Math.max(...list.map((x) => x.first?.l ?? 0), 200) / 50) * 50;
    const pos = (y) => `${((y / end) * 100).toFixed(2)}%`;
    let order = "bible";
    section.innerHTML = `${head(num, "How close to the writing?", `From the writing to the <em>oldest copy</em>`,
      "For each New Testament book: when it was written, as a wide approximate range that holds the main scholarly views, and the oldest copy in the open data that holds it. Most early copies are dated by their handwriting, so their dates are estimates too.")}
      <div class="cl-top"><div class="cl-key"><span><i class="cl-k-w"></i>Written (approximate)</span><span><i class="cl-k-c"></i>Oldest copy, with the range of its date</span></div>
        <div class="ct-sort" role="radiogroup" aria-label="Order"><button type="button" role="radio" data-order="bible" aria-checked="true">Bible order</button><button type="button" role="radio" data-order="gap" aria-checked="false">Closest first</button></div></div>
      <div class="cl-axis" aria-hidden="true">${Array.from({ length: end / 50 + 1 }, (_, i) => `<span style="left:${pos(i * 50)}">${i === 0 ? "AD 1" : i * 50}</span>`).join("")}</div>
      <ol class="cl"></ol>
      <p class="ms-say cl-say" aria-live="polite"></p>`;
    const say = section.querySelector(".cl-say"), base = "Point at a book to read its oldest copy here; choose it to open the record.";
    say.textContent = base;

    const row = (x) => {
      const f = x.first;
      return `<li><button type="button" class="cl-row" ${f ? `data-open="${esc(f.i)}"` : "disabled"} data-b="${x.b}" style="--tone: var(--${x.book.sec})">
        <span class="cl-name"><span class="cl-full">${esc(x.book.name)}</span><span class="cl-short">${esc(x.book.name.replace("Thessalonians", "Thess").replace("Corinthians", "Cor").replace("Philippians", "Phil").replace("Colossians", "Col").replace("Ephesians", "Eph").replace("Galatians", "Gal").replace("Revelation", "Rev"))}</span></span>
        <span class="cl-track"><i class="cl-w" style="left:${pos(x.a)};width:${pos(x.z - x.a)}"></i>
          ${f ? `<i class="cl-link" style="left:${pos(x.z)};width:${pos(Math.max(0, mid(f) - x.z))}"></i><i class="cl-r" style="left:${pos(f.e)};width:${pos(Math.max(0, f.l - f.e))}"></i><i class="cl-c" style="left:${pos(mid(f))}"></i><em style="left:${pos(mid(f))}">${esc(short(f))}</em>` : ""}</span>
        <span class="cl-gap">${f ? (x.gap ? `≈ ${x.gap} yrs` : "overlaps") : "no dated copy"}</span></button></li>`;
    };
    function render() {
      const shown = [...list].sort((p, q) => (order === "gap" ? (p.gap ?? 1e9) - (q.gap ?? 1e9) || p.b - q.b : p.b - q.b));
      section.querySelector(".cl").innerHTML = shown.map(row).join("");
    }
    function show(el) {
      const x = el && list.find((y) => y.b === Number(el.dataset.b));
      if (!x || !x.first) { say.textContent = base; return; }
      const f = x.first, next = x.copies.slice(1, 4).map((r) => `${short(r)} (${r.d})`);
      say.innerHTML = `<b>${esc(x.book.name)}</b> · written about ${x.a}–${x.z} · oldest copy here: <b>${esc(f.n)}</b>, ${esc(f.d)}${holderText(f) ? `, ${esc(holderText(f))}` : ""}${x.gap ? ` · about ${x.gap} years after the middle of the writing range` : ""}${next.length ? ` · then ${esc(next.join(", "))}` : ""}`;
    }
    const ol = section.querySelector(".cl");
    ol.addEventListener("pointerover", (e) => show(e.target.closest("[data-b]")));
    ol.addEventListener("focusin", (e) => show(e.target.closest("[data-b]")));
    ol.addEventListener("pointerleave", () => show(null));
    section.addEventListener("click", (e) => {
      const o = e.target.closest("[data-order]");
      if (!o) return;
      order = o.dataset.order;
      section.querySelectorAll("[data-order]").forEach((b) => b.setAttribute("aria-checked", String(b === o)));
      render();
    });
    render();
  }
  Sections.closeness = { mount };
})();
