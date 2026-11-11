// Every unit the converter knows (docs/features/biblical-converter/design.md, section 1 and its review). A biblical
// unit's modern size is the Berean Standard Bible's own footnote, kept here word for word with its verse, so the size
// can always be checked against the Bible text the site quotes (units.test.ts does). Sizes are in each kind's base:
// metres, grams, a labourer's day's wage, litres.
import { plural } from "@/lib/site-format";

export type Kind = "length" | "weight" | "money" | "dry" | "liquid";

/** How sure the size is: a ratio Scripture itself gives, a size the Berean's note gives, or a scholarly estimate. */
export type Confidence = "scripture" | "berean" | "estimate";

export const KINDS: readonly { key: Kind; title: string; text: string }[] = [
  { key: "length", title: "Length and distance", text: "Fingers, spans and cubits up to stadia, Roman miles and a Sabbath day's journey." },
  { key: "weight", title: "Weight", text: "Gerahs, bekas and shekels up to minas and talents." },
  { key: "money", title: "Money", text: "Coins and silver as days of work, and in today's dollars at a day's wage you choose." },
  { key: "dry", title: "Dry measures", text: "Grain and flour: the kab, omer, seah, ephah, homer and cor." },
  { key: "liquid", title: "Liquid measures", text: "Oil and wine: the log, hin, bath and the jars at Cana." },
];

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  scripture: "Ratio given in Scripture",
  berean: "Size from the Berean's note",
  estimate: "Scholarly estimate",
};

/** One footnote of the Berean, word for word: `amount` of the unit is `size` in the kind's base, as the note says. */
export interface BereanNote {
  /** Verse id, BBCCCVVV. */
  verse: number;
  text: string;
  amount: number;
  /** The note's own figure in the kind's base (metres, grams, litres); absent for money, which the notes give in wages. */
  size?: number;
}

export interface BibleUnit {
  id: string;
  kind: Kind;
  name: string;
  /** The amount with the unit's name, in the site's language: plural(n, "{n} cubit", "{n} cubits"). Each unit writes
   * its own call with both forms, so the translation collector reads them as a plural pair. */
  count: (n: number) => string;
  /** Size in the kind's base unit. */
  size: number;
  /** How it relates to other units, in a line. */
  equals: string;
  /** Older English names readers meet in the King James and elsewhere. */
  alsoCalled?: string;
  confidence: Confidence;
  /** Why the size is uncertain, or what else to know. */
  caution?: string;
  /** The verse where the reader meets it. */
  verse: number;
  berean?: BereanNote;
}

export const BIBLE_UNITS: readonly BibleUnit[] = [
  // Length, in metres.
  { id: "finger", kind: "length", name: "Finger", count: (n) => plural(n, "{n} finger", "{n} fingers"), size: 0.0185, equals: "A quarter of a handbreadth", confidence: "berean", verse: 24052021,
    berean: { verse: 24052021, text: "4 fingers is approximately 2.9 inches or 7.4 centimeters.", amount: 4, size: 0.074 } },
  { id: "handbreadth", kind: "length", name: "Handbreadth", count: (n) => plural(n, "{n} handbreadth", "{n} handbreadths"), size: 0.074, equals: "Four fingers; a sixth of a cubit", confidence: "berean", verse: 2025025,
    berean: { verse: 2025025, text: "A handbreadth is approximately 2.9 inches or 7.4 centimeters.", amount: 1, size: 0.074 } },
  { id: "span", kind: "length", name: "Span", count: (n) => plural(n, "{n} span", "{n} spans"), size: 0.2286, equals: "Half a cubit: an open hand, thumb to little finger", confidence: "berean", verse: 2028016,
    berean: { verse: 2028016, text: "The breastpiece, when folded over, was approximately 9 inches or 22.9 centimeters in both length and width.", amount: 1, size: 0.229 } },
  { id: "cubit", kind: "length", name: "Cubit", count: (n) => plural(n, "{n} cubit", "{n} cubits"), size: 0.4572, equals: "Elbow to fingertip: two spans, six handbreadths", confidence: "berean", verse: 7003016,
    caution: "A forearm's length, so a cubit was never exact. The Berean takes the common cubit as about 18 inches; Ezekiel's temple vision uses a longer one.",
    berean: { verse: 7003016, text: "A cubit is approximately 18 inches or 45.7 centimeters.", amount: 1, size: 0.457 } },
  { id: "long-cubit", kind: "length", name: "Long cubit", count: (n) => plural(n, "{n} long cubit", "{n} long cubits"), size: 0.5334, equals: "A cubit and a handbreadth (Ezekiel 40:5)", confidence: "scripture", verse: 26040005,
    berean: { verse: 26040005, text: "6 long cubits, the length of the reed used for measuring, is approximately 10.5 feet or 3.2 meters; similarly in verses 6, 7, and 12. The long cubit of about 21 inches or 53.3 centimeters is the basic unit of length throughout Ezekiel 40 to 48.", amount: 1, size: 0.533 } },
  { id: "fathom", kind: "length", name: "Fathom", count: (n) => plural(n, "{n} fathom", "{n} fathoms"), size: 1.83, equals: "Outstretched arms, fingertip to fingertip", confidence: "berean", verse: 44027028,
    berean: { verse: 44027028, text: "20 fathoms is approximately 120 feet or 36.6 meters.", amount: 20, size: 36.6 } },
  { id: "reed", kind: "length", name: "Measuring reed", count: (n) => plural(n, "{n} measuring reed", "{n} measuring reeds"), size: 3.2, equals: "Six long cubits (Ezekiel 40:5)", alsoCalled: "Rod", confidence: "scripture", verse: 26040005,
    berean: { verse: 26040005, text: "6 long cubits, the length of the reed used for measuring, is approximately 10.5 feet or 3.2 meters; similarly in verses 6, 7, and 12. The long cubit of about 21 inches or 53.3 centimeters is the basic unit of length throughout Ezekiel 40 to 48.", amount: 1, size: 3.2 } },
  { id: "stadion", kind: "length", name: "Stadion", count: (n) => plural(n, "{n} stadion", "{n} stadia"), size: 185, equals: "A Greek racecourse's length, about 600 feet", alsoCalled: "Furlong", confidence: "berean", verse: 42024013,
    berean: { verse: 42024013, text: "Greek being sixty stadia in distance; that is, approximately 6.9 miles or 11.1 kilometers", amount: 60, size: 11_100 } },
  { id: "roman-mile", kind: "length", name: "Roman mile", count: (n) => plural(n, "{n} Roman mile", "{n} Roman miles"), size: 1480, equals: "A thousand Roman paces, about eight stadia", confidence: "berean", verse: 40005041,
    berean: { verse: 40005041, text: "Greek one milion; that is, a Roman mile, approximately 4,855 feet or 1,480 meters", amount: 1, size: 1480 } },
  { id: "sabbath-journey", kind: "length", name: "Sabbath day's journey", count: (n) => plural(n, "{n} Sabbath day's journey", "{n} Sabbath days' journeys"), size: 914.4, equals: "2,000 cubits", confidence: "estimate", verse: 44001012,
    caution: "No verse sets its length. The 2,000 cubits come from Jewish teaching built on the 2,000 cubits of Numbers 35:5 and Joshua 3:4.",
    berean: { verse: 44001012, text: "A Sabbath day’s journey is 2,000 cubits (approximately 3,000 feet or 914.4 meters)", amount: 1, size: 914.4 } },

  // Weight, in grams.
  { id: "gerah", kind: "weight", name: "Gerah", count: (n) => plural(n, "{n} gerah", "{n} gerahs"), size: 0.57, equals: "A twentieth of a shekel (Exodus 30:13)", confidence: "scripture", verse: 2030013,
    berean: { verse: 2030013, text: "20 gerahs is equivalent to one shekel (approximately 0.4 ounces or 11.4 grams).", amount: 20, size: 11.4 } },
  { id: "beka", kind: "weight", name: "Beka", count: (n) => plural(n, "{n} beka", "{n} bekas"), size: 5.7, equals: "Half a shekel (Exodus 38:26)", confidence: "scripture", verse: 2038026,
    berean: { verse: 2038026, text: "A beka is half a shekel, or approximately 0.2 ounces or 5.7 grams.", amount: 1, size: 5.7 } },
  { id: "pim", kind: "weight", name: "Pim", count: (n) => plural(n, "{n} pim", "{n} pims"), size: 7, equals: "Possibly two-thirds of a shekel", confidence: "estimate", verse: 9013021,
    caution: "Named once in the Bible and known from small stone weights found in digs, so its size is an estimate.",
    berean: { verse: 9013021, text: "A pim possibly refers to a polished stone weighing approximately 0.25 ounces or 7 grams found in excavations. This is equivalent to about two-thirds of a shekel and likely refers to the price charged by the Philistines for the services listed.", amount: 1, size: 7 } },
  { id: "shekel", kind: "weight", name: "Shekel", count: (n) => plural(n, "{n} shekel", "{n} shekels"), size: 11.4, equals: "Twenty gerahs; two bekas", confidence: "berean", verse: 2030013,
    berean: { verse: 2030013, text: "20 gerahs is equivalent to one shekel (approximately 0.4 ounces or 11.4 grams).", amount: 1, size: 11.4 } },
  { id: "litra", kind: "weight", name: "Litra (Roman pound)", count: (n) => plural(n, "{n} litra", "{n} litras"), size: 340, equals: "A Roman pound, about three-quarters of a pound today", alsoCalled: "Pound", confidence: "berean", verse: 43012003,
    berean: { verse: 43012003, text: "Greek a litra; that is, approximately 12 ounces or 340 grams", amount: 1, size: 340 } },
  { id: "mina", kind: "weight", name: "Mina", count: (n) => plural(n, "{n} mina", "{n} minas"), size: 570, equals: "Fifty shekels", alsoCalled: "Maneh", confidence: "berean", verse: 26045012,
    caution: "Ezekiel 45:12 sets the mina at sixty shekels (about 684 grams); elsewhere it was fifty.",
    berean: { verse: 26045012, text: "That is, 60 shekels total; elsewhere, the common mina was 50 shekels. Sixty shekels weighed approximately 1.5 pounds or 683.8 grams.", amount: 1.2, size: 683.8 } },
  { id: "talent", kind: "weight", name: "Talent", count: (n) => plural(n, "{n} talent", "{n} talents"), size: 34_200, equals: "3,000 shekels (Exodus 38:25–26); sixty minas", confidence: "berean", verse: 10012030,
    berean: { verse: 10012030, text: "A talent is approximately 75.4 pounds or 34.2 kilograms of gold.", amount: 1, size: 34_200 } },

  // Money, in days' wages: a denarius was "customarily a day's wage for a laborer" (the Berean on Matthew 20:2).
  { id: "lepton", kind: "money", name: "Lepton", count: (n) => plural(n, "{n} lepton", "{n} lepta"), size: 1 / 128, equals: "Half a kodrantes; the smallest coin", alsoCalled: "Mite", confidence: "berean", verse: 41012042,
    berean: { verse: 41012042, text: "Greek put in two lepta, which is a kodrantēs; a lepton was a Jewish coin of bronze or copper worth about 1/128 of a denarius.", amount: 128 } },
  { id: "kodrantes", kind: "money", name: "Kodrantes (quadrans)", count: (n) => plural(n, "{n} kodrantes", "{n} kodrantes"), size: 1 / 64, equals: "Two lepta (Mark 12:42)", alsoCalled: "Farthing, penny", confidence: "scripture", verse: 40005026,
    berean: { verse: 40005026, text: "Greek kodrantēn; that is, a Roman copper coin worth about 1/64 of a denarius", amount: 64 } },
  { id: "assarion", kind: "money", name: "Assarion", count: (n) => plural(n, "{n} assarion", "{n} assaria"), size: 1 / 16, equals: "A sixteenth of a denarius", alsoCalled: "Farthing, penny", confidence: "berean", verse: 40010029,
    berean: { verse: 40010029, text: "Greek an assarion; that is, a Roman copper coin worth about 1/16 of a denarius", amount: 16 } },
  { id: "denarius", kind: "money", name: "Denarius", count: (n) => plural(n, "{n} denarius", "{n} denarii"), size: 1, equals: "A labourer's pay for a day", alsoCalled: "Penny", confidence: "berean", verse: 40020002,
    berean: { verse: 40020002, text: "A denarius was customarily a day’s wage for a laborer; similarly in verses 9, 10, and 13.", amount: 1 } },
  { id: "drachma", kind: "money", name: "Drachma", count: (n) => plural(n, "{n} drachma", "{n} drachmas"), size: 1, equals: "The Greek coin worth a denarius", alsoCalled: "Piece of silver", confidence: "berean", verse: 42015008,
    berean: { verse: 42015008, text: "Greek ten drachmas, each worth about a day’s wages", amount: 1 } },
  { id: "didrachma", kind: "money", name: "Two-drachma coin", count: (n) => plural(n, "{n} two-drachma coin", "{n} two-drachma coins"), size: 2, equals: "The temple tax: half a shekel (Exodus 30:13)", alsoCalled: "Didrachma", confidence: "scripture", verse: 40017024 },
  { id: "stater", kind: "money", name: "Four-drachma coin (stater)", count: (n) => plural(n, "{n} four-drachma coin", "{n} four-drachma coins"), size: 4, equals: "Two people's temple tax (Matthew 17:27); about a shekel", alsoCalled: "Stater, piece of money", confidence: "scripture", verse: 40017027,
    berean: { verse: 40017027, text: "Greek a stater; that is, a silver coin worth approximately one shekel", amount: 1 } },
  { id: "mina-coin", kind: "money", name: "Mina", count: (n) => plural(n, "{n} mina", "{n} minas"), size: 100, equals: "A hundred drachmas", alsoCalled: "Pound", confidence: "berean", verse: 42019013,
    berean: { verse: 42019013, text: "That is, he gave each servant one mina. A mina was most likely a silver coin worth a hundred drachmas, that is, about a hundred days’ wages.", amount: 1 } },
  { id: "talent-coin", kind: "money", name: "Talent", count: (n) => plural(n, "{n} talent", "{n} talents"), size: 6000, equals: "6,000 drachmas: sixty minas of a hundred", confidence: "estimate", verse: 40018024,
    caution: "The Berean says \"about twenty years' wages\". The tool counts 6,000 days, twenty years of about 300 working days.",
    berean: { verse: 40018024, text: "A talent was worth about twenty years’ wages for a laborer.", amount: 1 } },
  { id: "silver-shekel", kind: "money", name: "Shekel of silver", count: (n) => plural(n, "{n} shekel of silver", "{n} shekels of silver"), size: 4, equals: "About a four-drachma coin (Matthew 17:27)", confidence: "estimate", verse: 1023016,
    caution: "Before coins, silver was weighed out. This uses the shekel's New Testament worth, four drachmas; earlier, silver bought more: a priest in Judges 17:10 was paid ten shekels a year, with clothes and food." },
  { id: "piece-of-silver", kind: "money", name: "Piece of silver", count: (n) => plural(n, "{n} piece of silver", "{n} pieces of silver"), size: 4, equals: "Counted here as a shekel", confidence: "estimate", verse: 40026015,
    caution: "Matthew does not name the coin. The tool counts each piece as a shekel, the sum Exodus 21:32 sets for a servant's life (Zechariah 11:12)." },
  { id: "silver-talent", kind: "money", name: "Talent of silver", count: (n) => plural(n, "{n} talent of silver", "{n} talents of silver"), size: 12_000, equals: "3,000 shekels of silver by weight", confidence: "estimate", verse: 2038025,
    caution: "A weight of silver, not a coin: 3,000 shekels at four days' wages each. See the shekel of silver." },

  // Dry measures, in litres.
  { id: "choenix", kind: "dry", name: "Choenix", count: (n) => plural(n, "{n} choenix", "{n} choenixes"), size: 0.91, equals: "A day's ration of grain", alsoCalled: "Quart, measure", confidence: "berean", verse: 66006006,
    berean: { verse: 66006006, text: "Greek A choenix of wheat for a denarius. A choenix was a Greek dry measure equivalent to 1.92 pints or 0.91 liters. A denarius was customarily a day’s wage for a laborer; see Matthew 20:2.", amount: 1, size: 0.91 } },
  { id: "kab", kind: "dry", name: "Kab", count: (n) => plural(n, "{n} kab", "{n} kabs"), size: 1.24, equals: "A small measure, about a quart", alsoCalled: "Cab", confidence: "berean", verse: 12006025,
    berean: { verse: 12006025, text: "Or a quarter cab of seed pods; that is, approximately 0.28 dry quarts or 0.31 liters", amount: 0.25, size: 0.31 } },
  { id: "omer", kind: "dry", name: "Omer", count: (n) => plural(n, "{n} omer", "{n} omers"), size: 2.2, equals: "A tenth of an ephah (Exodus 16:36)", confidence: "scripture", verse: 2016016,
    berean: { verse: 2016016, text: "An omer is approximately 2 dry quarts or 2.2 liters; also in verses 18, 32, 33, and 36.", amount: 1, size: 2.2 } },
  { id: "seah", kind: "dry", name: "Seah", count: (n) => plural(n, "{n} seah", "{n} seahs"), size: 7.3, equals: "A third of an ephah", alsoCalled: "Measure", confidence: "berean", verse: 12007001,
    berean: { verse: 12007001, text: "A seah is approximately 6.6 dry quarts or 7.3 liters (probably about 8.2 pounds or 3.7 kilograms of flour); here and in verses 16 and 18.", amount: 1, size: 7.3 } },
  { id: "ephah", kind: "dry", name: "Ephah", count: (n) => plural(n, "{n} ephah", "{n} ephahs"), size: 22, equals: "Ten omers; the same as a bath (Ezekiel 45:11)", confidence: "berean", verse: 2016036,
    berean: { verse: 2016036, text: "An ephah was a dry measure having the capacity of about 20 dry quarts or 22 liters.", amount: 1, size: 22 } },
  { id: "lethech", kind: "dry", name: "Lethech", count: (n) => plural(n, "{n} lethech", "{n} lethechs"), size: 110, equals: "Half a homer", confidence: "estimate", verse: 28003002,
    caution: "Named only in Hosea 3:2. Half a homer is the Berean's alternative reading there (\"a homer and a half\").",
    berean: { verse: 28003002, text: "Or a homer and a half of barley; that is, a total of approximately 9.36 bushels or 330 liters (probably about 436 pounds or 198 kilograms of barley); LXX a homer of barley and a wineskin full of wine", amount: 3, size: 330 } },
  { id: "homer", kind: "dry", name: "Homer", count: (n) => plural(n, "{n} homer", "{n} homers"), size: 220, equals: "Ten ephahs (Ezekiel 45:11)", confidence: "scripture", verse: 26045011,
    berean: { verse: 26045011, text: "A homer was a dry measure of approximately 6.24 bushels or 220 liters; also in verses 13 and 14.", amount: 1, size: 220 } },
  { id: "cor", kind: "dry", name: "Cor", count: (n) => plural(n, "{n} cor", "{n} cors"), size: 220, equals: "Ten baths, the same as a homer (Ezekiel 45:14)", alsoCalled: "Kor, measure", confidence: "estimate", verse: 11004022,
    caution: "The Berean's notes disagree: about 220 litres in the Old Testament (1 Kings 4:22), but about 350 litres in Luke 16:7.",
    berean: { verse: 11004022, text: "30 cors is approximately 187 bushels or 6,600 liters (probably about 5.5 tons or 5 metric tons of flour).", amount: 30, size: 6600 } },

  // Liquid measures, in litres.
  { id: "log", kind: "liquid", name: "Log", count: (n) => plural(n, "{n} log", "{n} logs"), size: 0.31, equals: "A small measure of oil, about a cup and a quarter", confidence: "berean", verse: 3014010,
    berean: { verse: 3014010, text: "Or one log of oil; that is, approximately 0.33 quarts or 0.31 liters; also in verses 12, 15, 21, and 24", amount: 1, size: 0.31 } },
  { id: "hin", kind: "liquid", name: "Hin", count: (n) => plural(n, "{n} hin", "{n} hins"), size: 3.68, equals: "About a gallon", confidence: "berean", verse: 2029040,
    berean: { verse: 2029040, text: "Hebrew a quarter hin of pressed oil; that is, approximately 0.97 quarts or 0.92 liters", amount: 0.25, size: 0.92 } },
  { id: "bath", kind: "liquid", name: "Bath", count: (n) => plural(n, "{n} bath", "{n} baths"), size: 22, equals: "The same as an ephah (Ezekiel 45:11); a tenth of a homer", confidence: "estimate", verse: 11007026,
    caution: "The Berean's notes disagree: about 22 litres in the Old Testament, but about 33 litres in Luke 16:6. Estimates of the bath really do differ.",
    berean: { verse: 11007026, text: "2,000 baths is approximately 11,600 gallons or 44,000 liters; LXX does not include this sentence.", amount: 2000, size: 44_000 } },
  { id: "metretes", kind: "liquid", name: "Metretes", count: (n) => plural(n, "{n} metretes", "{n} metretae"), size: 39.4, equals: "A Greek jar measure, about ten gallons", alsoCalled: "Firkin, measure", confidence: "berean", verse: 43002006,
    berean: { verse: 43002006, text: "Greek two or three metretae; that is, approximately 20.8 to 31.2 gallons (78.8 to 118.1 liters)", amount: 2, size: 78.8 } },
];

/** Measures the Bible uses that have no fixed size: named so a reader looking for them finds them, with no number made up. */
export const NO_FIXED_SIZE: readonly { name: string; text: string; verse: number }[] = [
  { name: "A day's journey", text: "As far as people walked in a day; it depended on the road and the company.", verse: 42002044 },
  { name: "A stone's throw", text: "A short way off: Jesus withdrew this far to pray in Gethsemane.", verse: 42022041 },
  { name: "A bowshot", text: "Hagar sat this far from her son, too far to watch him.", verse: 1021016 },
  { name: "A yoke of land", text: "The land a pair of oxen could plough in a day (the Berean's note on 1 Samuel 14:14).", verse: 9014014 },
];

const byKind = new Map<Kind, Map<string, BibleUnit>>();
for (const unit of BIBLE_UNITS) {
  if (!byKind.has(unit.kind)) byKind.set(unit.kind, new Map());
  byKind.get(unit.kind)!.set(unit.id, unit);
}

export const unitsOf = (kind: Kind): BibleUnit[] => [...(byKind.get(kind)?.values() ?? [])];

/** A kind's unit by id, looked up only among that kind's own units; undefined for anything else. */
export const findUnit = (kind: Kind, id: string): BibleUnit | undefined => byKind.get(kind)?.get(id);

export const isKind = (value: string): value is Kind => KINDS.some((kind) => kind.key === value);

/** The amount in another unit of the same kind (sizes are in the same base). */
export const convert = (amount: number, from: { size: number }, to: { size: number }): number => amount * from.size / to.size;
