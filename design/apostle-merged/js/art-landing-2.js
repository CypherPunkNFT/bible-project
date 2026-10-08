// The landing drawings, continued: Matthew, James son of Alphaeus, Thaddaeus, Simon the Zealot, Judas Iscariot,
// Matthias and Paul. The two men known only from the lists are drawn from the lists themselves (his place in each,
// from the page data), honestly spare.
window.LANDING = window.LANDING ?? {};
(() => {
  const { P, E, C, G, T, rng, smooth, stars, hills, water, grass, birds, sun, rays, coin, lamp, loaf, scroll, stone, bag, walls, column, olive, n1 } = Kit;
  const sky = (seed, n = 40) => stars(n, seed, [560, 30, 1600, 380], .7) + stars(10, seed + 9, [40, 30, 560, 220], .8);
  const BOOK = { MAT: "Matthew 10", MRK: "Mark 3", LUK: "Luke 6", ACT: "Acts 1" };
  const txt = (x, y, s, cls = "lbl", anchor = "middle", d = .6) => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}" style="--d:${d}">${String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>`;

  // Matthew: "sitting at the receipt of custom" by the sea side (Matthew 9:9; Mark 2:13–14): the awning, the table
  // with its coins, scales and tablet, the empty seat ("he arose"), and steps leading away.
  LANDING.matthew = () => {
    const r = rng(81), stacks = [[930, 640, 7], [980, 650, 10], [1030, 638, 5]].map(([x, y, n], i) => Array.from({ length: n }, (_, j) => E(x, y - j * 7, 21, 7, j === n - 1 ? "t" : "tf", .5 + i * .04 + j * .01)).join("")).join("");
    const loose = Array.from({ length: 8 }, () => coin(n1(1080 + r() * 150), n1(650 + r() * 26), 13, .6 + r() * .1, .4)).join("");
    return [
      sky(83, 30), hills(440, 36, 31, 420, 1600, "g", .02), water(420, 1600, 456, 530, 5, 13, "w", .08), P("M420 538C800 546 1200 544 1600 538", "f", .1),
      P("M800 830V380M1480 830V380", "k", .15), P("M806 830V386M1486 830V386", "g", .17),
      G("lp-sway", P("M770 380C940 352 1340 352 1510 380L1500 432C1450 410 1420 452 1370 430C1320 408 1290 452 1240 430C1190 408 1160 452 1110 430C1060 408 1030 452 980 430C930 408 900 452 850 430L770 432Z", "m", .2)
        + P("M800 392C960 370 1330 370 1480 392M800 404C960 384 1330 384 1480 404", "g", .25), "--rot:.4deg;--dur:8s"),
      P("M840 680L1440 680L1400 616L880 616Z", "k", .3), P("M840 680V800M1440 680V800M880 616V760M1400 616V760M846 690H1434", "m", .32), P("M860 700H1420", "g", .34),
      stacks, loose,
      P("M1290 612V530M1240 530H1340M1240 530l-16 40h32zM1340 530l-16 40h32z", "m", .55), E(1240, 570, 18, 4, "tf", .6), E(1340, 570, 18, 4, "tf", .6), C(1290, 526, 4, "t", .6), P("M1278 612h24", "m", .6),
      P("M1100 634l84-6l8 26l-84 6z M1142 631l4 26", "m", .62), P("M1110 640h26M1110 646h24M1112 652h22M1152 637h28M1152 643h26M1154 649h22", "g", .66), P("M1206 612l-46 30", "tf", .68),
      P("M640 800l64-8l10 34l-64 8zM648 834v40M706 826v40M650 800l-12-50", "m", .5),
      P("M380 870C700 846 1000 840 1600 852", "g", .1), P("M380 870C700 846 1000 840 1600 852", "dash", .4),
      ...[[600, 850], [520, 856], [440, 862]].map(([x, y], i) => G("lp-walk", E(x, y, 7, 3.5, "t", .6) + E(x - 16, y + 8, 7, 3.5, "t", .62), `--wd:${i * .5}s`)),
      grass(820, 1600, 880, 30, 82, 18, "f", .6), birds([[1100, 290, 1], [1150, 270, .8]], .9),
    ].join("");
  };

  // The four lists as standing scrolls, twelve lines each (eleven in Acts 1), his line lit and joined across.
  const listScrolls = (d, x0, x1, y, h, seed) => {
    const lists = d.lists ?? [], w = (x1 - x0) / Math.max(1, lists.length), out = [], marks = [];
    lists.forEach((l, i) => {
      const cx = x0 + w * (i + .5), n = l.book === "ACT" ? 11 : 12, sw = w * .62;
      out.push(scroll(cx, y, sw, h, 0, .1 + i * .06, seed + i));
      for (let k = 1; k <= n; k++) { const yy = y - h / 2 + 22 + (k - 1) * ((h - 44) / 11), on = k === l.position; out.push(P(`M${n1(cx - sw / 2 + 26)} ${n1(yy)}h${n1(sw - 52 - (k * 7) % 20)}`, on ? "t" : "g", .3 + i * .05 + k * .01)); if (on) marks.push([cx - sw / 2 + 18, yy, cx + sw / 2 - 18]); out.push(txt(n1(cx - sw / 2 + 14), n1(yy + 3), k, "lbl", "middle", .5)); }
      out.push(txt(n1(cx), n1(y + h / 2 + 52), BOOK[l.book] ?? l.book, "lbl", "middle", .7), txt(n1(cx), n1(y + h / 2 + 74), l.name, "lbl-t", "middle", .75));
    });
    for (let i = 0; i < marks.length - 1; i++) out.push(P(`M${n1(marks[i][2])} ${n1(marks[i][1])}C${n1(marks[i][2] + 40)} ${n1(marks[i][1])} ${n1(marks[i + 1][0] - 40)} ${n1(marks[i + 1][1])} ${n1(marks[i + 1][0])} ${n1(marks[i + 1][1])}`, "t", .8));
    marks.forEach(([x, yy], i) => out.push(G("lp-pulse", C(x, yy, 5, "t", .85), `animation-delay:${i * .6}s`)));
    return out.join("");
  };
  // James son of Alphaeus: ninth in every list (Matthew 10:3; Mark 3:18; Luke 6:15; Acts 1:13).
  LANDING.jamesa = (d) => [sky(91, 26), P("M600 820H1600", "g", .05), listScrolls(d, 640, 1580, 450, 520, 92)].join("");

  // Simon the Zealot: the four lists as rows of twelve marks; his mark moves from eleventh (Matthew, Mark: "the
  // Canaanite") to tenth (Luke, Acts: "Zelotes"), and each list's own words for him stand beside it.
  LANDING.simonz = (d) => {
    const out = [sky(101, 30)], lists = d.lists ?? [], x0 = 700, x1 = 1440, step = (x1 - x0) / 11, hits = [];
    lists.forEach((l, i) => {
      const y = 250 + i * 150, n = l.book === "ACT" ? 11 : 12;
      out.push(P(`M${x0 - 20} ${y}H${x1 + 20}`, "f", .1 + i * .05), txt(x0 - 40, y + 4, BOOK[l.book] ?? l.book, "lbl", "end", .4));
      for (let k = 1; k <= n; k++) { const x = x0 + (k - 1) * step, on = k === l.position; out.push(on ? C(x, y, 9, "t", .3 + k * .01) + C(x, y, 15, "tf", .35) : C(x, y, 4, "m", .2 + i * .05 + k * .01)); if (on) hits.push([x, y, l]); }
    });
    hits.forEach(([x, y, l], i) => { out.push(txt(n1(x + 30), n1(y - 22), l.name, "lbl-t", "start", .8)); if (i) out.push(P(`M${n1(hits[i - 1][0])} ${n1(hits[i - 1][1] + 15)}C${n1(hits[i - 1][0])} ${n1(y - 70)} ${n1(x)} ${n1(hits[i - 1][1] + 80)} ${n1(x)} ${n1(y - 15)}`, "tf", .85)); });
    out.push(G("lp-breathe", P(`M${x0 - 20} 840H${x1 + 20}`, "g", .2)));
    return out.join("");
  };

  // Thaddaeus: his one question at the supper, "how is it that thou wilt manifest thyself unto us, and not unto the
  // world?" (John 14:22). The room, the lamp, the bread, and through the window the world at night.
  LANDING.thaddaeus = () => {
    const r = rng(111), roofs = Array.from({ length: 9 }, (_, i) => { const x = 930 + i * 46, h = 20 + r() * 40; return P(`M${x} 600v-${n1(h)}h${n1(30 + r() * 12)}v${n1(h)}`, "f", .3 + i * .02); }).join("");
    return [
      P("M900 640V300C900 190 1000 120 1120 120C1240 120 1340 190 1340 300V640", "k", .05), P("M920 640V304C920 206 1010 142 1120 142C1230 142 1320 206 1320 304V640", "f", .08),
      P("M1120 142V640M920 390H1320", "m", .12), stars(28, 113, [930, 160, 1310, 520], .5), roofs, P("M930 600H1310", "f", .3),
      G("lp-breathe", P("M1190 220a20 20 0 1 0 18 28a16 16 0 0 1-18-28z", "tf", .5)),
      P("M860 640H1380V666H860Z", "k", .35), P("M700 760H1560L1520 700H740Z", "k", .4), P("M740 760V830M1520 760V830", "m", .42), P("M760 716H1500", "g", .44),
      lamp(1000, 690, 1.4, .5), G("lp-breathe", rays(1095, 650, 30, 120, 12, Math.PI * .95, Math.PI * 2.05, "tf", .6)),
      loaf(1280, 708, 60, 22, .55), P("M1360 712c10-6 30-6 40 0", "g", .6),
      stars(14, 117, [40, 40, 620, 300], .8),
    ].join("");
  };

  // Judas Iscariot: "a thief, and had the bag" (John 12:6); "thirty pieces of silver" (Matthew 26:15), which he
  // "cast down … in the temple" (Matthew 27:5). Drawn soberly: the bag, the pieces on the pavement, the columns.
  LANDING.iscariot = () => {
    const r = rng(121), out = [];
    for (let i = 0; i < 8; i++) out.push(P(`M${n1(800 - i * 30)} ${n1(620 + i * 30)}H${n1(1560 + i * 10)}`, "g", .05 + i * .02));
    for (let i = 0; i < 12; i++) out.push(P(`M${n1(820 + i * 66)} 620L${n1(560 + i * 92)} 860`, "g", .08 + i * .01));
    [840, 1040, 1240, 1440].forEach((x, i) => out.push(column(x, 600, 380, .1 + i * .04)));
    out.push(P("M780 220H1500M790 206H1490", "f", .2));
    out.push(bag(940, 650, 2.4, .3));
    const placed = [];
    while (placed.length < 30) { const x = 1120 + r() * 420, y = 690 + r() * 160; if (placed.every(([a, b]) => Math.hypot(a - x, (b - y) * 2) > 30)) placed.push([x, y]); }
    placed.forEach(([x, y], i) => out.push(G(i % 7 === 3 ? "lp-glint" : "", coin(n1(x), n1(y), 15, .45 + i * .012, .42), `--gd:${(i % 5) * 1.1}s`)));
    out.push(stars(12, 123, [40, 40, 640, 300], .8));
    return out.join("");
  };

  // Matthias: "they gave forth their lots; and the lot fell upon Matthias; and he was numbered with the eleven
  // apostles" (Acts 1:26). Twelve places, eleven taken; two named (Acts 1:23); the lot falling.
  LANDING.matthias = () => {
    const out = [sky(131, 24)], cx = 1120, cy = 600, R = 330;
    for (let i = 0; i < 12; i++) { const a = Math.PI * (1.08 + (i / 11) * .84), x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * .8; out.push(i === 11 ? G("lp-pulse", C(n1(x), n1(y), 14, "t", .5) + C(n1(x), n1(y), 22, "tf", .55)) : C(n1(x), n1(y), 11, "m", .3 + i * .02) + C(n1(x), n1(y), 4, "f", .35 + i * .02)); }
    out.push(txt(cx, cy - R * .8 - 40, "THE TWELVE", "lbl", "middle", .4));
    out.push(P(`M${cx - 360} 760H${cx + 360}`, "k", .2), P(`M${cx - 330} 760V800M${cx + 330} 760V800M${cx - 350} 778H${cx + 350}`, "f", .22));
    out.push(P(`M${cx - 80} 760C${cx - 96} 690 ${cx - 50} 640 ${cx} 640C${cx + 50} 640 ${cx + 96} 690 ${cx + 80} 760Z`, "k", .3), E(cx, 640, 36, 9, "m", .32), P(`M${cx - 70} 700C${cx - 30} 712 ${cx + 30} 712 ${cx + 70} 700M${cx - 78} 728C${cx - 30} 740 ${cx + 30} 740 ${cx + 78} 728`, "g", .34));
    out.push(stone(cx - 220, 738, 26, 7, "m", .45), txt(cx - 220, 830, "Joseph called Barsabas", "lbl-t", "middle", .7));
    out.push(G("lp-fall", stone(cx + 220, 738, 26, 9, "t", .5)), txt(cx + 220, 830, "Matthias", "lbl-t", "middle", .75));
    return out.join("");
  };

  // Paul: "suddenly there shined round about him a light from heaven" on the road to Damascus (Acts 9:3); the
  // letters he carried there (Acts 9:2) lying on the road.
  LANDING.paul = () => {
    const out = [stars(30, 141, [40, 30, 700, 300], .8), hills(560, 50, 41, 380, 1600, "g", .02), hills(600, 30, 42, 380, 1600, "f", .05)];
    out.push(walls(1360, 560, 180, 36, .15), P("M1410 524v-28h76v28M1426 496l22-18 22 18", "m", .25));
    out.push(P("M520 900C800 760 1180 640 1390 566", "k", .2), P("M1020 900C1140 760 1320 650 1430 566", "k", .22), P("M770 900C960 780 1240 660 1410 566", "g", .25));
    for (let i = 0; i < 9; i++) { const t = i / 8; out.push(P(`M${n1(640 + t * 720)} ${n1(880 - t * 300)}h${n1(14 - t * 10)}`, "g", .3 + t * .1)); }
    out.push(`<circle class="sunfill" cx="1100" cy="-120" r="320"/>`, G("lp-breathe", rays(1100, -120, 200, 1060, 40, Math.PI * .22, Math.PI * .8, "tf", .4)), G("lp-breathe", rays(1100, -120, 220, 760, 20, Math.PI * .3, Math.PI * .7, "t", .45)), C(1100, -120, 200, "tf", .3));
    out.push(T("translate(880 790) rotate(-12)", scroll(0, 0, 230, 84, 5, .6, 143) + C(0, 50, 9, "t", .7) + P("M-5 58l-6 22M5 58l6 22", "tf", .72)));
    const r = rng(147); for (let i = 0; i < 14; i++) out.push(stone(n1(500 + r() * 1000), n1(860 + r() * 30), 4 + r() * 6, i + 1, "f", .5 + r() * .2));
    out.push(grass(380, 900, 880, 30, 145, 20, "f", .6));
    return out.join("");
  };
})();
