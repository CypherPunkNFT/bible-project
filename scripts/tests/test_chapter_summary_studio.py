"""Offline checks: no live inference or studio server is started."""
import importlib.util
import json
from pathlib import Path
import tempfile
import sqlite3
import copy
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("studio", Path(__file__).resolve().parents[1] / "chapter_summary_studio.py")
studio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(studio)


class StudioTests(unittest.TestCase):
    def test_complete_scripture_coverage(self):
        count = 0
        for book in studio.books():
            for chapter in range(1, len(book["chapters"]) + 1):
                for translation in ("bsb", "kjv", "web"):
                    source = studio.source(book["code"], chapter, translation)
                    self.assertTrue(source["verses"])
                    # WEB preserves a few verse numbers with no body text.
                    self.assertTrue(any(v["text"] for v in source["verses"]))
                count += 1
        self.assertEqual(count, 1189)

    def test_preview_cannot_call_model_or_create_database(self):
        with patch.object(studio, "ollama", side_effect=AssertionError("Model called")), patch.object(studio, "Store", side_effect=AssertionError("Store created")):
            page = studio.page(preview=True)
        self.assertIn('"preview": true', page)
        self.assertIn("Illustrative example", page)
        self.assertNotIn("__BOOT__", page)

    @patch.object(studio, "review_draft", return_value=([], {}))
    def test_structured_generation_and_provenance(self, _review):
        fake = {"message": {"content": json.dumps(studio.EXAMPLE)}, "done_reason": "stop", "total_duration": 2e9}
        with patch.object(studio, "ollama", return_value=fake) as call:
            record = studio.generate("GEN", 1, "bsb", studio.DEFAULT_MODEL)
        self.assertEqual(record["status"], "draft")
        self.assertEqual(record["source_sha256"], studio.source("GEN", 1)["hash"])
        payload = call.call_args.args[1]
        self.assertFalse(payload["stream"])
        self.assertIn("31.", payload["messages"][1]["content"])
        with patch.object(studio, "ollama", return_value={**fake, "done_reason": "length"}):
            with self.assertRaisesRegex(ValueError, "output limit"):
                studio.generate("GEN", 1, "bsb", studio.DEFAULT_MODEL)

    def test_validation_rejects_bad_outputs(self):
        for bad in ([], {}, {**studio.EXAMPLE, "summary": "Too short"}, {**studio.EXAMPLE, "title": "<b>Bad html title</b>"}):
            with self.assertRaises(ValueError):
                studio.validate(bad)
        self.assertEqual(studio.validate(studio.EXAMPLE), studio.EXAMPLE)
        for code, chapter in (("../GEN", 1), ("GEN", 0), ("GEN", 51)):
            with self.assertRaises(ValueError):
                studio.source(code, chapter)

    @patch.object(studio, "review_draft", return_value=([], {}))
    def test_invalid_length_gets_a_bounded_correction_retry(self, _review):
        short = {"message": {"content": json.dumps({**studio.EXAMPLE, "summary": "Too short."})}, "done_reason": "stop"}
        good = {"message": {"content": json.dumps(studio.EXAMPLE)}, "done_reason": "stop"}
        with patch.object(studio, "ollama", side_effect=[short, good]) as call:
            record = studio.generate("GEN", 1, "bsb", studio.DEFAULT_MODEL)
        self.assertEqual(record["attempts"], 2)
        self.assertEqual(record["summary"], studio.EXAMPLE["summary"])
        self.assertIn("Validation failed", call.call_args.args[1]["messages"][-1]["content"])
        with patch.object(studio, "ollama", return_value=short) as call:
            with self.assertRaisesRegex(ValueError, "after 3 attempts"):
                studio.generate("GEN", 1, "bsb", studio.DEFAULT_MODEL)
        self.assertEqual(call.call_count, 3)

    def test_failure_keeps_progress_and_resume_skips_saved(self):
        with tempfile.TemporaryDirectory() as directory:
            app = studio.Studio(directory)
            record = {**studio.EXAMPLE, "code": "GEN", "chapter": 1, "translation": "bsb", "status": "draft", "format_version": studio.FORMAT_VERSION, "prompt_version": studio.PROMPT_VERSION}
            app.job.update(running=True, total=3)
            with patch.object(studio, "generate", side_effect=[record, ValueError("Invalid model output")]):
                app.run([("GEN", 1), ("GEN", 2), ("GEN", 3)], "bsb", studio.DEFAULT_MODEL)
            self.assertEqual(set(app.store.all()), {"GEN:1"})
            self.assertFalse(app.job["running"])
            self.assertIn("Invalid model output", app.job["error"])
            with patch.object(studio, "models", return_value=[studio.DEFAULT_MODEL]), patch.object(studio.threading, "Thread") as thread:
                app.start({"model": studio.DEFAULT_MODEL, "translation": "bsb", "code": "GEN", "chapter": 1, "scope": "book"})
                queue = thread.call_args.kwargs["args"][0]
                self.assertNotIn(("GEN", 1), queue)
                self.assertEqual(len(queue), 49)
            reopened = studio.Store(directory)
            self.assertEqual(reopened.all()["GEN:1"]["summary"], record["summary"])

    def test_pause_finishes_current_chapter_and_export_only_approved(self):
        with tempfile.TemporaryDirectory() as directory:
            app = studio.Studio(directory)
            record = {**studio.EXAMPLE, "code": "GEN", "chapter": 1, "translation": "bsb", "status": "draft"}
            def generate(*args):
                app.stop.set()
                return record
            with patch.object(studio, "generate", side_effect=generate) as call:
                app.run([("GEN", 1), ("GEN", 2)], "bsb", studio.DEFAULT_MODEL)
            self.assertEqual(call.call_count, 1)
            self.assertEqual(app.job["done"], 1)
            with self.assertRaises(ValueError):
                app.store.export()
            app.save({**record, "status": "approved"})
            app.store.put("GEN:2", {**record, "chapter": 2})
            result = app.store.export()
            self.assertEqual(set(json.loads(Path(result["path"]).read_text())["chapters"]), {"GEN:1"})
            app.save(record)
            self.assertIsNone(app.store.all()["GEN:1"]["reviewed_at"])

    def test_verse_ranges_are_valid_ordered_and_non_overlapping(self):
        scripture = studio.source("GEN", 1)
        self.assertEqual(studio.validate(studio.EXAMPLE, scripture), studio.EXAMPLE)
        for first, second in ((0, 20), (2, 32), (20, 10)):
            bad = copy.deepcopy(studio.EXAMPLE)
            bad["outline"][0].update(verse_start=first, verse_end=second)
            with self.assertRaises(ValueError):
                studio.validate(bad, scripture)
        bad = copy.deepcopy(studio.EXAMPLE)
        bad["outline"][1]["verse_start"] = 13
        with self.assertRaisesRegex(ValueError, "non-overlapping"):
            studio.validate(bad, scripture)
        for movements in ([studio.EXAMPLE["outline"][0]], studio.EXAMPLE["outline"] * 12):
            with self.assertRaises(ValueError):
                studio.validate({**studio.EXAMPLE, "outline": movements}, scripture)
        single = {**studio.EXAMPLE["outline"][0], "verse_end": 31}
        studio.validate({**studio.EXAMPLE, "outline": [single]}, scripture)

    def test_legacy_outputs_are_not_reused_or_modified(self):
        with tempfile.TemporaryDirectory() as directory:
            legacy = Path(directory) / "summaries.sqlite3"
            db = sqlite3.connect(legacy)
            db.execute("CREATE TABLE summaries(key TEXT PRIMARY KEY,payload TEXT)")
            db.execute("INSERT INTO summaries VALUES('GEN:1','old output')")
            db.commit()
            db.close()
            before = legacy.read_bytes()
            store = studio.Store(directory)
            self.assertEqual(store.all(), {})
            self.assertEqual(store.path.name, "summaries-v3.sqlite3")
            store.put("GEN:1", {**studio.EXAMPLE, "status": "draft"})
            self.assertEqual(legacy.read_bytes(), before)

    def test_context_references_only_use_supplied_passages(self):
        scripture = studio.source("GEN", 1)
        supplied = {1: scripture, **studio.context_sources("GEN", 1)}
        studio.validate(studio.EXAMPLE, scripture, supplied)
        for ref in ({"chapter": 50, "verse_start": 1, "verse_end": 3},
                    {"chapter": 2, "verse_start": 1, "verse_end": 300}):
            with self.assertRaisesRegex(ValueError, "outside the supplied"):
                studio.validate({**studio.EXAMPLE, "context_references": [ref]}, scripture, supplied)
        opening = studio.context_sources("ROM", 8)[1]
        self.assertIn("Paul", opening["text"])
        self.assertEqual(max(studio.verse_numbers(opening)), 12)
        with self.assertRaises(ValueError):
            studio.validate({**studio.EXAMPLE, "context_references": []}, scripture, supplied)

    def test_invalid_chapter_is_recorded_and_batch_continues(self):
        with tempfile.TemporaryDirectory() as directory:
            app = studio.Studio(directory)
            record = {**studio.EXAMPLE, "status": "draft"}
            app.job.update(running=True, total=3)
            with patch.object(studio, "generate", side_effect=[record, studio.DraftValidationError("Bad reference"), record]):
                app.run([("GEN", 1), ("GEN", 2), ("GEN", 3)], "bsb", studio.DEFAULT_MODEL)
            self.assertEqual(set(app.store.all()), {"GEN:1", "GEN:3"})
            self.assertEqual(set(app.store.failures()), {"GEN:2"})
            self.assertEqual(app.job["failed"], 1)
            self.assertEqual(app.job["done"], 2)
            app.store.put("GEN:2", record)
            self.assertFalse(app.store.failures())

    def test_resume_rejects_mixing_translations(self):
        with tempfile.TemporaryDirectory() as directory:
            app = studio.Studio(directory)
            app.store.put("GEN:1", {**studio.EXAMPLE, "translation": "bsb", "format_version": 3, "prompt_version": studio.PROMPT_VERSION})
            with patch.object(studio, "models", return_value=[studio.DEFAULT_MODEL]):
                with self.assertRaisesRegex(ValueError, "different translation"):
                    app.start({"translation": "kjv", "code": "GEN", "chapter": 1, "scope": "all"})

    def test_grounding_issues_trigger_correction_and_remain_drafts(self):
        fake = {"message": {"content": json.dumps(studio.EXAMPLE)}, "done_reason": "stop"}
        with patch.object(studio, "ollama", return_value=fake) as generation, patch.object(studio, "review_draft", side_effect=[(["Context reference misses the relevant verse"], {}), ([], {})]):
            record = studio.generate("GEN", 1, "bsb", studio.DEFAULT_MODEL)
        self.assertEqual(record["attempts"], 2)
        self.assertIn("Context reference misses", generation.call_args.args[1]["messages"][-1]["content"])
        self.assertEqual(record["status"], "draft")
        self.assertTrue(record["automated_review"]["human_review_required"])

    def test_review_evidence_excludes_neighboring_verses(self):
        scripture = studio.source("GEN", 4)
        self.assertIn("Nod", studio.cited_text(scripture, 16, 16))
        self.assertNotIn("Nod", studio.cited_text(scripture, 17, 24))
        scripture = studio.source("GEN", 1)
        response = {"message": {"content": '{"verdict":"pass","issues":[]}'}, "done_reason": "stop"}
        with patch.object(studio, "ollama", return_value=response) as call:
            studio.review_draft("", studio.EXAMPLE, studio.DEFAULT_MODEL, scripture, {1: scripture, **studio.context_sources("GEN", 1)})
        content = call.call_args.args[1]["messages"][1]["content"]
        checks = json.loads(content.split("\n", 1)[1])
        outline = next(c for c in checks if c["field"] == "outline")
        self.assertIn("13.", outline["evidence"])
        self.assertNotIn("14.", outline["evidence"])


if __name__ == "__main__":
    unittest.main()
