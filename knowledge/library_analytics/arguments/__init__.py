"""Private, pinned KR-130 argument extraction and located queries."""
import sys
from pathlib import Path

# Missing environment dependency is scoped to this workstream, never installed
# into or changed in another owner's interpreter/site-packages.
_dependencies=Path(__file__).resolve().parents[4]/'KnowledgeBase/library-knowledge/connected-research/arguments/dependencies'
if _dependencies.exists() and str(_dependencies) not in sys.path:sys.path.insert(0,str(_dependencies))
