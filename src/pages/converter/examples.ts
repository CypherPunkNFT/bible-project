// Measurements people look up ("how big was Noah's ark?"), each with its verse in the Berean and its sizes as
// amounts of the converter's own units, so the page works them out the same way as the converter (design section 2).
import type { Kind } from "./units";

export interface ExamplePart {
  label: string;
  kind: Kind;
  unit: string;
  amount: number;
}

export interface Example {
  id: string;
  title: string;
  /** First and last verse, BBCCCVVV, in one book. */
  from: number;
  to?: number;
  parts: readonly ExamplePart[];
  /** What to know before trusting the numbers. */
  note?: string;
}

const part = (label: string, kind: Kind, unit: string, amount: number): ExamplePart => ({ label, kind, unit, amount });

export const EXAMPLES: readonly Example[] = [
  { id: "noahs-ark", title: "How big was Noah's ark?", from: 1006015,
    parts: [part("Length", "length", "cubit", 300), part("Width", "length", "cubit", 50), part("Height", "length", "cubit", 30)] },
  { id: "goliath", title: "How tall was Goliath?", from: 9017004,
    parts: [part("Height", "length", "cubit", 6.5)],
    note: "Six cubits and a span in the Hebrew. The Berean's note gives the other reading too: four cubits and a span (about 6 feet 9 inches) in the Greek Old Testament, the Dead Sea Scrolls and Josephus." },
  { id: "goliaths-armour", title: "How heavy was Goliath's armour?", from: 9017005,
    parts: [part("His coat of mail", "weight", "shekel", 5000)] },
  { id: "ogs-bed", title: "King Og's iron bed", from: 5003011,
    parts: [part("Length", "length", "cubit", 9), part("Width", "length", "cubit", 4)] },
  { id: "solomons-temple", title: "How big was Solomon's temple?", from: 11006002,
    parts: [part("Length", "length", "cubit", 60), part("Width", "length", "cubit", 20), part("Height", "length", "cubit", 30)] },
  { id: "bronze-sea", title: "The bronze sea at the temple", from: 11007026,
    parts: [part("It held", "liquid", "bath", 2000)],
    note: "Estimates of the bath differ, so its size is uncertain." },
  { id: "solomons-gold", title: "Solomon's gold in one year", from: 11010014,
    parts: [part("Gold", "weight", "talent", 666)] },
  { id: "manna", title: "A day's manna for one person", from: 2016016,
    parts: [part("Each person's share", "dry", "omer", 1)] },
  { id: "quail", title: "The quail in the wilderness", from: 4011032,
    parts: [part("The least anyone gathered", "dry", "homer", 10)] },
  { id: "ruths-gleaning", title: "Ruth's day of gleaning", from: 8002017,
    parts: [part("Barley", "dry", "ephah", 1)] },
  { id: "sabbath-journey", title: "How far was a Sabbath day's journey?", from: 44001012,
    parts: [part("Distance", "length", "sabbath-journey", 1)] },
  { id: "emmaus", title: "The road to Emmaus", from: 42024013,
    parts: [part("Distance from Jerusalem", "length", "stadion", 60)] },
  { id: "new-jerusalem", title: "How big is the New Jerusalem?", from: 66021016,
    parts: [part("Length, width and height", "length", "stadion", 12_000)] },
  { id: "cana", title: "The water jars at Cana", from: 43002006,
    parts: [part("One jar, at least", "liquid", "metretes", 2), part("One jar, at most", "liquid", "metretes", 3), part("All six jars, at most", "liquid", "metretes", 18)] },
  { id: "widows-coins", title: "The widow's two small coins", from: 41012042,
    parts: [part("Her gift", "money", "lepton", 2)] },
  { id: "good-samaritan", title: "What the Good Samaritan paid the innkeeper", from: 42010035,
    parts: [part("Paid on the spot", "money", "denarius", 2)] },
  { id: "feeding-5000", title: "Bread for the five thousand", from: 43006007,
    parts: [part("Not enough, said Philip", "money", "denarius", 200)] },
  { id: "marys-perfume", title: "Mary's perfume", from: 43012003, to: 43012005,
    parts: [part("The perfume", "weight", "litra", 1), part("What it could have sold for", "money", "denarius", 300)] },
  { id: "unforgiving-servant", title: "The unforgiving servant's debt", from: 40018024, to: 40018028,
    parts: [part("He owed the king", "money", "talent-coin", 10_000), part("His fellow servant owed him", "money", "denarius", 100)] },
  { id: "talents", title: "The parable of the talents", from: 40025015,
    parts: [part("Five talents", "money", "talent-coin", 5), part("Two talents", "money", "talent-coin", 2), part("One talent", "money", "talent-coin", 1)] },
  { id: "thirty-pieces", title: "Thirty pieces of silver", from: 40026015,
    parts: [part("Judas's price", "money", "piece-of-silver", 30)],
    note: "Matthew does not name the coin; counting each piece as a shekel is an estimate." },
];

export const exampleById = (id: string): Example | undefined => EXAMPLES.find((example) => example.id === id);
