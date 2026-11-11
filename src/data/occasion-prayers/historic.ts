// The older prayers (design 4.4): eight collects from the 1662 Book of Common Prayer and one stanza of St Patrick's
// Breastplate in Cecil Frances Alexander's English verse. Each text is stored exactly as printed (only the printed book's
// capitals on the first words are set in ordinary case) and a test holds it to a checksum. The 1662 texts stay inside
// Cambridge University Press's permission of up to 500 words (design 2.4): a test fails if their total goes over.
import type { HistoricId, HistoricPrayer } from "./types";

const BCP_CHECK = "Checked word for word on 2026-11-09 against Lynda Howell's transcription of the 1662 Book of Common Prayer, https://www.eskimo.com/~lhowell/bcp1662/";

/** The acknowledgement Cambridge asks for on a page that shows a 1662 text (design 2.4). */
export const CROWN_ACKNOWLEDGEMENT =
  "Extracts from The Book of Common Prayer, the rights in which are vested in the Crown, are reproduced by permission of the Crown's patentee, Cambridge University Press.";

/** Cambridge's short form, at the end of every copied or sent 1662 text. */
export const BCP_SHORT = "BCP 1662";

/** Cambridge's permission for liturgical and non-commercial educational use. */
export const BCP_WORD_LIMIT = 500;

export const HISTORIC_PRAYERS: Record<HistoricId, HistoricPrayer> = {
  "bcp-grace": {
    id: "bcp-grace",
    title: "The beginning of this day",
    text: "O Lord, our heavenly Father, Almighty and everlasting God, who hast safely brought us to the beginning of this day; Defend us in the same with thy mighty power; and grant that this day we fall into no sin, neither run into any kind of danger; but that all our doings may be ordered by thy governance, to do always that is righteous in thy sight; through Jesus Christ our Lord. Amen.",
    source: "Book of Common Prayer, 1662: Morning Prayer, the Third Collect, for Grace",
    rights: "bcp-1662-crown",
    explanation: "The word “governance” means God's guiding rule.",
    checkedAgainst: BCP_CHECK,
  },
  "bcp-peace": {
    id: "bcp-peace",
    title: "Peace the world cannot give",
    text: "O God, from whom all holy desires, all good counsels, and all just works do proceed; Give unto thy servants that peace which the world cannot give; that both our hearts may be set to obey thy commandments, and also that by thee, we, being defended from the fear of our enemies, may pass our time in rest and quietness; through the merits of Jesus Christ our Saviour. Amen.",
    source: "Book of Common Prayer, 1662: Evening Prayer, the Second Collect, for Peace",
    rights: "bcp-1662-crown",
    explanation: "The word “counsels” means plans and advice.",
    checkedAgainst: BCP_CHECK,
  },
  "bcp-perils": {
    id: "bcp-perils",
    title: "Lighten our darkness",
    text: "Lighten our darkness, we beseech thee, O Lord; and by thy great mercy defend us from all perils and dangers of this night; for the love of thy only Son, our Saviour, Jesus Christ. Amen.",
    source: "Book of Common Prayer, 1662: Evening Prayer, the Third Collect, for Aid against all Perils",
    rights: "bcp-1662-crown",
    explanation: "For the night before.",
    checkedAgainst: BCP_CHECK,
  },
  "bcp-purity": {
    id: "bcp-purity",
    title: "Unto whom all hearts be open",
    text: "Almighty God, unto whom all hearts be open, all desires known, and from whom no secrets are hid; Cleanse the thoughts of our hearts by the inspiration of thy Holy Spirit, that we may perfectly love thee, and worthily magnify thy holy Name; through Christ our Lord. Amen.",
    source: "Book of Common Prayer, 1662: Holy Communion, the Collect for Purity",
    rights: "bcp-1662-crown",
    explanation: "To “magnify” God means to praise him.",
    checkedAgainst: BCP_CHECK,
  },
  "bcp-prevent": {
    id: "bcp-prevent",
    title: "Go before us",
    text: "Prevent us, O Lord, in all our doings with thy most gracious favour, and further us with thy continual help; that in all our works begun, continued, and ended in thee, we may glorify thy holy Name, and finally by thy mercy obtain everlasting life; through Jesus Christ our Lord. Amen.",
    source: "Book of Common Prayer, 1662: Holy Communion, the collect “Prevent us, O Lord”",
    rights: "bcp-1662-crown",
    explanation: "Here “prevent” has its old meaning, “go before”. The prayer asks God to go ahead of us in all we do.",
    checkedAgainst: BCP_CHECK,
  },
  "bcp-sick": {
    id: "bcp-sick",
    title: "Look down from heaven",
    text: "O Lord, look down from heaven, behold, visit, and relieve this thy servant. Look upon him with the eyes of thy mercy, give him comfort and sure confidence in thee, defend him from the danger of the enemy, and keep him in perpetual peace and safety; through Jesus Christ our Lord. Amen.",
    source: "Book of Common Prayer, 1662: The Order for the Visitation of the Sick",
    rights: "bcp-1662-crown",
    explanation: "The prayer book's words; for a woman, say “her”.",
    checkedAgainst: BCP_CHECK,
  },
  "bcp-advent-2": {
    id: "bcp-advent-2",
    title: "Read, mark, learn",
    text: "Blessed Lord, who hast caused all holy Scriptures to be written for our learning; Grant that we may in such wise hear them, read, mark, learn, and inwardly digest them, that by patience and comfort of thy holy Word, we may embrace, and ever hold fast, the blessed hope of everlasting life, which thou hast given us in our Saviour Jesus Christ. Amen.",
    source: "Book of Common Prayer, 1662: the Collect for the Second Sunday in Advent",
    rights: "bcp-1662-crown",
    explanation: "To “inwardly digest” means to take it in so that it becomes part of you.",
    checkedAgainst: BCP_CHECK,
  },
  "bcp-trinity-4": {
    id: "bcp-trinity-4",
    title: "Ruler and guide",
    text: "O God, the protector of all that trust in thee, without whom nothing is strong, nothing is holy; Increase and multiply upon us thy mercy; that, thou being our ruler and guide, we may so pass through things temporal, that we finally lose not the things eternal: Grant this, O heavenly Father, for Jesus Christ's sake our Lord. Amen.",
    source: "Book of Common Prayer, 1662: the Collect for the Fourth Sunday after Trinity",
    rights: "bcp-1662-crown",
    explanation: "The phrases “things temporal” and “things eternal” mean what passes and what lasts.",
    checkedAgainst: BCP_CHECK,
  },
  breastplate: {
    id: "breastplate",
    title: "Christ be with me",
    text: "Christ be with me, Christ within me,\nChrist behind me, Christ before me,\nChrist beside me, Christ to win me,\nChrist to comfort and restore me,\nChrist beneath me, Christ above me,\nChrist in quiet, Christ in danger,\nChrist in hearts of all that love me,\nChrist in mouth of friend and stranger.",
    source: "St Patrick's Breastplate, English verse by Cecil Frances Alexander (1889), one stanza from a longer hymn",
    rights: "public-domain",
    explanation: "Traditionally attributed to St Patrick of Ireland (5th century).",
    checkedAgainst: "Checked on 2026-11-09 against C. H. H. Wright, The Writings of Saint Patrick, “Version of Mrs. Alexander”, https://en.wikisource.org/wiki/The_Writings_of_Saint_Patrick,_the_Apostle_of_Ireland/Version_of_Mrs._Alexander",
  },
};

/** Words as design 4.4 counts them: split on spaces. */
export const wordCount = (text: string): number => text.split(/\s+/).filter(Boolean).length;

/** The line a copied or sent older prayer ends with (design 6.1). */
export function historicCredit(prayer: HistoricPrayer): string {
  const credit = prayer.rights === "bcp-1662-crown" ? BCP_CREDIT : BREASTPLATE_CREDIT;
  return `— ${credit}`;
}

/** Cambridge's short form ends the credit, as its permission asks. */
const BCP_CREDIT = "Book of Common Prayer (BCP 1662)";
const BREASTPLATE_CREDIT = "St Patrick's Breastplate, translated by Cecil Frances Alexander";
