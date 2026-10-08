// Shared look-ups for the merged apostle page: the people a record can name beside an apostle (by the site's person
// ids in data/study/people/), the apostles in the order of Matthew 10 (then Matthias and Paul), the icons for kinds of
// moment, and the place icons. Nothing here adds a fact.

// Everyone who can be "named beside him". A companion is only counted where a verse that names the companion (from
// that person's own file) lies inside the record's passages, so a long pool adds no claim of its own.
const PEOPLE = {
  peter: ["peter-mat-4-18", "Peter"], andrew: ["andrew-mat-4-18", "Andrew"], jamesz: ["james-mat-4-21", "James son of Zebedee"],
  johnz: ["john-mat-4-21", "John son of Zebedee"], philip: ["philip-mat-10-3", "Philip"], bartholomew: ["bartholomew-mat-10-3", "Bartholomew"],
  thomas: ["thomas-mat-10-3", "Thomas"], matthew: ["matthew-mat-9-9", "Matthew"], jamesa: ["james-mat-10-3", "James son of Alphaeus"],
  thaddaeus: ["judas-mat-10-3", "Thaddaeus"], simonz: ["simon-mat-10-4", "Simon the Zealot"], iscariot: ["judas-mat-10-4", "Judas Iscariot"],
  matthias: ["matthias-act-1-23", "Matthias"], paul: ["paul-act-7-58", "Paul"],
  nathanael: ["nathanael-jhn-1-45", "Nathanael"], baptist: ["john-mat-3-1", "John the Baptist"], zebedee: ["zebedee-mat-4-21", "Zebedee"],
  zmother: ["salome-mat-20-20", "The mother of Zebedee’s children"], mary: ["mary-mat-1-16", "Mary, the mother of Jesus"],
  magdalene: ["mary-magdalene-mat-27-56", "Mary Magdalene"], lazarus: ["lazarus-jhn-11-1", "Lazarus"], martha: ["martha-luk-10-38", "Martha"],
  marybethany: ["mary-luk-10-39", "Mary of Bethany"], simonfather: ["simon-jhn-6-71", "Simon, father of Judas"], caiaphas: ["caiaphas-mat-26-3", "Caiaphas"],
  malchus: ["malchus-jhn-18-10", "Malchus"], herod: ["herod-act-12-1", "Herod (Agrippa I)"], barsabas: ["joseph-act-1-23", "Joseph called Barsabas"],
  alphaeus: ["alphaeus-mat-10-3", "Alphaeus"], barnabas: ["barnabas-act-4-36", "Barnabas"], silas: ["silas-act-15-22", "Silas (Silvanus)"],
  timothy: ["timothy-act-16-1", "Timothy"], luke: ["luke-2co-13-13", "Luke"], mark: ["mark-act-12-12", "John Mark"], titus: ["titus-2co-2-13", "Titus"],
  aquila: ["aquila-act-18-2", "Aquila"], priscilla: ["priscilla-act-18-2", "Priscilla"], aristarchus: ["aristarchus-act-19-29", "Aristarchus"],
  tychicus: ["tychicus-act-20-4", "Tychicus"], trophimus: ["trophimus-act-20-4", "Trophimus"], epaphroditus: ["epaphroditus-php-2-25", "Epaphroditus"],
  onesimus: ["onesimus-col-4-9", "Onesimus"], demas: ["demas-col-4-14", "Demas"], ananias: ["ananias-act-9-10", "Ananias of Damascus"],
  gamaliel: ["gamaliel-act-5-34", "Gamaliel"], stephen: ["stephen-act-6-5", "Stephen"], jameslord: ["james-mat-13-55", "James, the Lord’s brother"],
  apollos: ["apollos-act-18-24", "Apollos"], cornelius: ["cornelius-act-10-1", "Cornelius"], lydia: ["lydia-act-16-14", "Lydia"],
  agabus: ["agabus-act-11-28", "Agabus"], philipev: ["philip-act-6-5", "Philip the evangelist"],
};
// The Twelve in the order of Matthew 10:2–4, then Matthias (Acts 1:26) and Paul.
const ORDER = ["peter", "andrew", "jamesz", "johnz", "philip", "bartholomew", "thomas", "matthew", "jamesa", "thaddaeus", "simonz", "iscariot", "matthias", "paul"];
const TWELVE = ORDER.slice(0, 12);
const GOSPEL_POOL = ["nathanael", "baptist", "zebedee", "zmother", "mary", "magdalene", "lazarus", "martha", "marybethany", "simonfather", "caiaphas", "malchus", "alphaeus"];
const ACTS_POOL = ["herod", "barsabas", "cornelius", "silas", "mark", "jameslord", "barnabas", "stephen", "philipev"];
const PAUL_POOL = ["barnabas", "silas", "timothy", "luke", "mark", "titus", "aquila", "priscilla", "aristarchus", "tychicus", "trophimus", "epaphroditus", "onesimus",
  "demas", "ananias", "gamaliel", "stephen", "peter", "johnz", "jameslord", "apollos", "lydia", "agabus", "philipev"];

// Icons for kinds of moment (kept from the dropped "kinds" filter, for the chapters and cards). First match wins.
const ICON_RULES = [
  [/tradition/i, "tradition"], [/lot|numbered with/i, "list"], [/called|follow|calling|tax office|nets|first meeting|brings his brother|finds Nathanael/i, "net"],
  [/chosen as one|sent out|named .* list|lists|upper room|never named again/i, "list"], [/deni|rebuk|asleep|sink|object|fire on|forbad|absent|not all|devil|silver|kiss|betray|lost/i, "wave"],
  [/risen|tomb|appears|my god|it is the lord|outruns/i, "sunrise"], [/sword|prison|arrest|chains|council|killed/i, "chain"], [/samaria|lydda|joppa|caesarea|journey|patmos/i, "route"],
  [/pillars|letter|cephas|babylon|another james/i, "scroll"], [/“|question|asks|says|shew us/i, "quote"],
];
const iconFor = (title = "") => ICON_RULES.find(([re]) => re.test(title))?.[1] ?? "eye";

// Place icons, by the site's place id (anything not listed is a city).
const PLACE_KIND = {
  a562fcc: "lake", a91b732: "town", af2161c: "town", ab7bf48: "town", a2c5cc7: "town", ae023a9: "port", a58735e: "port", a282dce: "region", a83a43e: "region",
  a0f4ea8: "region", afa863b: "port", a314765: "port", aff04b8: "town", a91c509: "port", a55027d: "port", a57835d: "island", ac405c0: "region", a26aa94: "island",
  a3f0f69: "region", ab9696f: "region", ae425aa: "town", af0719d: "town", aa401a9: "town", a62fe31: "town", a8f60f3: "island", a031bda: "town", a4f35bc: "town",
  a878481: "region", a43f60f: "region", ab45bd3: "region", af301ca: "region", aef4242: "region", af66926: "town", a42418f: "town", a040ba5: "town",
};

module.exports = { PEOPLE, ORDER, TWELVE, GOSPEL_POOL, ACTS_POOL, PAUL_POOL, iconFor, PLACE_KIND };
