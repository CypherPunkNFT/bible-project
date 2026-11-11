// The older graces and blessings (design 2.5, 4.3): public domain in the United States and the United Kingdom, each stored
// exactly as the early printing it was checked against (only the long s is modernised), with that check recorded. Old
// spellings stay and get a gloss. A checksum test in the test file catches an accidental "modernising" edit; never change a
// word here without a new check against a printing.
import type { OlderId, OlderText } from "./types";

/** Shown beside "Now I lay me down to sleep" and under Duncan's third verse (design 4.3). */
export const DEATH_NOTE =
  "Children used to pray this when many did not live to grow up. It trusts God with everything, even death, and that is a true and good thing to know. Some children find the line about dying frightening; if yours does, the prayers above it are gentler. There is no need to change the old words: choose the prayer that fits your child.";

const CHECKED = "checked word for word on 2026-11-10";

const TEXTS: OlderText[] = [
  {
    id: "guiterman-house",
    title: "House Blessing",
    lines: [
      "Bless the four corners of this house,",
      "And be the lintel blest;",
      "And bless the hearth and bless the board",
      "And bless each place of rest;",
      "And bless the door that opens wide",
      "To stranger as to kin;",
      "And bless each crystal window-pane",
      "That lets the starlight in;",
      "And bless the rooftree overhead",
      "And every sturdy wall.",
      "The peace of man, the peace of God,",
      "The peace of Love on all!",
    ],
    author: "Arthur Guiterman",
    year: "1918",
    source: "Arthur Guiterman, The Mirthful Lyre (New York: Harper, 1918), page 189",
    checkedAgainst: `https://archive.org/details/mirthfullyre01guitgoog, The Mirthful Lyre (1918), page 189, read on the page image; ${CHECKED}`,
    glosses: [
      { word: "lintel", meaning: "the beam over the door" },
      { word: "blest", meaning: "blessed" },
      { word: "board", meaning: "the table" },
      { word: "rooftree", meaning: "the main beam of the roof" },
    ],
    note: "Often sold as an Irish blessing; the words are by the American poet Arthur Guiterman.",
  },
  {
    id: "come-lord-jesus",
    title: "Come, Lord Jesus",
    lines: ["Come, Lord Jesus, be our Guest,", "And let Thy gifts to us be blest. Amen."],
    author: "Traditional German table prayer",
    year: "in English by 1885",
    source: "A German table prayer, “Komm, Herr Jesu, sei unser Gast”, first known in a 1698 schoolbook; this English form is from the Little Children's Book (Philadelphia, 1885), “Grace at Meat”",
    checkedAgainst: `https://archive.org/details/littlechildb00unit, Little Children's Book: for Schools and Families (Philadelphia: J. C. File, copyright 1885), “Grace at Meat”, number 1, read in the scan's text; ${CHECKED}`,
    glosses: [{ word: "blest", meaning: "blessed" }],
    note: "A table prayer German families have said since at least 1698. Many now say “let these gifts to us be blessed”; this is the older English wording.",
  },
  {
    id: "cennick-table",
    title: "Be present at our table, Lord",
    lines: [
      "Be present at our Table, LORD;",
      "Be Here, and Ev'ry Where ador'd;",
      "Thy Creatures bless, and grant that we",
      "May feast in PARADISE with Thee.",
    ],
    author: "John Cennick",
    year: "1741",
    source: "John Cennick, Sacred Hymns for the Children of God, in the Days of their Pilgrimage (London, 1741), page 75, “Grace before Meat”",
    checkedAgainst: `https://archive.org/details/bim_eighteenth-century_sacred-hymns-for-the-chi_cennick-john_1741, Sacred Hymns for the Children of God (1741), page 75, read on the page image; ${CHECKED}`,
    glosses: [
      { word: "Ev'ry Where ador'd", meaning: "everywhere adored" },
      { word: "Thy Creatures", meaning: "the things you made: this food" },
      { word: "Paradise", meaning: "heaven, the feast to come (Revelation 19:9)" },
    ],
    note: "Later books often print “These creatures bless” or “These mercies bless”; this is Cennick's first printing.",
  },
  {
    id: "cennick-blood",
    title: "We thank thee, Lord, for this our food",
    lines: [
      "We thank thee Lord for this our Food,",
      "But more because of Jesu's Blood;",
      "Let Manna to our Souls be given,",
      "The Bread of Life sent down from Heaven.",
    ],
    author: "After John Cennick",
    year: "1741, as printed in 1774",
    source: "Shortened from John Cennick's “Grace after Meat” (1741), in this form in George Whitefield, A Collection of Hymns for Social Worship (London, 1774), page 170, “After Meat”",
    checkedAgainst: `https://archive.org/details/bim_eighteenth-century_a-collection-of-hymns-fo_whitefield-george_1774, A Collection of Hymns for Social Worship, 19th edition (1774), page 170, read on the page image; ${CHECKED}`,
    glosses: [
      { word: "Jesu's", meaning: "Jesus', an old form of the name" },
      { word: "Manna", meaning: "the bread God sent Israel in the desert; Jesus calls himself the true bread from heaven (John 6:32–35)" },
    ],
  },
  {
    id: "god-is-great",
    title: "God is great, and God is good",
    lines: ["God is great, and God is good,", "And we thank Him for this food:", "By His hand must all be fed,", "Give us, Lord, our daily bread."],
    author: "Traditional children's grace",
    year: "printed by 1882",
    source: "Gospel Hymns No. 4 (Toronto: Copp, Clark, 1882), number 84, “Grace before Meals”, set to music by P. P. Bliss",
    checkedAgainst: `https://archive.org/details/cihm_46977, Gospel Hymns No. 4 (1882), number 84, read in the scan's text; ${CHECKED}`,
    note: "A grace children have sung and said since the nineteenth century; its last line is from the Lord's Prayer. The form many families know, “Let us thank him for our food”, came later.",
  },
  {
    id: "leatham-world",
    title: "Thank you for the world so sweet",
    lines: [
      "Thank you for the world so sweet,",
      "Thank you for the food we eat,",
      "Thank you for the birds that sing,",
      "Thank you, God, for ev'rything.",
    ],
    author: "Edith Rutter Leatham",
    year: "printed by 1919",
    source: "Songs of Cheer for Children (1929), number 13, “A Child's ‘Thank You’”. The verse was in print by 1919 and is often dated 1899",
    checkedAgainst: `https://archive.org/details/songsofcheerforc00menn, Songs of Cheer for Children (1929), number 13, words read under the music in the scan's text; ${CHECKED}`,
    glosses: [{ word: "ev'rything", meaning: "everything" }],
    note: "Often printed without a name; it was written by Edith Rutter Leatham.",
  },
  {
    id: "selkirk",
    title: "The Selkirk Grace",
    lines: ["Some hae meat and canna eat,", "And some wad eat that want it;", "But we hae meat and we can eat,", "Sae let the Lord be thankit."],
    author: "Traditional Scottish grace, long linked with Robert Burns",
    year: "traditional",
    source: "A traditional Scottish grace, as printed in Robert Burns, The Cotter's Saturday Night and Other Poems (Boston: Houghton, Mifflin, 1895)",
    checkedAgainst: `https://archive.org/details/cotterssaturdayn02burn, The Cotter's Saturday Night and Other Poems (1895), “The Selkirk Grace”, read in the scan's text; ${CHECKED}`,
    glosses: [
      { word: "hae", meaning: "have" },
      { word: "canna", meaning: "cannot" },
      { word: "wad", meaning: "would" },
      { word: "sae", meaning: "so" },
      { word: "thankit", meaning: "thanked" },
    ],
    note: "A grace that remembers those who have no food.",
  },
  {
    id: "doxology",
    title: "The Doxology",
    lines: [
      "Praise God from whom all Blessings flow,",
      "Praise him all Creatures here below,",
      "Praise him above ye heavenly Host,",
      "Praise Father, Son, and Holy Ghost.",
    ],
    author: "Thomas Ken",
    year: "1712",
    source: "Thomas Ken, the closing verse of his hymns for the scholars of Winchester College, in the revised words of A Manual of Prayers (London, 1712), page 134",
    checkedAgainst: `https://archive.org/details/bim_eighteenth-century_a-manual-of-prayers-for-_ken-thomas_1712, A Manual of Prayers for the Use of the Scholars of Winchester College (1712), page 134, read on the page image; ${CHECKED}`,
    glosses: [
      { word: "ye heavenly Host", meaning: "you angels of heaven" },
      { word: "Ghost", meaning: "an old word for Spirit" },
    ],
    note: "Often sung before meals, to the tune Old Hundredth.",
  },
  {
    id: "ken-evening",
    title: "Glory to thee, my God, this night",
    lines: [
      "Glory to thee my God, this night,",
      "For all the Blessings of the Light;",
      "Keep me, O keep me King of Kings,",
      "Under thy own Almighty Wings.",
    ],
    author: "Thomas Ken",
    year: "1697",
    source: "Thomas Ken, An Evening Hymn, first verse, in A Manual of Prayers for the Use of the Scholars of Winchester College (London, 1697), page 145",
    checkedAgainst: `https://archive.org/details/manualofprayersf00kent_0, A Manual of Prayers (1697), page 145, read on the page image; ${CHECKED}`,
    glosses: [{ word: "Almighty Wings", meaning: "a picture from the psalms of God's shelter (Psalm 91:4)" }],
    note: "Many hymnbooks print Ken's later wording, “All praise to thee, my God, this night” and “Beneath thine own almighty wings”; these are his words as first printed.",
  },
  {
    id: "duncan-shepherd",
    title: "Jesus, tender Shepherd",
    lines: [
      "Jesus, tender shepherd, hear me!",
      "Bless thy little lambs to-night!",
      "Through the darkness be thou near me,",
      "Watch my sleep till morning light!",
      "",
      "All this day Thy hand has led me,—",
      "And I thank thee for thy care;",
      "Thou hast clothed me, warmed and fed me,",
      "Listen to my evening prayer!",
    ],
    author: "Mary Lundie Duncan",
    year: "1839",
    source: "Mary Lundie Duncan, written in 1839 for her children; printed in the Memoir of Mrs. W. W. Duncan (Edinburgh, 1841), page 274, “An Evening Prayer”. The first two verses",
    checkedAgainst: `https://archive.org/details/memoirmrswwdunc00duncgoog, Memoir of Mrs. W. W. Duncan (1841), page 274, read on the page image; ${CHECKED}`,
    glosses: [
      { word: "lambs", meaning: "she wrote it for all her children together" },
      { word: "to-night", meaning: "tonight" },
    ],
    note: "Written in 1839 by Mary Duncan, a Scottish mother, for her own children. Later books often print “Bless thy little lamb tonight”.",
    extraLines: {
      label: "The third verse",
      lines: ["Let my sins be all forgiven!", "Bless the friends I love so well!", "Take me, when I die, to heaven,", "Happy there with Thee to dwell!"],
    },
  },
  {
    id: "wesley-gentle",
    title: "Gentle Jesus, meek and mild",
    lines: ["Gentle Jesus, meek, and mild,", "Look upon a Little Child,", "Pity my Simplicity,", "Suffer me to come to Thee."],
    author: "Charles Wesley",
    year: "1742",
    source: "John and Charles Wesley, Hymns and Sacred Poems (London, 1742), page 194, “Hymns for Children”, first verse",
    checkedAgainst: `https://archive.org/details/bim_eighteenth-century_hymns-and-sacred-poems-_wesley-john_1742, Hymns and Sacred Poems (1742), page 194, read on the page image; ${CHECKED}`,
    glosses: [{ word: "Suffer", meaning: "let, allow. Jesus said, “Let the little children come to Me” (Mark 10:14)" }],
  },
  {
    id: "watts-evening",
    title: "An Evening Song",
    lines: [
      "I lay my Body down to sleep,",
      "Let Angels guard my Head:",
      "And through the Hours of Darkness keep",
      "Their Watch around my Bed.",
      "",
      "With chearful Heart I close my Eyes,",
      "Since Thou wilt not remove;",
      "And in the Morning let me rise",
      "Rejoycing in thy Love.",
    ],
    author: "Isaac Watts",
    year: "1715",
    source: "Isaac Watts, Divine Songs Attempted in Easy Language for the Use of Children (1715), Song 26, verses 3 and 4, as printed in the second edition (London, 1716), page 36",
    checkedAgainst: `https://archive.org/details/bim_eighteenth-century_divine-songs-attempted-i_watts-isaac-1674-1748_1716, Divine Songs, second edition (1716), page 36, read on the page image; ${CHECKED}`,
    glosses: [
      { word: "chearful", meaning: "cheerful" },
      { word: "remove", meaning: "go away" },
      { word: "Rejoycing", meaning: "rejoicing" },
    ],
    note: "This asks God for his angels' care: the Bible calls angels God's servants sent to help his people (Hebrews 1:14). The prayer is to God, not to the angels.",
  },
  {
    id: "now-i-lay-me",
    title: "Now I lay me down to sleep",
    lines: ["Now I lay me down to sleep,", "I pray the Lord my soul to keep;", "If I should die before I wake,", "I pray the Lord my soul to take."],
    author: "The New England Primer",
    year: "as it has been said for two centuries",
    source: "The New England Primer, in the form of its nineteenth-century printings. The 1785 Primer has “I pray thee, Lord, my soul to keep” and “I pray thee, Lord, my soul to take”",
    checkedAgainst: `https://archive.org/details/newenglandprimer00hump, The New England Primer (Worcester: S. A. Howland, printed in the 1830s or 1840s), “Prayer at Lying Down”, read in the scan's text; the earlier wording against https://archive.org/details/bim_eighteenth-century_the-new-england-primer-i_1785, The New-England Primer Improved (1785), page 25, on the page image; ${CHECKED}`,
    note: DEATH_NOTE,
  },
];

export const OLDER_TEXTS = Object.fromEntries(TEXTS.map((text) => [text.id, text])) as Record<OlderId, OlderText>;

/** "John Cennick, 1741"; a traditional text names its tradition and printing. */
export function olderCredit(text: OlderText): string {
  return /^\d{4}$/.test(text.year) ? `${text.author}, ${text.year}` : `${text.author} (${text.year})`;
}
