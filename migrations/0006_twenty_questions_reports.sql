-- Bible twenty questions (docs/features/twenty-questions/design.md §10.3): one anonymous row per guess-mode game, and the
-- endpoint's own hourly counting keys. Reports hold game ids and answer letters only, never an address or free text.
-- Applied to the live database at release; until then the endpoint answers 503 and the game drops reports silently.
-- statement
CREATE TABLE twenty_questions_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL CHECK(length(version)<=40),
  who TEXT NOT NULL CHECK(length(who)<=80),
  in_pool INTEGER NOT NULL CHECK(in_pool IN (0,1)),
  answers TEXT NOT NULL CHECK(length(answers)<=2000),
  guesses TEXT NOT NULL CHECK(length(guesses)<=2500),
  disputed TEXT NOT NULL CHECK(length(disputed)<=1500),
  result TEXT NOT NULL CHECK(result IN ('won','lost')),
  created_at INTEGER NOT NULL DEFAULT(unixepoch())
);
-- statement
CREATE INDEX twenty_questions_reports_who ON twenty_questions_reports(who);
-- statement
CREATE TABLE twenty_questions_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
