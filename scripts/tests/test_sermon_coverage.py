"""Regression checks for coverage inflation and false missing-series reports."""
import importlib.util
from pathlib import Path
import unittest

SPEC = importlib.util.spec_from_file_location("coverage_audit", Path(__file__).parents[1] / "analyze-sermon-coverage.py")
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)


class CoverageTests(unittest.TestCase):
    def setUp(self):
        self.ids = audit.canon([{"num": 1, "chapters": [3, 2]}, {"num": 2, "chapters": [2]}])
        self.positions = {v: i for i, v in enumerate(self.ids)}

    def test_cross_chapter_and_book_ranges_skip_nonexistent_verses(self):
        self.assertEqual(audit.span({"start": 1001003, "end": 2001001}, self.ids, self.positions),
                         {1001003, 1002001, 1002002, 2001001})

    def test_invalid_endpoint_is_not_silently_rounded(self):
        with self.assertRaises(ValueError):
            audit.span({"start": 1001004, "end": 1002001}, self.ids, self.positions)

    def test_overlap_is_unioned_citations_and_unknowns_do_not_inflate_main_text(self):
        p = {"start": 1001001, "end": 1001002, "role": "main-text", "verification": "verified", "numberingSystem": "english"}
        works = [{"id": "w", "passages": [p, dict(p), {**p, "end": 1001003, "role": "citation"},
                                              {**p, "start": None, "end": None, "verification": "unmapped"},
                                              {**p, "numberingSystem": "hebrew"}]}]
        result, errors = audit.collect(works, self.ids, self.positions, "main-text")
        self.assertEqual(result, {"w": {1001001, 1001002}})
        self.assertEqual(len(errors), 2)
        exposition, _ = audit.collect(works, self.ids, self.positions, "substantial-exposition")
        self.assertEqual(exposition, {"w": set()})

    def test_parent_volume_availability_and_multiple_asset_copies(self):
        works = {"child": {"related": [{"relation": "is-part-of", "targetId": "parent"}]}, "parent": {"related": []}}
        assets = {"parent": [{"id": "pdf", "acquisitionStatus": "downloaded"}, {"id": "ocr", "acquisitionStatus": "downloaded"}]}
        self.assertEqual(audit.availability("child", works, assets), "downloaded-direct-or-parent")
        self.assertEqual(audit.availability("child", works, {}), "no-direct-or-parent-asset-record")

    def test_declared_complete_does_not_hide_duplicate_and_missing_series_units(self):
        s = {"id": "series-l04-test", "title": "Test", "completeness": "complete", "expectedCount": 3,
             "members": [{"workId": "a", "position": 1}, {"workId": "a", "position": 1}, {"workId": "absent", "position": 3}]}
        result = audit.audit_series([s], {"a": {}})[0]
        self.assertEqual(result["missingPositions"], [2])
        self.assertIn("duplicate work membership", result["problems"])
        self.assertIn("unresolved work IDs", result["problems"])

    def test_snapshot_partitions_every_canonical_verse(self):
        data = audit.read(audit.OUT / "book-coverage.json")["books"]
        summary = audit.read(audit.OUT / "summary.json")
        self.assertEqual(len(data), 66)
        self.assertEqual(sum(b["verseCount"] for b in data), 31102)
        self.assertEqual(sum(b["mainTextVerseCount"] for b in data), summary["assignedUniqueVerses"])
        for b in data:
            self.assertEqual(b["unitCount"], len(set(b["workIds"])))
            for c in b["chapters"]:
                expand = lambda rs: {v for start, end in rs for v in range(start, end + 1)}
                covered, missing = expand(c["mainTextRanges"]), expand(c["noMainTextRanges"])
                self.assertFalse(covered & missing)
                self.assertEqual(covered | missing, set(range(1, c["verseCount"] + 1)))


if __name__ == "__main__":
    unittest.main()
