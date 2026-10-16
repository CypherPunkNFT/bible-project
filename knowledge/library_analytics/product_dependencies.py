"""Check LA02's persisted input proofs before reusing its derived text facts."""
import hashlib
from pathlib import Path


def text_inputs(db,runs,fresh_hashes=False):
    proofs={};errors=[]
    for run in runs:
        for row in db.execute('SELECT path,sha256,size,mtime_ns FROM text_input_files WHERE run_id=?',(run,)):
            proof=dict(row);name=proof['path']
            if name in proofs and proofs[name]['sha256']!=proof['sha256']:errors.append('conflicting-LA02-file-proof:'+name)
            proofs[name]=proof
    for name,v in proofs.items():
        p=Path(name)
        if not p.is_file():errors.append('missing-LA02-input:'+name);continue
        stat=p.stat()
        if fresh_hashes:
            with p.open('rb') as stream:actual=hashlib.file_digest(stream,'sha256').hexdigest()
            if actual!=v['sha256']:errors.append('changed-LA02-input-hash:'+name)
        elif (stat.st_size,stat.st_mtime_ns)!=(v['size'],v['mtime_ns']):errors.append('changed-LA02-input-stat:'+name)
    return {'files':len(proofs),'fresh_hashes':fresh_hashes,'errors':errors}
