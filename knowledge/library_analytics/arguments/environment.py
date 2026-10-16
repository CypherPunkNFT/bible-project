"""Exact runtime/package versions, without credentials or environment dumps."""
import sys,sqlite3,platform,importlib.metadata
from .inputs import ROOT,write_json
def main():
    versions={}
    for name in ['lxml','beautifulsoup4','psutil','typing_extensions']:
        try:versions[name]=importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError:versions[name]=None
    value={'python_executable':sys.executable,'python_version':sys.version,'sqlite_version':sqlite3.sqlite_version,'platform':platform.platform(),'packages':versions,'dependencies':'Python stdlib/SQLite FTS5; existing hash-bound XML/HTML/cache adapters; psutil only for resource receipts; no model/vector service.'};write_json(ROOT/'environment.json',value);print(value)
if __name__=='__main__':main()
