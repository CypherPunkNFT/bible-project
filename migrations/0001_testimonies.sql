-- No seed stories. The first author enters through a private root invitation.
-- statement
CREATE TABLE testimony_accounts (
  id TEXT PRIMARY KEY, access_digest TEXT NOT NULL UNIQUE CHECK(length(access_digest)=64),
  role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','owner')), created_at INTEGER NOT NULL DEFAULT(unixepoch())
);
-- statement
CREATE TABLE testimony_people (
  id TEXT PRIMARY KEY, account_id TEXT NOT NULL UNIQUE REFERENCES testimony_accounts(id),
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 60), created_at INTEGER NOT NULL DEFAULT(unixepoch())
);
-- statement
CREATE TABLE testimony_invitations (
  id TEXT PRIMARY KEY, token_digest TEXT NOT NULL UNIQUE CHECK(length(token_digest)=64),
  inviter_id TEXT REFERENCES testimony_people(id), kind TEXT NOT NULL CHECK(kind IN ('root','personal')),
  created_at INTEGER NOT NULL DEFAULT(unixepoch()), expires_at INTEGER NOT NULL, revoked_at INTEGER,
  redeemed_by TEXT UNIQUE REFERENCES testimony_people(id), redeemed_at INTEGER,
  CHECK((kind='root')=(inviter_id IS NULL)), CHECK(expires_at>created_at),
  CHECK((redeemed_by IS NULL)=(redeemed_at IS NULL)), CHECK(redeemed_by IS NULL OR redeemed_by<>inviter_id)
);
-- statement
CREATE UNIQUE INDEX testimony_one_root_invitation ON testimony_invitations(kind) WHERE kind='root';
-- statement
CREATE INDEX testimony_inviter_index ON testimony_invitations(inviter_id, created_at);
-- statement
CREATE TRIGGER testimony_invitation_new BEFORE INSERT ON testimony_invitations
WHEN NEW.redeemed_by IS NOT NULL BEGIN SELECT RAISE(ABORT,'invitation_must_start_unused'); END;
-- statement
CREATE TRIGGER testimony_invitation_claim BEFORE UPDATE ON testimony_invitations BEGIN
  SELECT CASE WHEN NEW.token_digest IS NOT OLD.token_digest OR NEW.inviter_id IS NOT OLD.inviter_id OR NEW.kind IS NOT OLD.kind
    THEN RAISE(ABORT,'invitation_origin_immutable') END;
  SELECT CASE WHEN OLD.redeemed_by IS NOT NULL AND (NEW.redeemed_by IS NOT OLD.redeemed_by OR NEW.redeemed_at IS NOT OLD.redeemed_at)
    THEN RAISE(ABORT,'invitation_already_used') END;
  SELECT CASE WHEN OLD.redeemed_by IS NULL AND NEW.redeemed_by IS NOT NULL AND (OLD.expires_at<=unixepoch() OR OLD.revoked_at IS NOT NULL)
    THEN RAISE(ABORT,'invitation_unavailable') END;
END;
-- statement
CREATE TABLE testimony_receipts (
  request_id TEXT PRIMARY KEY, request_digest TEXT NOT NULL CHECK(length(request_digest)=64),
  invitation_id TEXT NOT NULL UNIQUE REFERENCES testimony_invitations(id), person_id TEXT NOT NULL UNIQUE REFERENCES testimony_people(id)
);
-- statement
CREATE TRIGGER testimony_receipt_proof BEFORE INSERT ON testimony_receipts BEGIN
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM testimony_invitations WHERE id=NEW.invitation_id AND redeemed_by=NEW.person_id)
    THEN RAISE(ABORT,'invitation_claim_required') END;
END;
-- statement
CREATE TABLE testimony_connections (
  child_id TEXT PRIMARY KEY REFERENCES testimony_people(id), parent_id TEXT NOT NULL REFERENCES testimony_people(id),
  invitation_id TEXT NOT NULL UNIQUE REFERENCES testimony_invitations(id), accepted_at INTEGER NOT NULL DEFAULT(unixepoch()), CHECK(child_id<>parent_id)
);
-- statement
CREATE INDEX testimony_parent_index ON testimony_connections(parent_id,child_id);
-- statement
CREATE TRIGGER testimony_connection_proof BEFORE INSERT ON testimony_connections BEGIN
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM testimony_invitations WHERE id=NEW.invitation_id AND inviter_id=NEW.parent_id AND redeemed_by=NEW.child_id)
    THEN RAISE(ABORT,'accepted_invitation_required') END;
  SELECT CASE WHEN EXISTS(WITH RECURSIVE ancestors(id) AS (SELECT NEW.parent_id UNION SELECT c.parent_id FROM testimony_connections c JOIN ancestors a ON c.child_id=a.id) SELECT 1 FROM ancestors WHERE id=NEW.child_id)
    THEN RAISE(ABORT,'invitation_cycle') END;
END;
-- statement
CREATE TRIGGER testimony_connection_immutable BEFORE UPDATE ON testimony_connections BEGIN SELECT RAISE(ABORT,'connection_is_immutable'); END;
-- statement
CREATE TABLE testimony_stories (
  id TEXT PRIMARY KEY, person_id TEXT NOT NULL UNIQUE REFERENCES testimony_people(id),
  state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','public','withdrawn')),
  published_revision_id TEXT REFERENCES testimony_revisions(id), first_published_at INTEGER,
  CHECK(state<>'public' OR published_revision_id IS NOT NULL)
);
-- statement
CREATE TABLE testimony_revisions (
  id TEXT PRIMARY KEY, story_id TEXT NOT NULL REFERENCES testimony_stories(id),
  version INTEGER NOT NULL CHECK(version>0), title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 5 AND 120),
  body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 80 AND 12000), theme TEXT NOT NULL DEFAULT '' CHECK(length(theme)<=40),
  happened_when TEXT NOT NULL DEFAULT '' CHECK(length(happened_when)<=80), content_digest TEXT NOT NULL CHECK(length(content_digest)=64),
  consent_version TEXT NOT NULL, submitted_at INTEGER NOT NULL DEFAULT(unixepoch()), UNIQUE(story_id,version)
);
-- statement
CREATE TABLE testimony_decisions (
  revision_id TEXT PRIMARY KEY REFERENCES testimony_revisions(id), content_digest TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('publish','hold','reject')), provider TEXT NOT NULL CHECK(provider IN ('disabled','external')),
  policy_version TEXT NOT NULL, CHECK(provider<>'disabled' OR action='publish')
);
-- statement
CREATE TRIGGER testimony_revision_immutable BEFORE UPDATE ON testimony_revisions BEGIN SELECT RAISE(ABORT,'revision_is_immutable'); END;
-- statement
CREATE TRIGGER testimony_story_starts_draft BEFORE INSERT ON testimony_stories
WHEN NEW.state<>'draft' OR NEW.published_revision_id IS NOT NULL OR NEW.first_published_at IS NOT NULL
BEGIN SELECT RAISE(ABORT,'story_must_start_draft'); END;
-- statement
CREATE TRIGGER testimony_publication_proof BEFORE UPDATE OF state,published_revision_id ON testimony_stories WHEN NEW.state='public' BEGIN
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM testimony_revisions r JOIN testimony_decisions d ON d.revision_id=r.id
    WHERE r.id=NEW.published_revision_id AND r.story_id=NEW.id AND d.content_digest=r.content_digest AND d.action='publish')
    THEN RAISE(ABORT,'matching_publication_decision_required') END;
END;
-- statement
CREATE TRIGGER testimony_first_publication AFTER UPDATE OF state ON testimony_stories WHEN NEW.state='public' AND NEW.first_published_at IS NULL
BEGIN UPDATE testimony_stories SET first_published_at=unixepoch() WHERE id=NEW.id; END;
-- statement
CREATE TRIGGER testimony_shared_date_immutable BEFORE UPDATE OF first_published_at ON testimony_stories
WHEN OLD.first_published_at IS NOT NULL AND NEW.first_published_at IS NOT OLD.first_published_at
BEGIN SELECT RAISE(ABORT,'first_publication_is_immutable'); END;
-- statement
CREATE TABLE testimony_sessions (
  token_digest TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES testimony_accounts(id), expires_at INTEGER NOT NULL
);
-- statement
CREATE INDEX testimony_sessions_expiry ON testimony_sessions(expires_at);
-- statement
CREATE TABLE testimony_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
-- statement
CREATE TABLE testimony_reports (
  id TEXT PRIMARY KEY, person_id TEXT NOT NULL REFERENCES testimony_people(id), reason TEXT NOT NULL CHECK(length(reason) BETWEEN 3 AND 2000),
  created_at INTEGER NOT NULL DEFAULT(unixepoch()), resolved_at INTEGER
);
-- statement
CREATE VIEW testimony_public_stories AS
SELECT p.id, c.parent_id, p.name, r.title, r.body, r.theme, r.happened_when, s.first_published_at, r.version
FROM testimony_people p JOIN testimony_stories s ON s.person_id=p.id JOIN testimony_revisions r ON r.id=s.published_revision_id
LEFT JOIN testimony_connections c ON c.child_id=p.id WHERE s.state='public';
