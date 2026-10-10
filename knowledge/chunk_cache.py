"""Content-addressed CPU preparation, outside the published corpus and vectors."""
import hashlib
import inspect
import json
import os
import tempfile
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def algorithm():
    from .store import chunk_parts, split_text, search_text
    return ''.join(inspect.getsource(fn) for fn in (chunk_parts, split_text, search_text))


def identity(config, text, locator):
    return hashlib.sha256(json.dumps([algorithm(), config['chunk_chars'], locator, text], ensure_ascii=False).encode()).hexdigest()


def path_for(config, text, locator):
    key = identity(config, text, locator)
    return config['state_dir'] / 'prepared-chunks' / key[:2] / (key + '.jsonl')


def prepared_parts(config, text, locator):
    from .store import chunk_parts
    # Avoid hashing old inputs when no preparation has ever run.
    root = config['state_dir'] / 'prepared-chunks'
    if root.exists():
        path = path_for(config, text, locator)
        if path.exists():
            try:
                with path.open(encoding='utf-8') as stream:
                    header = json.loads(next(stream))
                    rows = [json.loads(line) for line in stream]
                payload = ''.join(json.dumps(row, ensure_ascii=False) + '\n' for row in rows)
                if header == {'count': len(rows), 'sha256': hashlib.sha256(payload.encode()).hexdigest()} and all(len(row) == 3 and all(isinstance(x, str) for x in row) for row in rows):
                    yield from rows
                    return
            except (OSError, ValueError, StopIteration, TypeError):
                pass
    yield from chunk_parts(text, locator, config['chunk_chars'])


def prepare(config, text, locator):
    from .store import chunk_parts
    path = path_for(config, text, locator)
    if path.exists():
        return path, sum(1 for _ in prepared_parts(config, text, locator)), True
    rows = list(chunk_parts(text, locator, config['chunk_chars']))
    payload = ''.join(json.dumps(row, ensure_ascii=False) + '\n' for row in rows)
    header = {'count': len(rows), 'sha256': hashlib.sha256(payload.encode()).hexdigest()}
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(dir=path.parent, suffix='.tmp')
    temporary = Path(name)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as stream:
            stream.write(json.dumps(header) + '\n' + payload)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)
    return path, len(rows), False
