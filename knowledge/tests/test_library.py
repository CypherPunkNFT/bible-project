import json
import zipfile
import pytest
from knowledge.library import import_library, plan_library, safe_path
from knowledge.library_extract import decode, derivative_blocks, extract, extraction_cache, sha256, xml_text
from knowledge.store import SCHEMA, Writer, connect, split_text


@pytest.fixture
def cfg(tmp_path):
    value = {"site_dir": tmp_path / "Website", "sources_dir": tmp_path / "sources", "state_dir": tmp_path / "KnowledgeBase", "chunk_chars": 1500}
    for path in (value["site_dir"] / "content/library/catalog", value["site_dir"] / "content/library/reports", value["sources_dir"] / "library", value["state_dir"]):
        path.mkdir(parents=True)
    return value


def test_decoding_does_not_misread_legacy_english_as_utf16():
    assert decode(b"Faith \x97 hope") == "Faith — hope"
    assert decode("Grace".encode("utf-16")) == "Grace"


def test_xml_words_gaps_and_external_entities():
    text = xml_text(b'<DOC><LINE><WORD>grace</WORD><WORD>alone</WORD></LINE><p>faith<gap reason="illegible"/></p></DOC>')
    assert "grace alone" in text and "Editorial gap: illegible" in text
    assert "secret" not in xml_text(b'<!DOCTYPE root [<!ENTITY ext SYSTEM "file:///missing-secret">]><root>body &ext;</root>')


def test_pdf_pages_and_repaired_derivative_markers(tmp_path):
    import fitz
    pdf = tmp_path / "book.pdf"
    with fitz.open() as doc:
        for text in ("First page grace", "Second page hope"):
            page = doc.new_page()
            page.insert_text((70, 70), text)
        doc.save(pdf)
    blocks = list(extract(pdf))
    assert [x["page"] for x in blocks] == [1, 2]
    assert "hope" in blocks[1]["text"]
    text = tmp_path / "repaired.txt"
    text.write_text("===== PDF PAGE 1 =====\nRepaired grace\n--- PDF PAGE 2 ---\nHope", encoding="utf-8")
    fixed = list(derivative_blocks(text, {}))
    assert [x["locator"] for x in fixed] == ["PDF page 1", "PDF page 2"]
    assert "Repaired grace" in fixed[0]["text"]


def test_epub_spine_order_and_nonspine_notes(tmp_path):
    path = tmp_path / "book.epub"
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("META-INF/container.xml", '<container><rootfile full-path="OEBPS/book.opf"/></container>')
        archive.writestr("OEBPS/book.opf", '<package><manifest><item id="b" href="b.html" media-type="text/html"/><item id="a" href="a.html" media-type="text/html"/><item id="n" href="notes.html" media-type="text/html"/></manifest><spine><itemref idref="a"/><itemref idref="b"/></spine></package>')
        for name in ("a", "b", "notes"):
            archive.writestr(f"OEBPS/{name}.html", f"<html><body>{name}</body></html>")
    assert [x["text"] for x in extract(path)] == ["a", "b", "notes"]


def test_intake_deduplicates_without_losing_sources_or_review_status(cfg):
    raw = cfg["sources_dir"] / "library"
    for name in ("one.txt", "two.txt"):
        (raw / name).write_text("A complete substantial source about grace\u2028and faith.\u0085Hope remains.", encoding="utf-8")
    report = cfg["site_dir"] / "content/library/reports/acquired.json"
    report.write_text(json.dumps({"title": "Historic book", "quality": {"publisherAiDisclosure": True}, "asset": {"relativePath": "library/one.txt", "sha256": sha256(raw / "one.txt")}}), encoding="utf-8")
    db = connect(cfg["state_dir"] / "test.sqlite3")
    db.executescript(SCHEMA)
    result = import_library(Writer(db, cfg))
    assert result["statuses"] == {"indexed": 1, "duplicate": 1}
    assert db.execute("SELECT kind FROM documents").fetchone()[0] == "library_review"
    assert db.execute("SELECT COUNT(DISTINCT document_id) FROM library_files").fetchone()[0] == 1
    assert db.execute("SELECT COUNT(*) FROM library_reports").fetchone()[0] == 1
    assert "faith" in db.execute("SELECT text FROM chunks").fetchone()[0]
    db.close()


def test_paths_and_derivative_checksums(cfg):
    assert safe_path(cfg, "../../outside.txt") is None
    raw = cfg["sources_dir"] / "library/book.txt"
    raw.write_text("original", encoding="utf-8")
    with pytest.raises(ValueError, match="checksum"):
        extraction_cache(cfg, raw, sha256(raw), derivative={"path": str(raw), "sha256": "wrong"})


def test_legacy_evidence_flag_does_not_block_authorized_private_text(cfg):
    raw = cfg['sources_dir'] / 'library/book.txt'
    raw.write_text('Complete lawful historical text about prayer and faith.', encoding='utf-8')
    record = {'files': [{'relativePath': 'library/book.txt', 'sha256': sha256(raw),
                         'title': 'Prayer', 'author': 'Historical author',
                         'evidenceOnly': True, 'publicHostingAllowed': False}]}
    (cfg['site_dir'] / 'content/library/reports/legacy.json').write_text(json.dumps(record))
    db = connect(cfg['state_dir'] / 'test.sqlite3')
    db.executescript(SCHEMA)
    result = import_library(Writer(db, cfg))
    assert result['statuses'] == {'indexed': 1}
    row = db.execute('SELECT metadata FROM library_files').fetchone()
    metadata = json.loads(row[0])
    assert metadata['acquisition']['author'] == 'Historical author'
    assert metadata['public_publication'] is False
    assert db.execute('SELECT text FROM chunks').fetchone()[0].startswith('Complete lawful')
    db.close()


def test_module_archive_indexes_offered_export_not_archive_bytes(cfg):
    raw = cfg['sources_dir'] / 'library/module.zip'
    raw.write_bytes(b'compressed module fixture')
    (raw.parent / 'download.part').write_bytes(b'unfinished download')
    derivative = cfg['site_dir'] / '.local/library/module.txt'
    derivative.parent.mkdir(parents=True)
    derivative.write_text('Complete module exposition about grace and faith.', encoding='utf-8')
    record = {'files': [{'relativePath': 'library/module.zip', 'sha256': sha256(raw),
                         'title': 'Module', 'format': 'zip', 'derivedText':
                         {'path': '.local/library/module.txt', 'sha256': sha256(derivative)}}]}
    (cfg['site_dir'] / 'content/library/reports/module.json').write_text(json.dumps(record))
    db = connect(cfg['state_dir'] / 'test.sqlite3')
    db.executescript(SCHEMA)
    result = import_library(Writer(db, cfg))
    assert result['statuses'] == {'indexed': 1}
    assert result['files'] == 1
    assert db.execute('SELECT text FROM chunks').fetchone()[0].startswith('Complete module exposition')
    db.close()


def test_large_book_chunking_preserves_existing_vector_id_boundaries():
    # Compare with the original slice-based behavior so prior vectors remain reusable.
    def original(text, limit):
        text = text.strip()
        while text:
            end = min(len(text), limit)
            if end < len(text):
                split = max(text.rfind("\n", end // 2, end), text.rfind(" ", end // 2, end))
                if split > 0:
                    end = split
            yield text[:end].strip()
            text = text[end:].lstrip()
    for body in ("grace\n\nfaith and hope\u2028" * 1000, "中文字" * 1000, "word" * 1000, " \t  a \n b\u0085c  "):
        assert list(split_text(body, 73)) == list(original(body, 73))


def test_repair_follows_exact_source_alias_but_not_a_different_edition(cfg):
    raw = cfg["sources_dir"] / "library"
    for name, data in (("a.pdf", b"source"), ("b.pdf", b"source"), ("c.pdf", b"different edition")):
        file = raw / name
        file.write_bytes(data)
        record = {"id": name, "kind": "asset", "relativePath": "library/" + name, "sha256": sha256(file)}
        (cfg["site_dir"] / "content/library/catalog" / (name + ".json")).write_text(json.dumps(record))
    derivative = cfg["site_dir"] / ".local/library/fixed.txt"
    derivative.parent.mkdir(parents=True)
    derivative.write_text("--- PDF PAGE 1 ---\nRepaired text", encoding="utf-8")
    reports = cfg["site_dir"] / "content/library/reports/ocr-completion"
    reports.mkdir()
    (reports / "font-repair.json").write_text(json.dumps({"sourceRelativePath": "library/a.pdf", "sourceSha256": sha256(raw / "a.pdf"), "derivedText": ".local/library/fixed.txt", "derivedSha256": sha256(derivative)}))
    _, _, _, derivatives, _ = plan_library(cfg)
    assert derivatives[str(raw / "a.pdf")] == derivatives[str(raw / "b.pdf")]
    assert str(raw / "c.pdf") not in derivatives


def test_original_checksum_failure_is_accounted_without_indexing_body(cfg):
    raw = cfg["sources_dir"] / "library/book.txt"
    raw.write_text("Source text", encoding="utf-8")
    record = {"id": "asset-book", "kind": "asset", "relativePath": "library/book.txt", "sha256": "wrong"}
    (cfg["site_dir"] / "content/library/catalog/asset.json").write_text(json.dumps(record))
    db = connect(cfg["state_dir"] / "test.sqlite3")
    db.executescript(SCHEMA)
    report = import_library(Writer(db, cfg))
    assert report["statuses"] == {"error": 1}
    assert db.execute("SELECT COUNT(*) FROM chunks").fetchone()[0] == 0
    assert raw.read_text("utf-8") == "Source text"
    db.close()


def test_large_multilingual_vector_write_batches_respect_encoder_payload_limit(monkeypatch):
    import io
    from knowledge.encoder import request_vectors
    config = {"embedding": {"daemon_url": "http://127.0.0.1:8936", "model": "fixture", "revision": "1", "dimensions": 2}}
    seen = []
    def response(request, timeout):
        assert len(request.data) <= 262144
        body = json.loads(request.data)
        seen.extend(body["texts"])
        return io.BytesIO(json.dumps({"model": "fixture", "revision": "1", "dimensions": 2, "vectors": [[1, 0] for _ in body["texts"]]}).encode())
    monkeypatch.setattr("knowledge.encoder.urllib.request.urlopen", response)
    texts = [str(i) + "恩" * 1500 for i in range(64)]
    assert len(request_vectors(config, texts)) == 64
    assert seen == texts


def test_gpu_wait_retries_same_passages_but_data_errors_fail(monkeypatch):
    from knowledge.encoder import GPUUnavailable
    from knowledge.vectors import encode_when_available
    attempts, waits, sleeps = [], [], []
    def encode(config, texts):
        attempts.append(list(texts))
        if len(attempts) == 1:
            raise GPUUnavailable("GPU occupied")
        return [[1, 0]]
    monkeypatch.setattr("knowledge.vectors.request_vectors", encode)
    monkeypatch.setattr("knowledge.vectors.time.sleep", sleeps.append)
    assert encode_when_available({}, ["complete source passage"], waits.append) == [[1, 0]]
    assert attempts == [["complete source passage"], ["complete source passage"]]
    assert waits == ["GPU occupied"] and sleeps == [30]
    def invalid(config, texts):
        raise ValueError("Embedding model identity mismatch")
    monkeypatch.setattr("knowledge.vectors.request_vectors", invalid)
    with pytest.raises(ValueError, match="identity"):
        encode_when_available({}, ["source"], waits.append)


def test_encoder_resource_errors_are_distinct_from_bad_input(monkeypatch):
    import io
    import urllib.error
    from knowledge.encoder import GPUUnavailable, request_vectors
    config = {"embedding": {"daemon_url": "http://127.0.0.1:8936"}}
    def busy(request, timeout):
        raise urllib.error.HTTPError(request.full_url, 503, "busy", {}, io.BytesIO(b'{"code":"gpu_busy","error":"GPU occupied"}'))
    monkeypatch.setattr("knowledge.encoder.urllib.request.urlopen", busy)
    with pytest.raises(GPUUnavailable):
        request_vectors(config, ["source"])
    def invalid(request, timeout):
        raise urllib.error.HTTPError(request.full_url, 503, "bad", {}, io.BytesIO(b'{"code":"embedding_failed","error":"Invalid model"}'))
    monkeypatch.setattr("knowledge.encoder.urllib.request.urlopen", invalid)
    with pytest.raises(RuntimeError) as error:
        request_vectors(config, ["source"])
    assert not isinstance(error.value, GPUUnavailable)
