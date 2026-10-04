-- statement
ALTER TABLE testimony_stories ADD COLUMN moderation_blocked INTEGER NOT NULL DEFAULT 0 CHECK(moderation_blocked IN (0,1));
-- statement
CREATE TRIGGER testimony_moderation_gate BEFORE UPDATE OF state ON testimony_stories
WHEN NEW.state='public' AND NEW.moderation_blocked=1 BEGIN SELECT RAISE(ABORT,'story_is_hidden_by_owner'); END;
