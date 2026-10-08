// The line-art kit: small drawing helpers that the landing compositions and the chapter scenes are built from. Every
// stroke carries pathLength=1 and a delay --d (0..1), so a drawing plots itself once (css/art.css), then keeps living
// through slow loops on groups (sway, drift, flicker, twinkle). Nothing here is a picture of a real object or person;
// the drawings show what the verses name. Classes: k key line · m middle · f fine · g ghost · t tone (accent) ·
// tf fine tone · w water · dash tradition · star · fill-t faint tone fill.
window.Kit = (() => {
  const n1 = (v) => Math.round(v * 10) / 10;
  const P = (d, cls = "m", delay = 0) => `<path pathLength="1" class="${cls}" style="--d:${n1(delay * 100) / 100}" d="${d}"/>`;
  const E = (cx, cy, rx, ry, cls = "m", delay = 0, rot = 0) => `<ellipse pathLength="1" class="${cls}" style="--d:${n1(delay * 100) / 100}" cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(rx)}" ry="${n1(ry)}"${rot ? ` transform="rotate(${rot} ${n1(cx)} ${n1(cy)})"` : ""}/>`;
  const C = (cx, cy, r, cls = "m", delay = 0) => E(cx, cy, r, r, cls, delay);
  const G = (cls, body, style = "") => `<g class="${cls}"${style ? ` style="${style}"` : ""}>${body}</g>`;
  // Placement goes in the transform attribute, so a loop animation on a wrapping group never fights it.
  const T = (tf, body) => `<g transform="${tf}">${body}</g>`;
  const rng = (seed) => { let s = seed % 2147483647 || 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const pts = (list) => list.map(([x, y], i) => `${i ? "L" : "M"}${n1(x)} ${n1(y)}`).join("");
  // A smooth curve through points (Catmull-Rom as cubic Béziers).
  const smooth = (p, close = false) => {
    if (p.length < 2) return "";
    const q = close ? [p[p.length - 1], ...p, p[0], p[1]] : [p[0], ...p, p[p.length - 1]];
    let d = `M${n1(p[0][0])} ${n1(p[0][1])}`;
    for (let i = 1; i < q.length - 2; i++) {
      const [x0, y0] = q[i - 1], [x1, y1] = q[i], [x2, y2] = q[i + 1], [x3, y3] = q[i + 2];
      d += `C${n1(x1 + (x2 - x0) / 6)} ${n1(y1 + (y2 - y0) / 6)} ${n1(x2 - (x3 - x1) / 6)} ${n1(y2 - (y3 - y1) / 6)} ${n1(x2)} ${n1(y2)}`;
    }
    return close ? d + "Z" : d;
  };
  const bez = (a, b, c, d) => (t) => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // ── Sky and ground ──
  const stars = (n, seed, [x0, y0, x1, y1], delay = .6) => { const r = rng(seed); let s = ""; for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * r() * (y1 - y0); s += `<circle class="star" style="--d:${n1((delay + r() * .3) * 100) / 100};--tw:${n1(r() * 9)}s" cx="${n1(x)}" cy="${n1(y)}" r="${n1(.7 + r() * 1.3)}"/>`; } return G("lp-twinkle", s); };
  const ridge = (y, amp, seed, x0, x1, step = 60) => { const r = rng(seed), p = []; for (let x = x0; x <= x1 + step; x += step) p.push([Math.min(x, x1), y - r() * amp - Math.sin(x / 210 + seed) * amp * .5]); return smooth(p); };
  const hills = (y, amp, seed, x0, x1, cls = "f", delay = .05) => P(ridge(y, amp, seed, x0, x1), cls, delay);
  // Water: broken wave strokes in perspective: fine and close together at the horizon, longer and wider apart near.
  const water = (x0, x1, y0, y1, rows, seed, cls = "w", delay = .2) => {
    const r = rng(seed); let s = "";
    for (let i = 0; i < rows; i++) {
      const t = i / Math.max(1, rows - 1), y = y0 + (y1 - y0) * Math.pow(t, 1.45), seg = 12 + t * 95, a = .8 + t * 4.2;
      let x = x0 + r() * 60;
      while (x < x1 - 10) {
        const w = Math.min(seg * (.45 + r() * .9), x1 - x);
        if (r() > .18) s += P(`M${n1(x)} ${n1(y + (r() - .5) * 4 * t)}c${n1(w / 4)} ${n1(-a)} ${n1(w / 2)} ${n1(-a)} ${n1(w / 2)} 0s${n1(w / 4)} ${n1(a)} ${n1(w / 2)} 0`, t < .3 ? `${cls} wf` : cls, delay + t * .25 + r() * .05);
        x += w + (14 + t * 60) * (.5 + r() * 1.3);
      }
    }
    return G("lp-drift", s, `--dx:${n1(6 + r() * 8)}px;--dur:${n1(7 + r() * 5)}s`);
  };
  const grass = (x0, x1, y, n, seed, h = 18, cls = "f", delay = .5) => { const r = rng(seed); let s = ""; for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), hh = h * (.5 + r()), l = (r() - .5) * hh * .6; s += P(`M${n1(x)} ${y}q${n1(l * .3)} ${n1(-hh * .6)} ${n1(l)} ${n1(-hh)}M${n1(x + 3)} ${y}q${n1(-l * .2)} ${n1(-hh * .5)} ${n1(-l * .6 + 4)} ${n1(-hh * .8)}`, cls, delay + r() * .2); } return G("lp-sway", s, "--rot:1.2deg;--dur:6s"); };
  const birds = (list, delay = .8) => G("lp-glide", list.map(([x, y, s = 1]) => P(`M${x - 9 * s} ${y}q${5 * s} ${-5 * s} ${9 * s} 0q${4 * s} ${-5 * s} ${9 * s} 0`, "f", delay)).join(""));
  const sun = (x, y, r, delay = 0) => `<circle class="sunfill" cx="${x}" cy="${y}" r="${r * 1.9}"/>` + C(x, y, r, "t", delay) + C(x, y, r * .72, "tf", delay + .05);
  const rays = (x, y, r0, r1, n, a0 = 0, a1 = Math.PI * 2, cls = "tf", delay = .5) => G("lp-breathe", Array.from({ length: n }, (_, i) => { const a = a0 + ((a1 - a0) * (i + .5)) / n, l = i % 2 ? r1 : r1 * .78; return P(`M${n1(x + Math.cos(a) * r0)} ${n1(y + Math.sin(a) * r0)}L${n1(x + Math.cos(a) * l)} ${n1(y + Math.sin(a) * l)}`, cls, delay + i * .01); }).join(""));

  // ── Things the verses name ──
  // A fishing boat seen from the side: a filled hull (so the water behind is hidden) with a gentle sheer, rounded
  // stem and stern, three strakes, ribs, stem and stern posts, and a short mast with the sail furled on its yard.
  const boat = (x, y, w, { mast = true, oars = true, delay = .2 } = {}) => {
    const h = w * .2, s = [];
    const sheerAt = (t) => y - h * (.62 + .45 * Math.pow(Math.abs(t - .52) * 2, 2.2));
    const bottomAt = (t) => y + h * (.12 - 1.05 * Math.pow(Math.abs(t - .5) * 2, 3.2));
    const X = (t) => x - w / 2 + w * t;
    const line = (f, t0, t1, n = 14) => smooth(Array.from({ length: n + 1 }, (_, i) => { const t = t0 + ((t1 - t0) * i) / n; return [X(t), f(t)]; }));
    const outline = [...Array.from({ length: 15 }, (_, i) => [X(i / 14), sheerAt(i / 14)]), [X(1.01), sheerAt(1) + h * .3], ...Array.from({ length: 13 }, (_, i) => { const t = .98 - (i / 12) * .96; return [X(t), Math.max(sheerAt(t) + 4, bottomAt(t))]; }), [X(-.01), sheerAt(0) + h * .3]];
    s.push(`<path class="fill-p" stroke="none" d="${smooth(outline, true)}"/>`, P(smooth(outline, true), "k", delay));
    s.push(P(line((t) => sheerAt(t) - h * .1 * Math.sin(t * Math.PI), .06, .94), "m", delay + .05));
    for (let i = 1; i <= 3; i++) { const k = i / 4; s.push(P(line((t) => sheerAt(t) + (Math.max(sheerAt(t) + 4, bottomAt(t)) - sheerAt(t)) * k, .03 + k * .05, .97 - k * .04), i === 2 ? "m" : "f", delay + .08 + i * .03)); }
    for (let i = 1; i < 12; i++) { const t = .06 + (i / 12) * .88; s.push(P(`M${n1(X(t))} ${n1(sheerAt(t) + 3)}L${n1(X(t) + (t - .5) * 6)} ${n1(Math.max(sheerAt(t) + 6, bottomAt(t) - 4))}`, "g", delay + .12 + t * .05)); }
    s.push(P(`M${n1(X(.005))} ${n1(sheerAt(0))}c-4 -10 -6 -22 -2 -34M${n1(X(.995))} ${n1(sheerAt(1))}c6 -10 10 -24 6 -38`, "k", delay + .14));
    s.push(C(X(.86), sheerAt(.86) + h * .22, w * .012, "tf", delay + .2), P(`M${n1(X(.12))} ${n1(sheerAt(.12) + h * .4)}h${n1(w * .08)}`, "g", delay + .2));
    if (mast) {
      const mx = X(.47), my = sheerAt(.47), mt = my - w * .48;
      s.push(P(`M${n1(mx)} ${n1(my)}V${n1(mt)}M${n1(mx + 3)} ${n1(my)}V${n1(mt + 4)}`, "k", delay + .2), P(`M${n1(mx - w * .25)} ${n1(mt + w * .1)}Q${n1(mx)} ${n1(mt + w * .045)} ${n1(mx + w * .26)} ${n1(mt + w * .11)}`, "m", delay + .26));
      for (let i = 0; i < 8; i++) { const t = i / 7, sx = mx - w * .24 + w * .48 * t, sy = mt + w * .1 - Math.sin(t * Math.PI) * w * .05; s.push(P(`M${n1(sx)} ${n1(sy)}q${n1(w * .03)} ${n1(w * .028)} ${n1(w * .06)} 0`, "tf", delay + .3 + t * .05)); }
      s.push(P(`M${n1(mx)} ${n1(mt)}L${n1(X(0))} ${n1(sheerAt(0))}M${n1(mx)} ${n1(mt)}L${n1(X(1))} ${n1(sheerAt(1))}`, "g", delay + .34), P(`M${n1(mx - 6)} ${n1(mt - 2)}h12`, "f", delay + .36));
    }
    if (oars) s.push(P(`M${n1(X(.3))} ${n1(sheerAt(.3))}L${n1(X(.17))} ${n1(y + h * .75)}M${n1(X(.68))} ${n1(sheerAt(.68))}L${n1(X(.8))} ${n1(y + h * .75)}`, "m", delay + .3), E(X(.165), y + h * .8, 7, 2.6, "f", delay + .38, 60), E(X(.805), y + h * .8, 7, 2.6, "f", delay + .38, -60));
    return s.join("");
  };
  // A fish, facing right (dir 1) or left (-1): body, tail, fins, gill, eye, and a few scale arcs.
  const fish = (x, y, s = 1, dir = 1, cls = "m", delay = .5) => {
    const X = (v) => n1(x + v * s * dir), Y = (v) => n1(y + v * s);
    return [P(`M${X(-20)} ${Y(0)}C${X(-10)} ${Y(-9)} ${X(10)} ${Y(-9)} ${X(20)} ${Y(0)}C${X(10)} ${Y(8)} ${X(-10)} ${Y(8)} ${X(-20)} ${Y(0)}Z`, cls, delay),
      P(`M${X(-19)} ${Y(0)}L${X(-29)} ${Y(-7)}Q${X(-26)} ${Y(0)} ${X(-29)} ${Y(7)}Z`, cls, delay + .03), P(`M${X(-3)} ${Y(-7)}q${X(4) - X(0)} ${Y(-6) - Y(0)} ${X(9) - X(0)} ${Y(-6) - Y(0)}q${X(-1) - X(0)} ${Y(3) - Y(0)} ${X(1) - X(0)} ${Y(5) - Y(0)}`, "f", delay + .05),
      P(`M${X(9)} ${Y(-5)}q${X(-2) - X(0)} ${Y(5) - Y(0)} 0 ${Y(10) - Y(0)}`, "f", delay + .06), C(+X(13), +Y(-1.5), 1.3 * s, "f", delay + .07),
      P(`M${X(-8)} ${Y(-2)}q${X(2) - X(0)} ${Y(2) - Y(0)} 0 ${Y(4) - Y(0)}M${X(-2)} ${Y(-3)}q${X(2) - X(0)} ${Y(3) - Y(0)} 0 ${Y(6) - Y(0)}M${X(4)} ${Y(-3)}q${X(2) - X(0)} ${Y(3) - Y(0)} 0 ${Y(6) - Y(0)}`, "g", delay + .08)].join("");
  };
  // A net hung between two edge curves (functions of t from 0 to 1): warp lines along, knots across, a cork line.
  const net = (edgeA, edgeB, cols, rows, delay = .3, cls = "f") => {
    let s = "";
    for (let i = 0; i <= cols; i++) { const t = i / cols, p = []; for (let j = 0; j <= rows; j++) { const q = lerp(edgeA(t), edgeB(t), j / rows); p.push([q[0] + Math.sin(j * 1.7 + i) * 1.6, q[1]]); } s += P(smooth(p), cls, delay + t * .2); }
    for (let j = 0; j <= rows; j++) { const p = []; for (let i = 0; i <= cols; i++) p.push(lerp(edgeA(i / cols), edgeB(i / cols), j / rows)); s += P(smooth(p), j === 0 ? "m" : cls, delay + .1 + (j / rows) * .2); }
    for (let i = 0; i <= cols; i += 2) { const [cx, cy] = edgeA(i / cols); s += E(cx, cy, 3.6, 2.2, "tf", delay + .35 + i * .01); }
    return s;
  };
  // A key: an open bow with a quatrefoil, the shaft, and a bit with wards; rot in degrees.
  const key = (x, y, s = 1, rot = 0, delay = .4) => T(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, [C(0, 0, 22, "t", delay), C(0, 0, 15, "tf", delay + .03),
    P("M-8 0a8 8 0 0 1 16 0a8 8 0 0 1-16 0M0-8a8 8 0 0 1 0 16a8 8 0 0 1 0-16", "tf", delay + .06), P("M22 -3H128M22 3H128M128 -3v6", "t", delay + .08),
    P("M40 -6v12M46 -6v12M52 -6v12", "tf", delay + .1), P("M104 3v22h8v-10h6v10h8v-22", "t", delay + .12), P("M108 9h14M115 15v6", "tf", delay + .14)].join(""));
  const loaf = (x, y, rx, ry, delay = .4) => [P(`M${x - rx} ${y}C${x - rx} ${y - ry * 1.5} ${x + rx} ${y - ry * 1.5} ${x + rx} ${y}C${x + rx * .6} ${y + ry * .35} ${x - rx * .6} ${y + ry * .35} ${x - rx} ${y}Z`, "k", delay),
    P(`M${x - rx * .5} ${y - ry * .55}q${rx * .12} ${-ry * .3} ${rx * .25} ${-ry * .35}M${x - rx * .05} ${y - ry * .7}q${rx * .12} ${-ry * .25} ${rx * .25} ${-ry * .28}M${x + rx * .35} ${y - ry * .55}q${rx * .1} ${-ry * .2} ${rx * .2} ${-ry * .2}`, "tf", delay + .05),
    P(`M${x - rx * .8} ${y - ry * .15}C${x - rx * .3} ${y + ry * .1} ${x + rx * .3} ${y + ry * .1} ${x + rx * .8} ${y - ry * .15}`, "g", delay + .07)].join("");
  // A woven basket: rim, body, upright stakes and crossing weavers.
  const basket = (x, y, w, h, delay = .3) => {
    const s = [E(x, y, w / 2, w * .1, "k", delay), E(x, y, w / 2 - 6, w * .1 - 3, "f", delay + .03), P(`M${x - w / 2} ${y}C${x - w / 2 + 4} ${y + h * .8} ${x - w * .3} ${y + h} ${x} ${y + h}S${x + w / 2 - 4} ${y + h * .8} ${x + w / 2} ${y}`, "k", delay + .05)];
    for (let i = 1; i < 12; i++) { const t = i / 12, sx = x - w / 2 + w * t, bx = x - w * .32 + w * .64 * t; s.push(P(`M${n1(sx)} ${n1(y + w * .1 * Math.sin(t * Math.PI))}Q${n1((sx + bx) / 2)} ${n1(y + h * .6)} ${n1(bx)} ${n1(y + h * .98)}`, "g", delay + .08 + t * .05)); }
    for (let j = 1; j < 5; j++) { const t = j / 5, yy = y + h * t, half = w / 2 - (w * .18) * t * t; s.push(P(`M${n1(x - half)} ${n1(yy)}Q${x} ${n1(yy + w * .1 * (1 - t * .5))} ${n1(x + half)} ${n1(yy)}`, j % 2 ? "f" : "tf", delay + .12 + t * .05)); }
    return s.join("");
  };
  const coin = (x, y, r, delay = .5, tilt = .38) => E(x, y, r, r * tilt, "t", delay) + E(x, y, r * .7, r * .7 * tilt, "tf", delay + .02) + P(`M${x - r * .25} ${y}h${r * .5}`, "tf", delay + .04);
  // A fig leaf: five lobes, a midrib and side veins.
  const figLeaf = (x, y, s = 1, rot = 0, delay = .5) => T(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, [P("M0 0C-6-10-22-12-26-26C-18-28-14-22-12-24C-18-34-12-44-4-48C0-40 2-40 6-48C14-44 18-34 12-24C14-22 18-28 26-26C22-12 6-10 0 0Z", "m", delay),
    P("M0 0V-44M0-14L-20-24M0-14L20-24M0-26L-8-40M0-26L8-40", "g", delay + .05)].join(""));
  // A bank of cloud: a billowing top built from overlapping arcs, a flatter base with curls beneath, inner folds.
  const cloud = (x, y, w, delay = .2, cls = "m", seed = 1) => {
    const r = rng(seed * 7 + 3), top = [], n = 9;
    let px = x - w / 2;
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = (i + .5) / n, rise = Math.sin(t * Math.PI) * w * .2 + r() * w * .04, rr = w / n * (.62 + r() * .3);
      const nx = x - w / 2 + (w * (i + 1)) / n, cy = y - rise;
      top.push(`A${n1(rr)} ${n1(rr * .9)} 0 0 1 ${n1(nx)} ${n1(cy + r() * 6)}`); px = nx;
      if (i % 2 === 0) out.push(P(`M${n1(nx - w / n * .8)} ${n1(cy + rr * .6)}a${n1(rr * .6)} ${n1(rr * .45)} 0 0 1 ${n1(rr * .9)} ${n1(-rr * .1)}`, "g", delay + .05 + t * .1));
    }
    out.unshift(P(`M${n1(x - w / 2)} ${y}${top.join("")}C${n1(x + w * .4)} ${n1(y + 10)} ${n1(x - w * .1)} ${n1(y + 6)} ${n1(x - w / 2)} ${y}Z`, cls, delay));
    for (let i = 0; i < 4; i++) { const sx = x - w * .4 + (w * .8 * i) / 3; out.push(P(`M${n1(sx)} ${n1(y + 2)}q${n1(w * .04)} ${n1(10)} ${n1(w * .09)} 0`, "g", delay + .2 + i * .02)); }
    return out.join("");
  };
  const bolt = (list, delay = .5) => G("lp-flash", P(pts(list), "t bolt", delay));
  // A sword laid flat: blade with its fuller, the crossguard, a wrapped grip and pommel.
  const sword = (x, y, len, rot = 0, delay = .5) => T(`translate(${x} ${y}) rotate(${rot})`, [P(`M0 -5L${len * .78} -5L${len * .86} 0L${len * .78} 5L0 5`, "k", delay), P(`M6 0H${len * .72}`, "f", delay + .05), P("M0 -16V16", "k", delay + .08),
    P(`M-2 -14h4v28h-4zM0 -4H-34M0 4H-34`, "m", delay + .1), P("M-8 -4v8M-14 -4v8M-20 -4v8M-26 -4v8", "g", delay + .12), C(-40, 0, 6, "m", delay + .14)].join(""));
  // An oil lamp of the period: body, filling hole, nozzle, handle, and a living flame.
  const lamp = (x, y, s = 1, delay = .3) => T(`translate(${x} ${y}) scale(${s})`, [P("M-40 0C-40-16 30-18 40-6L62-6C68-6 68 4 62 4L38 6C26 16-34 16-40 0Z", "k", delay), E(-4, -6, 10, 3, "f", delay + .04), P("M-40-2C-56-4-58-20-46-20", "m", delay + .06),
    P("M-30 10C-20 18 20 18 30 10", "g", delay + .08), G("lp-flicker", P("M64-8C56-20 62-34 66-44C70-32 76-20 66-8Z", "t", delay + .2) + P("M65-12C62-18 64-24 66-30C68-24 69-18 65-12Z", "tf", delay + .24))].join(""));
  // An open scroll: two rollers with knobs and the sheet between, ruled with lines of writing.
  const scroll = (x, y, w, h, lines = 10, delay = .2, seed = 3) => {
    const r = rng(seed), s = [P(`M${x - w / 2 + 14} ${y - h / 2}H${x + w / 2 - 14}M${x - w / 2 + 14} ${y + h / 2}H${x + w / 2 - 14}`, "m", delay)];
    for (const sx of [x - w / 2, x + w / 2]) s.push(E(sx, y - h / 2, 14, 5, "k", delay + .03), P(`M${sx - 14} ${y - h / 2}V${y + h / 2}M${sx + 14} ${y - h / 2}V${y + h / 2}`, "k", delay + .05), E(sx, y + h / 2, 14, 5, "k", delay + .07), P(`M${sx} ${y - h / 2 - 5}v-14M${sx} ${y + h / 2 + 5}v14`, "m", delay + .09), C(sx, y - h / 2 - 22, 5, "tf", delay + .1), C(sx, y + h / 2 + 22, 5, "tf", delay + .1));
    for (let i = 0; i < lines; i++) { const yy = y - h / 2 + 18 + i * ((h - 36) / Math.max(1, lines - 1)); let xx = x - w / 2 + 32; while (xx < x + w / 2 - 40) { const ww = 14 + r() * 40; s.push(P(`M${n1(xx)} ${n1(yy)}h${n1(Math.min(ww, x + w / 2 - 36 - xx))}`, "g", delay + .15 + i * .02)); xx += ww + 6 + r() * 6; } }
    return s.join("");
  };
  // A rough stone or a lot; a money bag with its drawstring.
  const stone = (x, y, r, seed, cls = "m", delay = .5) => { const q = rng(seed), p = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, rr = r * (.8 + q() * .3); p.push([x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr * .8]); } return P(smooth(p, true), cls, delay); };
  const bag = (x, y, s = 1, delay = .3) => T(`translate(${x} ${y}) scale(${s})`, [
    P("M-12-38C-58-32-76 34-42 56C-22 68 22 68 42 56C76 34 58-32 12-38", "k", delay), P("M-12-40C-18-48-28-56-34-66C-20-60-10-70 0-62C10-70 22-60 34-66C28-56 18-48 12-40", "k", delay + .05),
    E(0, -39, 14, 4.5, "t", delay + .1), P("M8-36C22-30 30-18 26-2M26-2c-4 4-2 10 3 9M22-38C34-36 40-26 40-14", "t", delay + .12), C(26, -4, 3, "t", delay + .14),
    P("M-6-34C-22 0-28 30-22 54M4-34C10 0 8 30 12 56M-14-36C-40-14-48 14-40 44M14-36C34-18 42 10 38 40", "g", delay + .16), P("M-24-54c4 4 8 6 12 4M8-54c4 2 8 2 12-2", "f", delay + .18),
    P("M-40 48C-10 60 10 60 40 48", "f", delay + .2)].join(""));
  // A city wall with towers and a gate, coursed stone.
  const walls = (x, y, w, h, delay = .2, gate = true) => {
    const s = [P(`M${x} ${y}V${y - h}H${x + w}V${y}`, "m", delay)];
    for (let i = 0; i < w / 18; i++) s.push(P(`M${x + i * 18 + 4} ${y - h}v-7h10v7`, "f", delay + .05 + i * .004));
    for (const tx of [x - 20, x + w - 20]) s.push(P(`M${tx} ${y}V${y - h * 1.5}H${tx + 40}V${y}`, "m", delay + .08), P(`M${tx + 4} ${y - h * 1.5}v-8h10v8M${tx + 26} ${y - h * 1.5}v-8h10v8`, "f", delay + .1), P(`M${tx + 16} ${y - h * 1.1}v-10a4 4 0 0 1 8 0v10z`, "g", delay + .12));
    for (let j = 1; j < 4; j++) s.push(P(`M${x} ${y - (h * j) / 4}H${x + w}`, "g", delay + .14 + j * .02));
    if (gate) s.push(P(`M${x + w / 2 - 16} ${y}V${y - h * .55}a16 16 0 0 1 32 0V${y}`, "k", delay + .16));
    return s.join("");
  };
  const column = (x, y, h, delay = .2) => [P(`M${x - 10} ${y}V${y - h}M${x + 10} ${y}V${y - h}`, "m", delay), P(`M${x - 4} ${y}V${y - h}M${x + 4} ${y}V${y - h}`, "g", delay + .04),
    P(`M${x - 16} ${y - h}h32l-4 -8h-24z M${x - 14} ${y}h28v6h-28z`, "m", delay + .06), P(`M${x - 18} ${y - h - 8}q-6 -6 0 -10M${x + 18} ${y - h - 8}q6 -6 0 -10`, "tf", delay + .08)].join("");
  // An olive tree: a twisted trunk and clusters of narrow leaves.
  const olive = (x, y, s = 1, seed = 5, delay = .3) => {
    const r = rng(seed), out = [P(`M${x - 8 * s} ${y}C${x - 4 * s} ${y - 30 * s} ${x - 22 * s} ${y - 50 * s} ${x - 10 * s} ${y - 80 * s}M${x + 8 * s} ${y}C${x + 12 * s} ${y - 30 * s} ${x - 2 * s} ${y - 56 * s} ${x + 14 * s} ${y - 82 * s}`, "k", delay), P(`M${x - 2 * s} ${y - 20 * s}c${4 * s} ${-12 * s} ${-6 * s} ${-20 * s} 0 ${-34 * s}`, "g", delay + .04)];
    const top = [[x - 10 * s, y - 80 * s], [x + 14 * s, y - 82 * s]];
    for (let b = 0; b < 7; b++) {
      const [bx, by] = top[b % 2], a = -Math.PI * (.12 + (b / 6) * .76), len = (60 + r() * 40) * s, ex = bx + Math.cos(a) * len * 1.2, ey = by + Math.sin(a) * len * .7;
      out.push(P(`M${n1(bx)} ${n1(by)}Q${n1((bx + ex) / 2 + (r() - .5) * 20 * s)} ${n1((by + ey) / 2 - 10 * s)} ${n1(ex)} ${n1(ey)}`, "m", delay + .06 + b * .02));
      for (let k = 0; k < 7; k++) {
        const t = .35 + (k / 6) * .65, lx = bx + (ex - bx) * t, ly = by + (ey - by) * t - Math.sin(t * Math.PI) * 6 * s, la = a + (k % 2 ? .9 : -.9) + (r() - .5) * .4, ll = (14 + r() * 8) * s;
        out.push(P(`M${n1(lx)} ${n1(ly)}q${n1(Math.cos(la - .3) * ll * .5)} ${n1(Math.sin(la - .3) * ll * .5)} ${n1(Math.cos(la) * ll)} ${n1(Math.sin(la) * ll)}q${n1(Math.cos(la + Math.PI + .3) * ll * .5)} ${n1(Math.sin(la + Math.PI + .3) * ll * .5)} ${n1(-Math.cos(la) * ll)} ${n1(-Math.sin(la) * ll)}`, k % 3 ? "f" : "tf", delay + .15 + b * .03 + k * .01));
      }
    }
    return G("lp-sway", out.join(""), "--rot:.6deg;--dur:9s");
  };
  // A broad tree: a trunk that forks into limbs; each limb ends in a cluster of fig leaves with fruit.
  const figTree = (x, y, s = 1, seed = 9, delay = .2) => {
    const r = rng(seed), out = [], tips = [];
    const limb = (x0, y0, ang, len, depth, w) => {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len, mx = (x0 + x1) / 2 + (r() - .5) * len * .25, my = (y0 + y1) / 2 + (r() - .5) * len * .2;
      out.push(P(`M${n1(x0 - w)} ${n1(y0)}Q${n1(mx - w * .6)} ${n1(my)} ${n1(x1)} ${n1(y1)}M${n1(x0 + w)} ${n1(y0)}Q${n1(mx + w * .6)} ${n1(my)} ${n1(x1)} ${n1(y1)}`, depth < 2 ? "k" : "m", delay + depth * .08));
      if (depth >= 3 || len < 40 * s) { tips.push([x1, y1]); return; }
      const k = depth === 0 ? 3 : 2;
      for (let i = 0; i < k; i++) limb(x1, y1, ang + (i - (k - 1) / 2) * (.55 + r() * .25) + (r() - .5) * .2, len * (.62 + r() * .15), depth + 1, Math.max(1.5, w * .6));
    };
    limb(x, y, -Math.PI / 2, 150 * s, 0, 11 * s);
    out.push(P(`M${n1(x - 11 * s)} ${y}c${n1(-14 * s)} 6 ${n1(-28 * s)} 8 ${n1(-40 * s)} 6M${n1(x + 11 * s)} ${y}c${n1(14 * s)} 6 ${n1(30 * s)} 8 ${n1(44 * s)} 4`, "m", delay + .05), P(`M${n1(x - 3 * s)} ${n1(y - 20 * s)}c${n1(4 * s)} ${n1(-30 * s)} ${n1(-6 * s)} ${n1(-60 * s)} 0 ${n1(-100 * s)}`, "g", delay + .1));
    const leaves = [];
    for (const [tx, ty] of tips) for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * .7 + (r() - .5) * .3; leaves.push(figLeaf(n1(tx + Math.cos(a) * 26 * s), n1(ty + Math.sin(a) * 22 * s), (1.05 + r() * .35) * s, n1((a + Math.PI / 2) * 57), delay + .4 + r() * .2)); if (r() > .45) leaves.push(E(n1(tx + (r() - .5) * 30 * s), n1(ty + 8 * s), 6 * s, 8 * s, "t", delay + .6)); }
    return out.join("") + G("lp-sway", leaves.join(""), "--rot:.6deg;--dur:9s");
  };
  const svg = (vb, body, cls = "") => `<svg class="art ${cls}" viewBox="${vb}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  return { figTree, P, E, C, G, T, rng, pts, smooth, bez, lerp, stars, ridge, hills, water, grass, birds, sun, rays, boat, fish, net, key, loaf, basket, coin, figLeaf, cloud, bolt, sword, lamp, scroll, stone, bag, walls, column, olive, svg, n1 };
})();
