// Four versions of reading 04's view (Romans 8:18-25), for the owner to compare. Only runs with ?creation-view=a in the address, which
// shows that reading with a floating A, B, C, D pill; without it the page is untouched. Delete this file once one is chosen.
(() => {
  if (!window.HZ || !HZ.SCENES) return;
  const start = new URLSearchParams(location.search).get("creation-view");
  if (!start) return;
  const { svg, hill, seeded } = HZ.SCENE_PARTS;
  const n = (value) => value.toFixed(1);

  // A: the chain across the land, broken where the light comes through.
  function chain() {
    const links = [];
    for (let x = 30; x < 1600; x += 58) {
      if (x > 690 && x < 910) continue;
      const sag = 148 + Math.pow(Math.abs(x - 800) / 800, 1.6) * -44 + (x < 800 ? (x - 800) * -.01 : 0);
      const tilt = x < 800 ? 10 : -10;
      links.push(x % 116 < 58
        ? `<ellipse cx="${x}" cy="${n(sag)}" rx="36" ry="15" transform="rotate(${tilt} ${x} ${n(sag)})"/>`
        : `<ellipse cx="${x}" cy="${n(sag)}" rx="32" ry="5" transform="rotate(${tilt} ${x} ${n(sag)})"/>`);
    }
    const rays = [];
    for (let i = 0; i < 48; i += 1) {
      const angle = (i * Math.PI * 2) / 48, reach = i % 2 ? 150 : 250;
      rays.push(`M${n(800 + Math.cos(angle) * 64)} ${n(146 + Math.sin(angle) * 64)}L${n(800 + Math.cos(angle) * reach)} ${n(146 + Math.sin(angle) * reach)}`);
    }
    const broken = `<path d="M676 150c14 -22 34 -14 26 2l-8 14M924 142c-14 -22 -34 -14 -26 2l8 14"/>`;
    return svg(`<circle class="sc-gold" cx="800" cy="146" r="46"/><path class="sc-rays" d="${rays.join("")}"/><g class="sc-chain">${links.join("")}${broken}</g>${hill(276)}`);
  }
  // B: one land, cracked and thorned where the light has not yet come, in flower where it has.
  function greening() {
    const random = seeded(211), cracks = [], thorns = [], stems = [], blooms = [], crowns = [];
    for (let i = 0; i < 16; i += 1) {
      let x = random() * 620, y = 278 + random() * 18, d = `M${n(x)} ${n(y)}`;
      for (let step = 0; step < 4; step += 1) { x += 12 + random() * 22; y += (random() - .5) * 9; d += `L${n(x)} ${n(y)}`; }
      cracks.push(d);
    }
    for (let x = 40; x < 560; x += 62 + random() * 60) thorns.push(`M${n(x)} 276l-12 -16 8 4 -5 -20 10 12 4 -24 6 20 11 -13 -5 19 10 -4 -9 16`);
    for (let x = 520; x < 1600; x += 6 + random() * 9) {
      const grow = Math.min(1, (x - 520) / 800), tall = 6 + grow * (18 + random() * 26), lean = (random() - .5) * 8;
      stems.push(`M${n(x)} 300Q${n(x)} ${n(300 - tall * .6)} ${n(x + lean)} ${n(300 - tall - 8)}`);
      if (random() < .3 + grow * .55) blooms.push(`<circle cx="${n(x + lean)}" cy="${n(300 - tall - 8)}" r="${n(2 + grow * 3.4)}"/>`);
    }
    [1040, 1230, 1400, 1530].forEach((x, i) => {
      const size = 20 + i * 7;
      crowns.push(`<rect x="${x - 3}" y="${268 - size}" width="6" height="${size + 16}"/><circle cx="${x}" cy="${268 - size * 1.7}" r="${size}"/><circle cx="${x - size * .75}" cy="${268 - size * 1.05}" r="${size * .7}"/><circle cx="${x + size * .75}" cy="${268 - size * 1.05}" r="${size * .7}"/>`);
    });
    return svg(`${hill(270)}<g class="sc-tree">${crowns.join("")}</g><path class="sc-limbs" stroke-width="1.6" d="${thorns.join("")}"/><path class="sc-limbs" stroke-width="1.4" d="${cracks.join("")}"/><path class="sc-stem" d="${stems.join("")}"/><g class="sc-gold">${blooms.join("")}</g>`);
  }
  // C: a great tree, bare on one side and in leaf and fruit on the other: the firstfruits.
  function halfTree() {
    const random = seeded(53), limbs = [], leaves = [];
    (function grow(x, y, angle, length, width) {
      const endX = x + Math.cos(angle) * length, endY = y + Math.sin(angle) * length;
      limbs.push(`<path d="M${n(x)} ${n(y)}L${n(endX)} ${n(endY)}" stroke-width="${n(width)}"/>`);
      if (width < 1.3) {
        if (endX > 806) leaves.push(`<circle cx="${n(endX)}" cy="${n(endY)}" r="${n(4 + random() * 7)}"/>`);
        return;
      }
      const fork = .36 + random() * .34;
      grow(endX, endY, angle - fork, length * (.74 + random() * .12), width * .68);
      grow(endX, endY, angle + fork * (.8 + random() * .5), length * (.7 + random() * .14), width * .68);
    })(800, 300, -Math.PI / 2, 66, 20);
    return svg(`${hill(282)}<g class="sc-limbs">${limbs.join("")}</g><g class="sc-gold">${leaves.join("")}</g>`);
  }
  // D: the first light on the horizon, and the birds let out of a bare tree, rising into it.
  function birds() {
    const random = seeded(401), limbs = [], flock = [];
    (function grow(x, y, angle, length, width) {
      const endX = x + Math.cos(angle) * length, endY = y + Math.sin(angle) * length;
      limbs.push(`<path d="M${n(x)} ${n(y)}L${n(endX)} ${n(endY)}" stroke-width="${n(width)}"/>`);
      if (width < 1.6) return;
      const fork = .34 + random() * .3;
      grow(endX, endY, angle - fork, length * (.72 + random() * .1), width * .66);
      grow(endX, endY, angle + fork, length * (.7 + random() * .12), width * .66);
    })(380, 300, -Math.PI / 2 + .05, 52, 13);
    for (let i = 0; i < 70; i += 1) {
      const t = i / 69, x = 430 + t * 880 + (random() - .5) * (40 + t * 90), y = 170 - t * 110 + (random() - .5) * (34 + t * 90), wing = 5 + t * 15 + random() * 3;
      flock.push(`M${n(x - wing)} ${n(y - wing * .4)}Q${n(x - wing * .4)} ${n(y - wing * .55)} ${n(x)} ${n(y)}Q${n(x + wing * .4)} ${n(y - wing * .55)} ${n(x + wing)} ${n(y - wing * .4)}Q${n(x + wing * .4)} ${n(y - wing * .1)} ${n(x)} ${n(y + wing * .24)}Q${n(x - wing * .4)} ${n(y - wing * .1)} ${n(x - wing)} ${n(y - wing * .4)}Z`);
    }
    return svg(`${hill(276)}<g class="sc-limbs">${limbs.join("")}</g><path class="sc-gold" d="${flock.join("")}"/>`, `<circle class="sc-gold" cx="1240" cy="170" r="70"/>`);
  }

  const VIEWS = { a: chain(), b: greening(), c: halfTree(), d: birds() };
  const view = document.querySelector('.hz-stop[data-at="creation"] .hz-view');
  const buttons = new Map();
  function choose(key) {
    view.innerHTML = VIEWS[key];
    buttons.forEach((button, name) => button.setAttribute("aria-pressed", String(name === key)));
    const params = new URLSearchParams(location.search);
    params.set("creation-view", key);
    history.replaceState(history.state, "", `?${params}`);
  }
  const pill = document.createElement("div");
  pill.className = "hz-pill";
  Object.keys(VIEWS).forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = key.toUpperCase();
    button.addEventListener("click", () => choose(key));
    buttons.set(key, button);
    pill.append(button);
  });
  document.body.append(pill);
  HZ.setView?.({ at: "creation" });
  choose(VIEWS[start] ? start : "a");
  const rail = document.querySelector(".hz-rail");
  window.scrollTo(0, rail.getBoundingClientRect().top + scrollY - 76);
})();
