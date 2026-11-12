// Timeline sort: the faint drawing in a card's corner (the audit's item 4: "a crown for a king, a scroll for a prophet,
// waves for a sea event"). The event data carries no kind, so the motif is read from the label's words; a label that
// matches nothing gets the plain card motif. It is decoration only and never hints at the order: the words are the
// player's own card. Pure, so it is tested on its own.

export type Motif = "crown" | "scroll" | "waves" | "flame" | "temple" | "star" | "cross" | "sword" | "wheat" | "dove" | "mountain" | "card";

/** Each motif's words, first match wins; longer or rarer words come first so "high priest" is not read as a king. */
const RULES: readonly [Motif, RegExp][] = [
  ["cross", /\b(crucif|cross|resurrect|risen|rises from the dead|empty tomb|ascen)/i],
  ["dove", /\b(dove|spirit|pentecost|baptiz|baptis)/i],
  ["star", /\b(jesus is born|born|wise men|magi|shepherds|bethlehem|star)/i],
  ["waves", /\b(flood|sea|river|jordan|ark|fish|storm|boat|ship|wave|water|rain)/i],
  ["flame", /\b(fire|flame|burning|bush|altar|lamp|elijah)/i],
  ["temple", /\b(temple|tabernacle|wall|jerusalem|tower|babel|city|gate)/i],
  ["mountain", /\b(sinai|mount|mountain|hill|ararat|carmel|commandments)/i],
  ["sword", /\b(battle|war|defeat|army|fall|falls|siege|conquer|fight|kill|slay|philistine|goliath|midian)/i],
  ["crown", /\b(king|queen|reign|crown|throne|anoint|pharaoh|caesar|herod)/i],
  ["scroll", /\b(prophe|law|letter|writes|written|scroll|book|vision|covenant|psalm|preach|teach|sermon|message|believes|gospel|parable)/i],
  ["wheat", /\b(harvest|famine|bread|feeds|wheat|grain|vine|field|manna)/i],
];

/** The motif for a card's label. */
export function motifOf(label: string): Motif {
  for (const [motif, words] of RULES) if (words.test(label)) return motif;
  return "card";
}
