// The page: a short head, then sixteen drawings in two 4 × 2 grids, each with its number, name, verse and a "Use this"
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
    { key: "calm", name: "Calm", tone: "prophets", verse: "And he arose, and rebuked the wind, and said unto the sea, Peace, be still. And the wind ceased, and there was a great calm.", ref: "Mark 4:39" },
    { key: "well", name: "Well", tone: "accent", verse: "But whosoever drinketh of the water that I shall give him shall never thirst …", ref: "John 4:14" },
    { key: "loaves", name: "Loaves", tone: "epistles", verse: "And Jesus took the loaves; and when he had given thanks, he distributed to the disciples, and the disciples to them that were set down; and likewise of the fishes as much as they would.", ref: "John 6:11" },
    { key: "anchor", name: "Anchor", tone: "poetry", verse: "Which hope we have as an anchor of the soul, both sure and stedfast …", ref: "Hebrews 6:19" },
    { key: "vine", name: "Vine", tone: "gospels", verse: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit …", ref: "John 15:5" },
    { key: "valley", name: "Valley", tone: "history", verse: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.", ref: "Psalm 23:4" },
    { key: "olive", name: "Olive leaf", tone: "poetry", verse: "And the dove came in to him in the evening; and, lo, in her mouth was an olive leaf pluckt off …", ref: "Genesis 8:11" },
    { key: "eagle", name: "Eagle", tone: "accent", verse: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", ref: "Isaiah 40:31" },
  ];
  const cell = (it, i) => `<li class="cell" id="${it.key}" style="--c: var(--${it.tone})">
        <p class="label"><b>${i + 1}</b><span>${esc(it.name)}</span></p>
        <figure class="draw draw-${it.key}">${ART[it.key]()}
          <figcaption><q>${esc(it.verse)}</q><cite>${esc(it.ref)}</cite>${it.note ? `<small>${esc(it.note)}</small>` : ""}</figcaption></figure>
        <p class="use">Use this: say “drawing ${i + 1}, ${esc(it.name)}”</p>
      </li>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const main = Frame.mount();
  main.innerHTML = `<div class="wrap">
    <header class="head">
      <p class="kick">Help for life · the hero drawing</p>
      <h1>Sixteen drawings <em>to choose from</em></h1>
      <p class="lead">One of these sits beside the title at the top of the Help for life page, where the still-waters drawing is now. Each one moves slowly and never stops; with reduced motion turned on, each one stays still. Say the number to choose.</p>
    </header>
    <ol class="grid">${ITEMS.slice(0, 8).map((it, i) => cell(it, i)).join("")}</ol>
    <p class="grid-head"><span>9–16</span>Eight more</p>
    <ol class="grid" start="9">${ITEMS.slice(8).map((it, i) => cell(it, i + 8)).join("")}</ol>
    <p class="foot-note">Every verse is the King James text, word for word. Where a verse goes on, it is shortened and marked …. The drawings are this site's own, drawn as lines; no person in them has a face, and none is a picture of God.</p>
  </div>`;
})();
