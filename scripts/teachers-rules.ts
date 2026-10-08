// The fixed tables scripts/build-teachers.ts classifies with. Edit here, then rerun the build.

/** Tradition labels, as the reading library shows them (src/pages/ReformedLibraryPage.tsx). */
export const TRADITION_LABELS: Record<string, string> = {
  reformed: "Reformed", "continental-reformed": "Continental Reformed", presbyterian: "Presbyterian", congregational: "Congregational",
  puritan: "Puritan", baptist: "Baptist", anglican: "Anglican", "calvinist-evangelical": "Calvinist evangelical",
};

/** Catalogue genres (content/library/vocabulary.json) as a reader would name them. */
export const GENRE_LABELS: Record<string, string> = {
  sermon: "Sermons", commentary: "Commentary", treatise: "Treatises and chapters", "systematic-theology": "Systematic theology", lecture: "Lectures",
  article: "Articles", debate: "Debates", confession: "Confessions", catechism: "Catechisms", devotional: "Devotional", prayer: "Prayers", hymn: "Hymns",
  biography: "Biography", autobiography: "Autobiography", letter: "Letters", journal: "Journals", history: "History", dictionary: "Dictionary",
  bibliography: "Bibliography", "study-guide": "Study guides", "collected-works": "Collected works and volumes",
};

/** Genres that make someone a writer, for the Authors list (sermons count for Preachers instead). */
export const WRITTEN_GENRES = ["treatise", "devotional", "letter", "biography", "autobiography", "history", "article", "collected-works", "journal", "hymn", "prayer", "catechism", "lecture", "commentary"];

/** The catalogue's era ids as centuries. */
export const ERA_CENTURY: Record<string, string> = {
  reformation: "1500s", "post-reformation": "1600s", "eighteenth-century": "1700s", "nineteenth-century": "1800s", "twentieth-century": "1900s", "twenty-first-century": "2000s",
};

/** Citation author fields whose people cannot be read by the general rule. */
export const CITED_OVERRIDES: Record<string, string[]> = {
  "Henry R. Percival (ed.), Nicene and Post-Nicene Fathers, series 2, vol. 14": ["Henry R. Percival"],
  "A. Cleveland Coxe (ed.), Ante-Nicene Fathers, vol. 1": ["A. Cleveland Coxe"],
  "Alexander Walker (trans.), Ante-Nicene Fathers, vol. 8": ["Alexander Walker"],
};

const ANCIENT = "An ancient, patristic or medieval writer cited as a primary source, not a modern commentator or scholar.";
const REFERENCE = "A reference work, institution, council or unnamed author, not a person.";

/** Names the study pages cite that are not listed as Scholars, with the reason. */
export const CITED_EXCLUDED: Record<string, string> = Object.fromEntries([
  ...["Suetonius", "Flavius Josephus", "Justin Martyr", "Tertullian", "Tacitus", "Origen", "Jerome", "Clement of Rome", "Clement of Alexandria", "Xenophon", "Theodoret", "Strabo",
    "Socrates Scholasticus", "Seneca", "Polycarp", "Pliny the Elder", "Philo", "Papias", "Macrobius", "John Chrysostom", "Jacobus de Voragine", "Ishodad of Merv", "Irenaeus",
    "Ignatius", "Hippolytus", "Herodotus", "Eusebius", "Cassius Dio", "Benjamin of Tudela", "Augustus", "Augustine", "Athanasius"].map((name) => [name, ANCIENT]),
  ...["Anonymous", "Unknown", "Council of Trent", "Clementine Vulgate", "Geneva Bible translators", "Jewish Encyclopedia", "The Catholic Encyclopedia",
    "International Standard Bible Encyclopedia", "The Israel Museum", "Jerusalem"].map((name) => [name, REFERENCE]),
]);
