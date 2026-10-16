"""Exact parent reconstruction; explicit deferral of inconsistent native renders.

Unchanged source bytes are necessary but do not prove a stored derived rendering.
We never replace a pinned hash or accept approximate text to get past this gate.
"""
from ..section_contract import resolve_segment as parent_resolve,checked_bytes
from ..jobs import StaleInput

POLICY='kr130-exact-parent-or-native-render-deferral-v1'
SCHEMA='''
CREATE TABLE IF NOT EXISTS reconstruction_deferrals(
 run_id TEXT,document_id TEXT,version_id TEXT,coordinate TEXT,path TEXT,
 asset_sha256 TEXT,block_ordinal INTEGER,locator TEXT,expected_block_sha256 TEXT,
 reason TEXT,details_json TEXT,
 PRIMARY KEY(run_id,document_id,version_id,block_ordinal));
'''

class NativeRenderUnavailable(RuntimeError):
    def __init__(self,row,error):
        super().__init__(error);self.proof={'source_bytes_match':True,'expected_asset_sha256':row['asset_sha256'],'expected_block_sha256':row['block_text_sha256'],'coordinate':row['coordinate'],'reason':'pinned-native-render-does-not-reconstruct; raw source bytes unchanged; no approximate substitution','policy':POLICY}

def resolve_segment(row,prepared=None):
    try:return parent_resolve(row,prepared)
    except StaleInput as exc:
        if row['coordinate'] not in ('original-html-rendered','original-xml-rendered') or str(exc)!='Block text changed':raise
        # A genuinely changed original still raises StaleInput here and rejects
        # the job/generation. Only an unchanged original with a non-reproducible
        # historical derived render becomes an explicit representation deferral.
        checked_bytes(row['path'],row['asset_sha256'])
        raise NativeRenderUnavailable(row,str(exc)) from exc
