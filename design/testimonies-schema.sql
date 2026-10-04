-- PROPOSED schema for the testimony service. Not a production migration.
-- The design preview never connects to this schema or stores real submissions.
-- Unix timestamps are UTC seconds. Token columns contain digests, never raw tokens.
PRAGMA foreign_keys = ON;

CREATE TABLE testimony_accounts (
  id TEXT PRIMARY KEY,
  email_normalized TEXT NOT NULL UNIQUE,
  email_verified_at INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE testimony_people (
  id TEXT PRIMARY KEY,
  account_id TEXT UNIQUE REFERENCES testimony_accounts(id) ON DELETE SET NULL,
  display_name TEXT,
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'removed')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (state = 'removed' OR (account_id IS NOT NULL AND length(trim(display_name)) BETWEEN 2 AND 60))
);

CREATE TABLE testimony_invitations (
  id TEXT PRIMARY KEY,
  token_digest TEXT NOT NULL UNIQUE CHECK (length(token_digest) = 64),
  inviter_person_id TEXT NOT NULL REFERENCES testimony_people(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  redeemed_by_person_id TEXT UNIQUE REFERENCES testimony_people(id),
  redeemed_at INTEGER,
  CHECK (expires_at > created_at),
  CHECK ((redeemed_by_person_id IS NULL) = (redeemed_at IS NULL)),
  CHECK (redeemed_by_person_id IS NULL OR redeemed_by_person_id <> inviter_person_id)
);
CREATE INDEX testimony_invites_by_inviter ON testimony_invitations(inviter_person_id, created_at);

CREATE TRIGGER testimony_invitation_starts_unclaimed BEFORE INSERT ON testimony_invitations
WHEN NEW.redeemed_by_person_id IS NOT NULL OR NEW.redeemed_at IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'invitation_starts_unclaimed'); END;
CREATE TRIGGER testimony_invitation_claim_is_final BEFORE UPDATE ON testimony_invitations
WHEN OLD.redeemed_by_person_id IS NOT NULL AND (
  NEW.redeemed_by_person_id IS NOT OLD.redeemed_by_person_id OR NEW.redeemed_at IS NOT OLD.redeemed_at
)
BEGIN SELECT RAISE(ABORT, 'invitation_already_claimed'); END;

CREATE TRIGGER testimony_claim_invitation BEFORE UPDATE OF redeemed_by_person_id ON testimony_invitations
WHEN NEW.redeemed_by_person_id IS NOT NULL
BEGIN
  SELECT CASE WHEN OLD.redeemed_by_person_id IS NOT NULL AND OLD.redeemed_by_person_id <> NEW.redeemed_by_person_id
    THEN RAISE(ABORT, 'invitation_already_claimed') END;
  SELECT CASE WHEN OLD.redeemed_by_person_id IS NULL AND (OLD.revoked_at IS NOT NULL OR OLD.expires_at <= unixepoch())
    THEN RAISE(ABORT, 'invitation_unavailable') END;
END;
CREATE TRIGGER testimony_invitation_origin_immutable BEFORE UPDATE OF inviter_person_id, token_digest ON testimony_invitations
BEGIN SELECT RAISE(ABORT, 'invitation_origin_immutable'); END;

CREATE TABLE testimony_connections (
  child_person_id TEXT PRIMARY KEY REFERENCES testimony_people(id),
  parent_person_id TEXT NOT NULL REFERENCES testimony_people(id),
  invitation_id TEXT NOT NULL UNIQUE REFERENCES testimony_invitations(id),
  accepted_at INTEGER NOT NULL DEFAULT (unixepoch()),
  consent_version TEXT NOT NULL,
  CHECK (child_person_id <> parent_person_id)
);
CREATE INDEX testimony_children ON testimony_connections(parent_person_id, child_person_id);

CREATE TRIGGER testimony_connection_evidence BEFORE INSERT ON testimony_connections
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM testimony_invitations i
    WHERE i.id = NEW.invitation_id AND i.inviter_person_id = NEW.parent_person_id
      AND i.redeemed_by_person_id = NEW.child_person_id AND i.redeemed_at IS NOT NULL
  ) THEN RAISE(ABORT, 'connection_requires_accepted_invitation') END;
  SELECT CASE WHEN EXISTS (
    WITH RECURSIVE ancestors(id) AS (
      SELECT NEW.parent_person_id
      UNION
      SELECT c.parent_person_id FROM testimony_connections c JOIN ancestors a ON c.child_person_id = a.id
    ) SELECT 1 FROM ancestors WHERE id = NEW.child_person_id
  ) THEN RAISE(ABORT, 'invitation_cycle') END;
END;
CREATE TRIGGER testimony_connection_immutable BEFORE UPDATE ON testimony_connections
BEGIN SELECT RAISE(ABORT, 'connection_is_immutable'); END;

CREATE TABLE testimony_stories (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL UNIQUE REFERENCES testimony_people(id),
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'public', 'withdrawn')),
  published_revision_id TEXT REFERENCES testimony_revisions(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (state <> 'public' OR published_revision_id IS NOT NULL)
);

CREATE TABLE testimony_revisions (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES testimony_stories(id),
  version INTEGER NOT NULL CHECK (version > 0),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 5 AND 120),
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 80 AND 12000),
  content_digest TEXT NOT NULL CHECK (length(content_digest) = 64),
  publication_consent_at INTEGER NOT NULL,
  consent_version TEXT NOT NULL,
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (story_id, version)
);

CREATE TABLE testimony_publication_decisions (
  revision_id TEXT PRIMARY KEY REFERENCES testimony_revisions(id),
  content_digest TEXT NOT NULL CHECK (length(content_digest) = 64),
  provider TEXT NOT NULL CHECK (provider IN ('disabled', 'external')),
  policy_version TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('publish', 'hold', 'reject')),
  reason_code TEXT,
  decided_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (provider <> 'disabled' OR decision = 'publish')
);

CREATE TRIGGER testimony_publish_matching_revision BEFORE UPDATE OF published_revision_id, state ON testimony_stories
WHEN NEW.state = 'public'
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM testimony_revisions r JOIN testimony_publication_decisions d ON d.revision_id = r.id
    WHERE r.id = NEW.published_revision_id AND r.story_id = NEW.id
      AND d.content_digest = r.content_digest AND d.decision = 'publish'
  ) THEN RAISE(ABORT, 'publication_requires_matching_decision') END;
END;
CREATE TRIGGER testimony_initial_story_is_draft BEFORE INSERT ON testimony_stories
WHEN NEW.state <> 'draft' OR NEW.published_revision_id IS NOT NULL
BEGIN SELECT RAISE(ABORT, 'create_draft_before_publication'); END;
CREATE TRIGGER testimony_revision_immutable BEFORE UPDATE ON testimony_revisions
BEGIN SELECT RAISE(ABORT, 'create_a_new_revision'); END;

CREATE TABLE testimony_sessions (
  token_digest TEXT PRIMARY KEY CHECK (length(token_digest) = 64),
  account_id TEXT NOT NULL REFERENCES testimony_accounts(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX testimony_session_expiry ON testimony_sessions(expires_at);

CREATE TABLE testimony_submission_receipts (
  account_id TEXT NOT NULL REFERENCES testimony_accounts(id),
  idempotency_key TEXT NOT NULL,
  request_digest TEXT NOT NULL CHECK (length(request_digest) = 64),
  story_id TEXT NOT NULL REFERENCES testimony_stories(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (account_id, idempotency_key)
);

CREATE TABLE testimony_reports (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES testimony_stories(id),
  reason_code TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '' CHECK (length(detail) <= 2000),
  state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'resolved', 'dismissed')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Public API uses this projection, never SELECT * from account, invite or session tables.
CREATE VIEW public_testimony_stories AS
SELECT s.id, p.id AS person_id, p.display_name, r.title, r.body, r.version, r.submitted_at
FROM testimony_stories s JOIN testimony_people p ON p.id = s.person_id
JOIN testimony_revisions r ON r.id = s.published_revision_id
WHERE s.state = 'public' AND p.state = 'active';

-- Connection reads must additionally project withdrawn/removed people to anonymous placeholders.
-- Private emails, unused invitations, drafts, reports and internal moderation decisions are never public.
