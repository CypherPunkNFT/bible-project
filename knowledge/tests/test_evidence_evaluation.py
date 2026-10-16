import pytest

from knowledge.evidence_collections.contract import sha256_file
from knowledge.evidence_collections.evaluate import evaluate
from knowledge.settings import write_json


@pytest.fixture
def evaluated(tmp_path):
    rows=[];pool=[];judgments=[]
    for i in range(20):
        key=f'H{i+1:02}'
        rows.append(dict(id=key,query='fixture',lexical=dict(results=[dict(chunkId='b'),dict(chunkId='a')],seconds=.01),hybrid=dict(results=[dict(chunkId='a'),dict(chunkId='b')],seconds=.02)))
        pool.append(dict(id=key,candidates=[dict(chunkId='a'),dict(chunkId='b')]))
        judgments.append(dict(id=key,note='fixture',candidates=[dict(chunkId='a',useful=True),dict(chunkId='b',useful=False)]))
    write_json(tmp_path/'questions.frozen.json',dict(heldOut=[dict(id=r['id']) for r in rows]))
    write_json(tmp_path/'evaluation-freeze.json',dict(questionsSha256='questions',queryVectorsSha256='queries',implementationSha256='implementation'))
    write_json(tmp_path/'heldOut-results.json',dict(questionsSha256='questions',queryVectorsSha256='queries',implementationSha256='implementation',results=rows))
    write_json(tmp_path/'review-pool.json',pool)
    write_json(tmp_path/'judgments.json',dict(reviewKind='ai-assisted',scope='fixture',poolSha256=sha256_file(tmp_path/'review-pool.json'),resultsSha256=sha256_file(tmp_path/'heldOut-results.json'),judgments=judgments))
    return tmp_path


def test_score_math_and_release_gate(evaluated):
    result=evaluate(evaluated)
    assert result['metrics']['lexical']['mrrAt5']==.5
    assert result['metrics']['hybrid']['mrrAt5']==1
    assert result['metrics']['hybrid']['usefulTopFive']==20
    assert result['proposedReleaseGate']['met']


def test_stale_result_cannot_reuse_judgments(evaluated):
    (evaluated/'heldOut-results.json').write_text('{}')
    with pytest.raises(ValueError,match='no longer match'):evaluate(evaluated)
