"""Enforce the owner's authorization for embedding the current snapshot only."""
import os


PENDING = 'embedded_pending_verification'


def embedding_only():
    return os.environ.get('BIBLE_EMBED_ONLY') == '1'


def require_snapshot(corpus_build):
    if embedding_only() and corpus_build != os.environ.get('BIBLE_EMBED_CORPUS_BUILD'):
        raise RuntimeError('Embedding-only authorization does not match this corpus snapshot')


def require_preservation(stale):
    if embedding_only() and stale:
        raise RuntimeError('Embedding-only resume refuses to remove existing vectors; reconciliation requires review')
