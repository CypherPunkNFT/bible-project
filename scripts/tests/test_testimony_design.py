"""Exercise the proposed schema in SQLite; no production database is contacted."""
import sqlite3
from pathlib import Path

import pytest

SCHEMA = Path(__file__).resolve().parents[2] / "design" / "testimonies-schema.sql"


@pytest.fixture
def db():
    conn = sqlite3.connect(":memory:")
    conn.executescript(SCHEMA.read_text(encoding="utf-8"))
    for person in ("root", "child", "other"):
        conn.execute("INSERT INTO testimony_accounts(id,email_normalized,email_verified_at) VALUES (?,?,1)", (person, person + "@example.test"))
        conn.execute("INSERT INTO testimony_people(id,account_id,display_name) VALUES (?,?,?)", (person, person, person.title()))
    conn.commit()
    yield conn
    conn.close()


def invite(db, ident="invite", parent="root", expired=False):
    db.execute("INSERT INTO testimony_invitations(id,token_digest,inviter_person_id,created_at,expires_at) VALUES (?,?,?,unixepoch()-100,unixepoch()+?)", (ident, ident.ljust(64, "0"), parent, -1 if expired else 1000))


def connect(db, ident, child, parent):
    db.execute("UPDATE testimony_invitations SET redeemed_by_person_id=?,redeemed_at=unixepoch() WHERE id=?", (child, ident))
    db.execute("INSERT INTO testimony_connections(child_person_id,parent_person_id,invitation_id,consent_version) VALUES (?,?,?,'v1')", (child, parent, ident))


def test_single_use_and_one_origin(db):
    invite(db)
    connect(db, "invite", "child", "root")
    with pytest.raises(sqlite3.IntegrityError, match="already_claimed"):
        db.execute("UPDATE testimony_invitations SET redeemed_by_person_id='other' WHERE id='invite'")
    with pytest.raises(sqlite3.IntegrityError, match="already_claimed"):
        db.execute("UPDATE testimony_invitations SET redeemed_by_person_id=NULL,redeemed_at=NULL WHERE id='invite'")
    invite(db, "second", "other")
    with pytest.raises(sqlite3.IntegrityError):
        connect(db, "second", "child", "other")


def test_forged_parent_and_expired_invitation(db):
    invite(db)
    db.execute("UPDATE testimony_invitations SET redeemed_by_person_id='child',redeemed_at=unixepoch() WHERE id='invite'")
    with pytest.raises(sqlite3.IntegrityError, match="accepted_invitation"):
        db.execute("INSERT INTO testimony_connections VALUES ('child','other','invite',1,'v1')")
    invite(db, "expired", expired=True)
    with pytest.raises(sqlite3.IntegrityError, match="unavailable"):
        connect(db, "expired", "other", "root")


def test_cycle_rejected_and_failed_acceptance_rolls_back(db):
    invite(db)
    connect(db, "invite", "child", "root")
    invite(db, "cycle", "child")
    db.commit()
    with pytest.raises(sqlite3.IntegrityError, match="invitation_cycle"):
        with db:
            connect(db, "cycle", "root", "child")
    assert db.execute("SELECT redeemed_by_person_id FROM testimony_invitations WHERE id='cycle'").fetchone()[0] is None
    assert db.execute("SELECT count(*) FROM testimony_connections").fetchone()[0] == 1


def test_publication_requires_matching_decision_and_withdrawal_hides_story(db):
    db.execute("INSERT INTO testimony_stories(id,person_id) VALUES ('story','root')")
    db.execute("INSERT INTO testimony_revisions VALUES ('revision','story',1,'A sample story',?,?,1,'v1',1)", ("A sample testimony. " * 10, "a" * 64))
    assert db.execute("SELECT count(*) FROM public_testimony_stories").fetchone()[0] == 0
    with pytest.raises(sqlite3.IntegrityError, match="matching_decision"):
        db.execute("UPDATE testimony_stories SET published_revision_id='revision',state='public' WHERE id='story'")
    db.execute("INSERT INTO testimony_publication_decisions(revision_id,content_digest,provider,policy_version,decision) VALUES ('revision',?,'disabled','immediate-v1','publish')", ("b" * 64,))
    with pytest.raises(sqlite3.IntegrityError, match="matching_decision"):
        db.execute("UPDATE testimony_stories SET published_revision_id='revision',state='public' WHERE id='story'")
    db.execute("UPDATE testimony_publication_decisions SET content_digest=? WHERE revision_id='revision'", ("a" * 64,))
    db.execute("UPDATE testimony_stories SET published_revision_id='revision',state='public' WHERE id='story'")
    assert db.execute("SELECT count(*) FROM public_testimony_stories").fetchone()[0] == 1
    db.execute("UPDATE testimony_stories SET state='withdrawn' WHERE id='story'")
    assert db.execute("SELECT count(*) FROM public_testimony_stories").fetchone()[0] == 0


def test_hold_and_revision_edit_cannot_bypass_publication(db):
    db.execute("INSERT INTO testimony_stories(id,person_id) VALUES ('story','root')")
    db.execute("INSERT INTO testimony_revisions VALUES ('revision','story',1,'A sample story',?,?,1,'v1',1)", ("Sample words. " * 10, "a" * 64))
    db.execute("INSERT INTO testimony_publication_decisions(revision_id,content_digest,provider,policy_version,decision) VALUES ('revision',?,'external','future-v1','hold')", ("a" * 64,))
    with pytest.raises(sqlite3.IntegrityError, match="matching_decision"):
        db.execute("UPDATE testimony_stories SET published_revision_id='revision',state='public' WHERE id='story'")
    with pytest.raises(sqlite3.IntegrityError, match="new_revision"):
        db.execute("UPDATE testimony_revisions SET body=? WHERE id='revision'", ("Changed words. " * 10,))
    columns = [r[1] for r in db.execute("PRAGMA table_info(public_testimony_stories)")]
    assert "email_normalized" not in columns and "token_digest" not in columns
