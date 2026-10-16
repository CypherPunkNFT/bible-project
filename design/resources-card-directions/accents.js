(() => {
  // Mark only the selected details; keep the geometry and masking paths intact.
  const learning = window.resourceFocusedRows[0].items[1];
  if (!learning.art.includes('resource-glow-target')) {
    learning.art = learning.art.replace(/(<path d="M\d+ (?:77|115)V[^"]+" class=")fine"/g, '$1fine resource-glow-target"');
    learning.art = learning.art.replace(/<g class="turning-page">[\s\S]*?<\/g>/, book => book.replace(/class="(paper|fine)"/g, 'class="$1 resource-glow-target"'));
  }
  const fellowship = window.resourceFocusedRows[3].items[0];
  const landscape = window.resourceFocusedRows[7].items[1];
  landscape.art = landscape.art.replace('class="morning-art"', 'class="morning-art resource-life-landscape"');
  landscape.art = landscape.art.replace('d="M8 124Q77 117 133 121Q210 118 272 126M17 131H76M210 131H258" class="land-fine"', 'd="M8 124Q77 117 133 121Q210 118 272 126M17 131H76M210 131H258" class="land-fine resource-far-shore"');
  if (!fellowship.art.includes('resource-glow-person')) {
    fellowship.art = fellowship.art.replaceAll('<g transform="translate(140 106) rotate(', '<g class="resource-glow-person" transform="translate(140 106) rotate(');
    const bookStart = fellowship.art.lastIndexOf('</g>') + 4;
    fellowship.art = fellowship.art.slice(0, bookStart) + '<g class="resource-glow-target">' + fellowship.art.slice(bookStart) + '</g>';
  }
  const path = d => `<path d="${d}"/>`;
  const at = (x,y,s,art) => `<g transform="translate(${x} ${y}) scale(${s})">${art}</g>`;
  const cross = '<path class="resource-solid-cross" d="M-2-9H2V-3H7V1H2V9H-2V1H-7V-3H-2Z"/>';
  const lineCross = path('M0-9V9M-6-3H6');
  const star = path('M0-7L1.8-1.8L7 0L1.8 1.8L0 7L-1.8 1.8L-7 0L-1.8-1.8Z');
  const heart = path('M0 5C-2 3-7 0-7-4C-7-8-2-9 0-5C2-9 7-8 7-4C7 0 2 3 0 5Z');
  const accents = art => `<g class="resource-margin-accents">${art}</g>`;
  window.resourceFocusedRows[0].items[1].art += accents(
    at(25,80,.8,lineCross)+at(254,142,.65,lineCross)+at(246,48,.85,star)+at(28,147,.65,star)+at(207,12,.45,star)
    +at(38,31,.6,lineCross)+at(20,112,.5,star)+at(263,87,.6,star)
    +at(97,8,.65,lineCross)+at(178,8,.55,lineCross)+at(64,14,.55,star)+at(142,5,.4,star));
  window.resourceFocusedRows[3].items[0].art += accents(
    at(27,98,.8,cross)+at(254,119,.65,cross)+at(54,28,.85,heart)+at(229,29,.7,heart)+at(38,177,.65,heart)+at(235,182,.85,heart)
    +at(97,13,.6,cross)+at(263,157,.6,cross)+at(23,57,.65,star)+at(258,69,.7,star)+at(91,192,.5,star));
  const cloud = path('M5 22C-1 22-2 14 4 12C3 6 9 3 14 6C16-2 27-2 30 5C35 1 42 5 41 11C49 10 53 17 48 21C46 23 41 23 37 23H9Q6 23 5 22Z')
    + '<path class="cloud-fold" d="M8 13Q10 9 15 10M29 7Q33 6 35 10M34 19Q39 17 43 19"/>';
  const cloudNear = path('M6 23C-1 23-2 16 5 14C4 9 10 6 15 9C17 4 24 4 27 10C33 6 40 10 40 15C45 12 52 16 50 21C48 25 42 24 36 24H12Q8 24 6 23Z')
    + '<path class="cloud-fold" d="M11 15Q14 12 18 14M27 19Q33 16 38 19"/>';
  const cloudSmall = path('M8 24C1 24-1 17 5 13C4 8 9 4 14 6C16-2 27-1 29 7C37 5 43 13 39 19C45 22 41 27 34 27L13 26Q9 26 8 24Z')
    + '<path class="cloud-fold" d="M10 15Q10 10 15 10M25 20Q29 18 33 20"/>';
  const cloudMid = path('M4 23C-2 22-1 15 5 14C6 7 14 5 20 10C23 7 28 8 30 12C29 3 39-1 45 5C48 8 48 11 47 14C56 12 61 20 55 24C51 27 43 25 39 25H12Q6 25 4 23Z')
    + '<path class="cloud-fold" d="M8 16Q12 12 17 15M34 11Q36 6 41 8M39 21Q45 18 50 21"/>';
  window.resourceFocusedRows[7].items[1].art += `<g class="resource-clouds">${at(13,53,.77,`<g class="resource-cloud cloud-near">${cloudNear}</g>`)}${at(185,32,1.05,`<g class="resource-cloud cloud-far">${cloud}</g>`)}${at(40,7,.43,`<g class="resource-cloud cloud-small">${cloudSmall}</g>`)}${at(77,5,.65,`<g class="resource-cloud cloud-mid">${cloudMid}</g>`)}</g>`;
  // A separate stroke-only layer fades in smoothly. Opaque masks, paper fills,
  // and the fellowship table never become filter inputs.
  const addLineGlow = (item, names, gold = false) => {
    if (item.art.includes('resource-glow-line')) return;
    item.art = item.art.replace(/<(?:path|circle)\b[^>]*\/>/g, tag => {
      const classes = (tag.match(/class="([^"]*)"/)?.[1] || '').split(' ');
      if (!classes.some(c => names.includes(c))) return tag;
      const line = tag.replace(/\s(?:class|fill|stroke|stroke-width)="[^"]*"/g, '')
        .replace('/>', ` class="resource-glow-line${gold ? ' resource-glow-gold' : ''}" fill="none" aria-hidden="true"/>`);
      return tag + line;
    });
  };
  addLineGlow(learning, ['resource-glow-target']);
  addLineGlow(fellowship, ['paper', 'fine', 'bible-print']);
  addLineGlow(window.resourceFocusedRows[7].items[1], ['morning-disc', 'lake-ray', 'lake-reflection'], true);
})();
