// The page: a short head, then the eight drawings in a 4 × 2 grid, each with its number, name, verse and a "Use this"
// note. Verses are the King James text word for word (checked against data/text/kjv/<BOOK>/*.json, 2026-10-08).
(() => {
  const ITEMS = [
    { key: "waters", name: "Waters", tone: "poetry", verse: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.", ref: "Psalm 23:2" },
    { key: "shepherd", name: "Shepherd", tone: "epistles", verse: "He shall feed his flock like a shepherd: he shall gather the lambs with his arm, and carry them in his bosom …", ref: "Isaiah 40:11", note: "The prophet's picture of the Lord as a shepherd." },
    { key: "lamp", name: "Lamp", tone: "accent", verse: "Thy word is a lamp unto my feet, and a light unto my path.", ref: "Psalm 119:105" },
    { key: "wings", name: "Wings", tone: "history", verse: "He shall cover thee with his feathers, and under his wings shalt thou trust …", ref: "Psalm 91:4" },
    { key: "door", name: "Door", tone: "epistles", verse: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", ref: "Matthew 11:28" },
    { key: "rock", name: "Rock", tone: "prophets", verse: "From the end of the earth will I cry unto thee, when my heart is overwhelmed: lead me to the rock that is higher than I.", ref: "Psalm 61:2" },
    { key: "morning", name: "Morning", tone: "history", verse: "It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.", ref: "Lamentations 3:22–23" },
    { key: "sprout", name: "Mending", tone: "poetry", verse: "He healeth the broken in heart, and bindeth up their wounds.", ref: "Psalm 147:3" },
  ];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const main = Frame.mount();
  main.innerHTML = `<div class="wrap">
    <header class="head">
      <p class="kick">Help for life · the hero drawing</p>
      <h1>Eight drawings <em>to choose from</em></h1>
      <p class="lead">One of these sits beside the title at the top of the Help for life page, where the still-waters drawing is now. Each one moves slowly and never stops; with reduced motion turned on, each one stays still. Say the number to choose.</p>
    </header>
    <ol class="grid">${ITEMS.map((it, i) => `<li class="cell" id="${it.key}" style="--c: var(--${it.tone})">
        <p class="label"><b>${i + 1}</b><span>${esc(it.name)}</span></p>
        <figure class="draw draw-${it.key}">${ART[it.key]()}
          <figcaption><q>${esc(it.verse)}</q><cite>${esc(it.ref)}</cite>${it.note ? `<small>${esc(it.note)}</small>` : ""}</figcaption></figure>
        <p class="use">Use this: say “drawing ${i + 1}, ${esc(it.name)}”</p>
      </li>`).join("")}</ol>
    <p class="foot-note">Every verse is the King James text, word for word. Two are shortened where the verse goes on (marked …). The drawings are this site's own, drawn as lines; no person in them has a face, and none is a picture of God.</p>
  </div>`;
})();
