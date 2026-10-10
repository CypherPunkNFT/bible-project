// The page: a short head, then six drawings large in a 2 × 2 grid, each with its number, name, verse and a "Use this"
// note. Verses are the King James text word for word (checked against data/text/kjv/<BOOK>/*.json, 2026-10-08).
(() => {
  const DOOR = "Come unto me, all ye that labour and are heavy laden, and I will give you rest.";
  const ITEMS = [
    { key: "doorSolid", css: "door-solid", name: "Door, with Jesus", tone: "sun", verse: DOOR, ref: "Matthew 11:28", note: "Jesus at the open door, as the verse invites: a solid, softly lit figure; low hills meeting the house, the tree in front of it, birds crossing." },
    { key: "doorSolid", arg: "-colour", css: "door-solid door-colour", name: "Door, with Jesus, in colour", tone: "sun", verse: DOOR, ref: "Matthew 11:28", note: "The same drawing with green in the tree, the grass, the flower stems and the potted plant; the gold light, the sun and the pale flowers as before." },
    { key: "morning", css: "morning", name: "Morning", tone: "sun", verse: "It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.", ref: "Lamentations 3:22–23", note: "A yellow sun with beams falling, the last stars fading, more trees and grass, pale blue and violet flowers." },
    { key: "well", css: "well", name: "Well", tone: "accent", verse: "But whosoever drinketh of the water that I shall give him shall never thirst …", ref: "John 4:14", note: "A plain sun with slowly turning rays, soft drifting clouds, a flock of birds high up, olive trees on the hills." },
    { key: "doorOriginal", css: "door-original", name: "Door, as first drawn", tone: "epistles", verse: DOOR, ref: "Matthew 11:28", note: "The first version, before Jesus was added, shown unchanged." },
    { key: "loavesCrowd", css: "loaves", name: "Loaves, with the crowd", tone: "sun", verse: "And Jesus took the loaves; and when he had given thanks, he distributed to the disciples, and the disciples to them that were set down; and likewise of the fishes as much as they would.", ref: "John 6:11", note: "Five loaves and two fish in the woven basket, with people sitting together on the hills behind them." },
  ];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const main = Frame.mount();
  main.innerHTML = `<div class="wrap">
    <header class="head">
      <p class="kick">Help for life · the hero drawing · round 2</p>
      <h1>Six drawings, <em>looked at again</em></h1>
      <p class="lead">The owner's changes to three of the twenty-four, the Door also in colour, the Door as it was first drawn, and the loaves and fish with a crowd seated on the hills. Each moves slowly and never stops; with reduced motion turned on, each stays still. Say the number to choose.</p>
    </header>
    <ol class="grid">${ITEMS.map((it, i) => `<li class="cell" id="${it.css.split(" ").at(-1)}" style="--c: var(--${it.tone})">
        <p class="label"><b>${i + 1}</b><span>${esc(it.name)}</span></p>
        <figure class="draw ${it.css.split(" ").map((c) => `draw-${c}`).join(" ")}">${ART[it.key](it.arg)}
          <figcaption><q>${esc(it.verse)}</q><cite>${esc(it.ref)}</cite><small>${esc(it.note)}</small></figcaption></figure>
        <p class="use">Use this: say “round 2, drawing ${i + 1}, ${esc(it.name)}”</p>
      </li>`).join("")}</ol>
    <p class="foot-note">Every verse is the King James text, word for word; where a verse goes on, it is shortened and marked …. The drawings are this site's own, drawn as lines. No person in them has a face; drawings 1 and 2 show Jesus at the door, as Matthew 11:28 invites. All twenty-four are on <a href="../help-for-life-drawings/">the first page</a>.</p>
  </div>`;
})();
