"""Optional equivalent access-path indexes, installed only under both writer leases."""
from pathlib import Path
from .build import PROJECT
from .concept_index import root
from .jobs import JobStore

def main():
    shared=JobStore(Path(PROJECT)/'KnowledgeBase/library-analytics/pipeline/pipeline.sqlite3');store=None
    try:
        shared.acquire();store=JobStore(root()/'concepts.sqlite3');store.acquire()
        store.db.execute('CREATE INDEX IF NOT EXISTS reference_window ON reference_occurrences(window_id)')
        store.db.commit()
        print('Reference-to-window lookup index ready; facts and generation identities unchanged.')
    finally:
        if store:store.close()
        shared.close()
if __name__=='__main__':main()
