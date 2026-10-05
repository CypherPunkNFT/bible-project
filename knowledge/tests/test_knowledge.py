import json
import sqlite3
from pathlib import Path
import pytest
from knowledge.bibles import verse_bounds, runs_text
from knowledge.documents import TextContext
from knowledge.retrieval import fuse, fts_query, lexical, parse_reference, where
from knowledge.settings import load
from knowledge.store import SCHEMA, Writer, split_text, connect


@pytest.fixture
def corpus(tmp_path):
    db = connect(tmp_path / "test.sqlite3")
    db.executescript(SCHEMA)
    writer = Writer(db, {"chunk_chars": 1500})
    writer.document("kjv:jhn", "John — KJV", "bible", "test", "public domain", edition="kjv")
    writer.chunk("kjv:jhn", "John 3:16 KJV", "For God so loved the world, that he gave his only begotten Son.", "bible", edition="kjv", book="JHN", chapter=3, verse_start=16, verse_end=16)
    writer.document("cuv:jhn", "约翰福音", "bible", "test", "source attribution", language="zh", edition="cuv")
    writer.chunk("cuv:jhn", "John 3:16 CUV", "神爱世人，甚至将他的独生子赐给他们", "bible", language="zh", edition="cuv", book="JHN", chapter=3)
    writer.document("guide:faith", "Faith", "guide", "guide.json", "original")
    writer.chunk("guide:faith", "Justification by faith", "Read the passage in context.", "guide")
    db.execute("INSERT INTO chunks_fts(chunks_fts) VALUES('rebuild')")
    db.commit()
    yield db, writer
    db.close()


def test_unicode_and_phrase_search(corpus):
    db, _ = corpus
    assert lexical(db, '"God so loved"', 10, {})[0]["edition"] == "kjv"
    assert lexical(db, "神爱世人", 10, {"edition": "cuv"})[0]["language"] == "zh"
    assert not lexical(db, '"loved God so"', 10, {})
    assert not lexical(db, "world missingword", 10, {})
    assert not lexical(db, "神爱月球", 10, {"edition": "cuv"})


def test_filters_are_bound_and_cannot_escape(corpus):
    db, _ = corpus
    assert not lexical(db, "world", 10, {"edition": "kjv' OR 1=1 --"})
    assert not lexical(db, "world", 10, {"kind": "guide"})
    with pytest.raises(ValueError):
        where({"sql": "drop"})


@pytest.mark.parametrize("query", ['"', '" OR * NOT NEAR(', "' AND x", "{script}: [test]", '"God" "world"'])
def test_untrusted_search_is_literal_not_fts_syntax(corpus, query):
    lexical(corpus[0], query, 5, {})
    assert corpus[0].execute("SELECT COUNT(*) FROM chunks").fetchone()[0] == 3


def test_chunking_keeps_every_nonspace_character():
    text = "Before\n\n" + "神爱世人"*1000 + "\nAfter the text."
    chunks = list(split_text(text, 200))
    assert max(map(len, chunks)) <= 200
    assert "".join("".join(chunks).split()) == "".join(text.split())


def test_text_changes_make_new_vector_identity(corpus):
    db, writer = corpus
    writer.chunk("guide:faith", "Same heading", "An earlier assertion.", "guide", locator="section1")
    first = db.execute("SELECT id FROM chunks ORDER BY rowid DESC LIMIT 1").fetchone()[0]
    writer.chunk("guide:faith", "Same heading", "A corrected assertion.", "guide", locator="section1")
    second = db.execute("SELECT id FROM chunks ORDER BY rowid DESC LIMIT 1").fetchone()[0]
    assert first != second


def test_joined_verses_and_footnotes_remain_distinct():
    assert verse_bounds("29-30") == (29,30)
    assert verse_bounds("0") == (0,0)
    assert runs_text([{"b":"p"},"In the ",["beginning","","H7225"],{"f":"a translator note"},"."]) == "In the beginning."


def test_people_reference_lists_are_not_treated_as_ranges():
    context = TextContext({"books": []})
    assert list(context.refs({"refs":[1001001,5003002]})) == [(1001001,1001001),(5003002,5003002)]
    assert list(context.refs({"refs":[[1001001,1001005]]})) == [(1001001,1001005)]
    assert list(context.refs({"anchor":[1001001,1001005]})) == [(1001001,1001005)]
    assert context.text([1001001,5003002], "refs") == "1001001; 5003002"
    assert context.text([[1001001,1001005]], "refs") == "1001001 – 1001005"


def test_query_rejects_vectors_from_another_model(tmp_path):
    from knowledge.vectors import validate_identity
    config = {"state_dir": tmp_path, "embedding": {"model":"model-a", "revision":"revision-a", "dimensions":3, "max_tokens":4096}}
    with pytest.raises(RuntimeError, match="identity"):
        validate_identity(config)
    (tmp_path / "embedding-model.json").write_text(json.dumps(config["embedding"]), encoding="utf-8")
    validate_identity(config)
    config["embedding"]["revision"] = "revision-b"
    with pytest.raises(RuntimeError, match="identity"):
        validate_identity(config)


def test_explicit_authored_citation_becomes_a_verse_link():
    context = TextContext({"books": [{"num":43, "name":"John", "code":"JHN"}]})
    assert list(context.refs({"citations":[{"kind":"scripture", "reference":"John 3:16-18"}]})) == [(43003016,43003018)]
    assert not list(context.refs({"text":"John 3:16-18"}))


def test_reference_lookup_preserves_book_and_range():
    catalog={"books":[{"name":"John","code":"JHN","num":43},{"name":"1 John","code":"1JN","num":62}]}
    assert parse_reference("1 John 3:16-18",catalog)[0]["code"] == "1JN"
    assert parse_reference("JHN 3:16-4:2",catalog)[1:] == (3,16,4,2)
    with pytest.raises(ValueError):
        parse_reference("John 3:18-16",catalog)


def test_fusion_rewards_agreement_without_confidence_claims():
    result=fuse({"lexical":[{"id":"a"},{"id":"b"}],"semantic":[{"id":"b"},{"id":"c"}]})
    assert result[0]["id"] == "b"
    assert result[0]["methods"] == ["lexical","semantic"]
    assert "confidence" not in result[0]


def test_storage_rejects_shared_knowledge_base(tmp_path):
    cfg=json.loads((Path(__file__).parents[1]/"config.json").read_text("utf-8"))
    cfg["state_dir"]="D:/KnowledgeBase-Vector"
    file=tmp_path/"config.json"
    file.write_text(json.dumps(cfg),encoding="utf-8")
    with pytest.raises(ValueError,match="dedicated"):
        load(file)
