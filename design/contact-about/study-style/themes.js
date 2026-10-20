// The twelve themes for the study-style contact pages, in three sets of four. Each changes only the hero: the drawing
// (arts.js), the heading, the two short lines under it and the caption beside the drawing. Wording is a draft for Lucas.
window.SS_SETS = [
  { numeral: "I", title: "The written Word", line: "Book, scroll, fragment and the word itself.", themes: [
    { key: "codex", name: "The open codex", kicker: "Write · Read · Reply", h1: ["Write to us.", "Every word is read."], sub: ["One library of the faith.", "One person reading your letters."], cap: ["One open book.", "Free to every reader."] },
    { key: "scroll", name: "The scroll", kicker: "One story · many hands", h1: ["Add your line", "to the story."], sub: ["Two thousand years of writing.", "Your message is the next line."], cap: ["One story.", "Many hands."] },
    { key: "fragment", name: "The fragment", kicker: "What survives · what is missing", h1: ["Something missing?", "Tell us."], sub: ["The pages did not all survive.", "Help us mend the ones that did."], cap: ["What survives,", "gathered and kept."] },
    { key: "magnifier", name: "The word, closer", kicker: "Look closer · ask anything", h1: ["Look closer.", "Ask anything."], sub: ["Every word can be traced.", "Every question is welcome."], cap: ["λόγος · the word.", "Read closely."] },
  ] },
  { numeral: "II", title: "Letters and writing", line: "The faith travelled by letter and by hand.", themes: [
    { key: "epistle", name: "Grace to you", kicker: "A letter · a greeting · a reply", h1: ["Grace to you,", "and peace."], sub: ["The church grew by letters.", "Write one to us."], cap: ["χάρις ὑμῖν.", "Galatians 1:3"] },
    { key: "reed", name: "Reed and ink", kicker: "Copied by hand", h1: ["Write in", "your own hand."], sub: ["Copied by hand for centuries.", "Read by a person today."], cap: ["Reed and ink.", "Copied by hand."] },
    { key: "tablet", name: "The wax tablet", kicker: "A word · a reply", h1: ["A word,", "then a reply."], sub: ["Every message is read", "by the one person who builds this."], cap: ["Wax and stylus.", "Written to be answered."] },
    { key: "margins", name: "In the margin", kicker: "Corrections · questions · notes", h1: ["Corrections", "welcome."], sub: ["Scribes corrected in the margins.", "So can you."], cap: ["A correction,", "kept in the margin."] },
  ] },
  { numeral: "III", title: "Wider themes", line: "A shelf, a sea road, a door and a seed.", themes: [
    { key: "shelf", name: "One shelf", kicker: "Gathered · kept · open", h1: ["Two thousand years.", "One shelf."], sub: ["Gathered in one place.", "Open to everyone."], cap: ["Every scroll", "within reach."] },
    { key: "map", name: "Across the sea", kicker: "Jerusalem · Antioch · Ephesus · Corinth · Rome", h1: ["Letters crossed the sea.", "So can yours."], sub: ["From Jerusalem to Rome,", "the faith travelled by letter."], cap: ["Jerusalem to Rome.", "By hand and by sea."] },
    { key: "door", name: "An open door", kicker: "Free · open · come in", h1: ["An open door.", "Come in."], sub: ["Free, and fully open", "to anyone who knocks."], cap: ["I have set before thee an open door.", "Revelation 3:8"] },
    { key: "mustard", name: "The mustard seed", kicker: "Small beginnings", h1: ["Small beginnings.", "Write to us."], sub: ["One person began it.", "It grows for everyone."], cap: ["The least of all seeds.", "Matthew 13:32"] },
  ] },
];
window.SS_THEMES = Object.fromEntries(SS_SETS.flatMap((set) => set.themes.map((theme) => [theme.key, { ...theme, set }])));
