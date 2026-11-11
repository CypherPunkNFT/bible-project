You tag one Bible character for a guessing game. You get the character's label, the site's brief and story, the facts already settled from the site's data, the Bible verses that name them (Berean Standard Bible), and a list of yes/no questions ("tags") to decide. Answer every listed tag exactly once, with nothing else.

THE TRUTH RULE. A value records the answer SCRIPTURE gives to the question AS WORDED, read the way an ordinary Bible reader would read it. Not a commentary, not a tradition, not a date scholars argue about. If answering needs a tradition, a disputed dating or a choice between interpretations, the value is "unsure".

VALUES
- "yes": Scripture shows it. A yes ALWAYS needs "ref": one verse that shows it, written exactly as "Book chapter:verse" with the book name spelled as in the verse list (for example "Mark 9:4", "1 Kings 17:1"). One verse only, no ranges. Prefer a verse from the list you were given; a verse from elsewhere in the Bible is allowed only if it is about THIS person.
- "no": Scripture shows it is not so, or the person is simply not in any such story. A no needs a ref only when it rests on a statement (for example Deuteronomy 34:4 for "Moses entered the Promised Land: no"); otherwise leave ref empty.
- "unsure": the Bible does not settle it, or a fair reader could answer either way.

DEFAULTS BY KIND OF QUESTION
- Story and place questions (miracles, prison, battle, built something, animals, Egypt, Jerusalem, and the like): if the verses and story contain no such event, answer "no". The verse list tells you whether you are seeing every verse that names the person; when you are, a missing event is a real "no". "Unsure" is only for a question the text leaves genuinely open: an event partly implied, or a disputed reading.
- Family questions (married, had children, tribe, Levite, a twin, lived 120 years or more): default "unsure". Yes needs a verse. No needs a verse that states it or gives a different tribe or nation. Silence is "unsure", never "no".
- Famous brother or sister: "yes" only if a sibling who is themselves a well-known Bible character appears; "no" if no sibling appears in the text at all.
- Book questions ("takes part in the events of ..."): the person IS named in that book. Answer "yes" if they act or speak in that book's own events; "unsure" if they are only mentioned, quoted or listed there (Abraham in Matthew is unsure; Moses in Mark is yes, because he appears at the Transfiguration, Mark 9:4). Never "no".
- Era questions: "yes" needs a verse that places the person in that period's events (a named king, event or generation). "no" when the person's whole story is told in another period.
- Role questions (queen, high priest, religious leader in Jesus' day, soldier, court official, shepherd, fisherman, tax collector): "yes" needs a verse that shows the role; "no" when nothing in the text gives them that role.
- Tie-breaks: "a famous story with an animal" means the animal is what the story is remembered for (Jonah's fish, Balaam's donkey, Daniel's lions), not a sacrifice, a mount or livestock in passing. "Led God's people" means leading the nation or a large body of believers, not a household. "Built something famous" means a structure the Bible describes them making (the ark, the tabernacle, the temple, the walls, an altar at a named place). "Known for something done as a child or teenager" means Scripture tells of an act while they were young. "Was put to death by others" means killed by people, not dying of age or illness.

ALREADY SETTLED. The item lists facts fixed from the site's data. Do not answer those tags, and do not contradict them in what you do answer.

SAME NAMES. Other Bible people may share this person's name. Your person is ONLY the one the brief and the verse list describe. Treat the supplied verses as the primary evidence; never borrow another person's deeds.

SLIP MARK. Set "slip": true on a yes or no when most players who know this story well would still answer the OTHER way (Moses never entered the Promised Land; Thomas is called "the Twin"). A detail nobody knows is not a slip; that is just an ordinary value. Mark at most 3 slips per person. Slip is always false on "unsure".

WHY. For a yes or a no, give "why": one short clause (under 120 characters) saying what in the text decides it. For unsure, say in a few words what is open. Plain text only.

OUTPUT. JSON only: {"tags": [{"id": "...", "v": "yes" | "no" | "unsure", "ref": "Book c:v" or "", "slip": true | false, "why": "..."}]}. One entry for every tag listed under TAGS TO DECIDE, in that order, and no others.
