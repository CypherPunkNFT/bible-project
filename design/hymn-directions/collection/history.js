// 04 · Who wrote them, and how they were sung. A short historical setting: a timeline from the metrical psalms English
// churches sang before Watts to the Olney Hymns; the three writers, each with a lifeline on one shared scale; and how a
// hymn was actually sung in their churches. Words floating with lines, no boxes; hovering a dot reads it out below.
window.Sections = window.Sections || {};
(() => {
  const esc = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  // The scale runs 1640–1845; 1562 sits at the left edge, behind a break in the line.
  const START = 1640, END = 1845;
  const at = (year) => `${Math.max(0, ((year - START) / (END - START)) * 100)}%`;
  // Where each moment's label sits, so close years never collide: u = above the line, d = below; 1 near, 2 far.
  const TIER = { 1562: "u1", 1696: "d1", 1707: "u1", 1715: "d2", 1719: "u2", 1748: "d1", 1764: "u1", 1773: "d2", 1779: "u2", 1835: "u1" };

  // Each moment: year, a few words for the line, and the sentence it reads out.
  const MOMENTS = [
    [1562, "The Old Version", "Sternhold and Hopkins's whole psalter in metre is bound into English prayer books. For more than a century most English congregations sing the psalms and almost nothing else."],
    [1696, "The New Version", "Tate and Brady's smoother psalter appears. Churches argue over it for decades; it is still psalms, not hymns."],
    [1707, "Hymns and Spiritual Songs", "Isaac Watts, a young Independent minister in London, publishes hymns of his own making: songs about Christ, the cross and heaven, not only paraphrases of the psalms."],
    [1715, "Divine Songs for Children", "Watts writes simple songs for children to learn by heart. They stay in print for well over a century."],
    [1719, "The Psalms of David Imitated", "Watts recasts the psalms 'in the language of the New Testament', naming Christ where David looked ahead. Our God, our help in ages past and Joy to the world are both here."],
    [1748, "Newton turns", "John Newton, a sailor in the slave trade, cries to God in a storm off Ireland. His full break with the trade comes years later."],
    [1764, "Newton at Olney", "Newton becomes curate of Olney, a lace-making town in Buckinghamshire. The poet William Cowper moves there in 1767 to be near him."],
    [1773, "Amazing grace", "Newton writes it for the New Year's Day service of 1773, on David's prayer in 1 Chronicles 17. That same month Cowper falls into a long darkness."],
    [1779, "Olney Hymns", "The two publish their hymns for the town's weekly prayer meeting: 349 in three books, 281 of them Newton's."],
    [1835, "A tune for it", "In America, Amazing grace is printed with the tune now called New Britain. Until then, any tune in its metre could carry it."],
  ];
  const PEOPLE = [
    { name: "Isaac Watts", born: 1674, died: 1748, tone: "--poetry", line: "Independent minister in London; never strong in health, he wrote most of his hymns for his own congregation to sing after the sermon.", count: "880 here" },
    { name: "John Newton", born: 1725, died: 1807, tone: "--history", line: "Sailor, slave-ship captain, then Anglican curate. Later rector in London, he spoke against the slave trade in print in 1788.", count: "280 here" },
    { name: "William Cowper", born: 1731, died: 1800, tone: "--prophets", line: "One of the finest poets of his day, and often in deep despair. His hymns hold both the trust and the dark.", count: "68 here" },
  ];
  const SUNG = [
    ["Words without music", "Hymn books printed only the words. Tunes lived in separate tune books, or in the clerk's head."],
    ["Lined out", "Few could read and books were dear, so a clerk read or sang each line and the congregation sang it back after him."],
    ["Any tune of the metre", "Common Metre (8.6.8.6) is the old ballad measure. A Common Metre text fits any Common Metre tune, which is why our pages give a metre and not a tune."],
    ["At the prayer meeting", "Olney Hymns were written for a weekday meeting in a large room, not for Sunday worship, where the metrical psalms still ruled."],
  ];

  function mount(section) {
    section.style.setProperty("--tone", "var(--accent)");
    const ticks = [1650, 1700, 1750, 1800].map((y) => `<span class="hh-tick" style="left: ${at(y)}">${y}</span>`).join("");
    section.innerHTML = `
      <header class="t-head"><span class="t-num">04</span><div><p class="kicker">Their history</p>
        <h2>Who wrote them, and <em>how they were sung</em></h2>
        <p>English churches sang the psalms in metre for over a century before Watts. These hymn books changed that, and were sung in a way that would surprise us now.</p></div></header>
      <div class="hh-time">
        <div class="hh-axis">${ticks}<span class="hh-break" aria-hidden="true"></span>
          ${MOMENTS.map(([year, title], i) => `<button type="button" class="hh-dot hh-${TIER[year]}${year < START ? " hh-before" : ""}" style="left: ${at(year)}" data-i="${i}"><i></i><span><b>${year}</b>${esc(title)}</span></button>`).join("")}
          ${PEOPLE.map((p, i) => `<span class="hh-life" style="left: ${at(p.born)}; width: calc(${at(p.died)} - ${at(p.born)}); --tone: var(${p.tone}); top: ${12.6 + i * 1.05}rem"><em>${esc(p.name)} · ${p.born}–${p.died}</em></span>`).join("")}
        </div>
        <p class="hh-read" aria-live="polite"></p>
      </div>
      <div class="hh-people">${PEOPLE.map((p) => `<div class="hh-person" style="--tone: var(${p.tone})"><p class="k">${p.born}–${p.died} · ${esc(p.count)}</p><h3>${esc(p.name)}</h3><p>${esc(p.line)}</p></div>`).join("")}</div>
      <div class="hh-sung"><p class="k">How they were sung</p>${SUNG.map(([h, t]) => `<div><h4>${esc(h)}</h4><p>${esc(t)}</p></div>`).join("")}</div>`;

    const read = section.querySelector(".hh-read");
    const show = (i) => {
      const [year, title, text] = MOMENTS[i];
      read.innerHTML = `<b>${year} · ${esc(title)}.</b> ${esc(text)}`;
      section.querySelectorAll(".hh-dot").forEach((d) => d.classList.toggle("on", +d.dataset.i === i));
    };
    section.querySelectorAll(".hh-dot").forEach((d) => { d.addEventListener("mouseenter", () => show(+d.dataset.i)); d.addEventListener("click", () => show(+d.dataset.i)); d.addEventListener("focus", () => show(+d.dataset.i)); });
    show(7);
  }

  Sections.history = { mount };
})();
