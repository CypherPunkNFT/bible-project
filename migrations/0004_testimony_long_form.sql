-- Preserve existing revisions, publication decisions and links while adding a blurb and optional long testimony.
-- D1 enforces foreign keys; defer them only for this atomic table replacement.
-- statement
PRAGMA defer_foreign_keys = ON;
-- statement
DROP VIEW testimony_public_stories;
-- statement
DROP TRIGGER testimony_publication_proof;
-- statement
CREATE TABLE testimony_revisions_new (
  id TEXT PRIMARY KEY, story_id TEXT NOT NULL REFERENCES testimony_stories(id),
  version INTEGER NOT NULL CHECK(version>0), title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 5 AND 120),
  blurb TEXT NOT NULL CHECK(length(trim(blurb)) BETWEEN 20 AND 600),
  body TEXT NOT NULL DEFAULT '' CHECK(length(body)<=100000), theme TEXT NOT NULL DEFAULT '' CHECK(length(theme)<=40),
  happened_when TEXT NOT NULL DEFAULT '' CHECK(length(happened_when)<=80), content_digest TEXT NOT NULL CHECK(length(content_digest)=64),
  consent_version TEXT NOT NULL, submitted_at INTEGER NOT NULL DEFAULT(unixepoch()), UNIQUE(story_id,version)
);
-- statement
INSERT INTO testimony_revisions_new(id,story_id,version,title,blurb,body,theme,happened_when,content_digest,consent_version,submitted_at)
SELECT id,story_id,version,title,substr(trim(body),1,600),body,theme,happened_when,content_digest,consent_version,submitted_at FROM testimony_revisions;
-- statement
DROP TABLE testimony_revisions;
-- statement
ALTER TABLE testimony_revisions_new RENAME TO testimony_revisions;
-- statement
CREATE TRIGGER testimony_revision_immutable BEFORE UPDATE ON testimony_revisions BEGIN SELECT RAISE(ABORT,'revision_is_immutable'); END;
-- statement
CREATE TRIGGER testimony_publication_proof BEFORE UPDATE OF state,published_revision_id ON testimony_stories WHEN NEW.state='public' BEGIN
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM testimony_revisions r JOIN testimony_decisions d ON d.revision_id=r.id
    WHERE r.id=NEW.published_revision_id AND r.story_id=NEW.id AND d.content_digest=r.content_digest AND d.action='publish')
    THEN RAISE(ABORT,'matching_publication_decision_required') END;
END;
-- statement
CREATE VIEW testimony_public_stories AS
SELECT p.id, c.parent_id, p.name, r.title, r.blurb, r.body, r.theme, r.happened_when, s.first_published_at, r.version
FROM testimony_people p JOIN testimony_stories s ON s.person_id=p.id JOIN testimony_revisions r ON r.id=s.published_revision_id
LEFT JOIN testimony_connections c ON c.child_id=p.id WHERE s.state='public';
-- statement
PRAGMA defer_foreign_keys = OFF;
