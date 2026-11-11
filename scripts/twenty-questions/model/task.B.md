Your job: decide a list of yes/no facts ("tags") about ONE Bible character, for a guessing game that asks players questions such as "Was your person a king?". You receive the character's label and brief, the site's story about them, facts already fixed from the site's data, the Berean Standard Bible verses that name them, and the tags to decide. Reply with every listed tag exactly once and nothing more.

WHAT A VALUE MEANS. Each value is the answer SCRIPTURE gives to the question EXACTLY as worded, as an ordinary Bible reader would take it. Commentaries, church tradition and disputed dates do not count. Whenever the answer would need a tradition, a contested date or a pick between interpretations, answer "unsure".

THE THREE VALUES
- "yes" = Scripture shows it. Every yes carries "ref": a single verse that shows it, in the form "Book chapter:verse" using the book names exactly as they appear in the verse list ("Luke 2:1", "2 Samuel 11:3"). No ranges, one verse. Prefer a verse from the supplied list; another verse is acceptable only when it is clearly about THIS person.
- "no" = Scripture shows it is not so, or the person never appears in such a story. Give a ref only when the no rests on a statement in the text (Deuteronomy 34:4 shows Moses did not enter the land); otherwise ref is "".
- "unsure" = the text does not settle it, or a fair reader could go either way.

HOW TO DECIDE EACH KIND
- Events and places (miracles, prison, battles, building, animals, Egypt, Babylon, Jerusalem, Galilee, Rome, the sea...): when nothing in the verses or story records such an event, the answer is "no". If you were told that the list holds EVERY verse naming this person, an absent event is a confident no. Reserve "unsure" for a genuinely open case: an event only half implied, or a reading scholars read both ways.
- Family (married, children, tribe, Levite, twin, lived to 120 or more): start from "unsure". "yes" needs a verse. "no" needs a verse that says so or that gives a different tribe or nation. The text being silent means "unsure", not "no".
- Famous sibling: "yes" only where a brother or sister who is a well-known Bible figure appears; "no" where the text names no sibling at all.
- Books ("takes part in the events of ..."): the person is certainly named there. "yes" when they act or speak in that book's own narrative; "unsure" when they are only mentioned, quoted or listed (Abraham in Matthew: unsure; Moses in Mark: yes, Transfiguration, Mark 9:4). "no" is not allowed.
- Eras: "yes" needs a verse placing the person in that period (a king, an event, a generation named); "no" when their whole story belongs to another period.
- Roles (queen, high priest, religious leader of Jesus' day, soldier, court official, shepherd, fisherman, tax collector): "yes" with a verse showing the role; "no" when the text never gives them that role.
- Edge rules: "a famous story with an animal" means the animal is what the story is remembered for (Jonah's fish, Balaam's donkey, Daniel's lions), not sacrifices, mounts or livestock in passing. "Led God's people" means the nation or a large body of believers, not a family. "Built something famous" means a structure Scripture describes them making (ark, tabernacle, temple, walls, a named altar). "Known for something done as a child or teenager" means an act Scripture records from their youth. "Put to death by others" means killed by people.

FIXED FACTS. The item names facts already settled from the site's data. Leave those tags out of your answer and never contradict them.

NAMESAKES. Several Bible people may carry this name. Your person is ONLY the one described in the brief and the verse list. The supplied verses are your primary evidence; do not credit this person with a namesake's deeds.

SLIP. On a yes or no, set "slip": true when most players who know the story well would still answer the OPPOSITE way (Moses did not enter the Promised Land; Thomas is called "the Twin"). An obscure detail is not a slip. No more than 3 slips per person. Never slip an "unsure".

WHY. On a yes or no, "why" is one clause under 120 characters naming what in the text decides it. On unsure, a few words on what is open. Plain text.

FORMAT. JSON only: {"tags": [{"id": "...", "v": "yes" | "no" | "unsure", "ref": "Book c:v" or "", "slip": true | false, "why": "..."}]}. Exactly one entry per tag under TAGS TO DECIDE, in the order given; no other entries.
