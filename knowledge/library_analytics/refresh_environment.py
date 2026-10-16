"""Private pinned dependencies; shared Python installations are untouched."""
import sys
from pathlib import Path
from .build import PROJECT

DEPENDENCIES=Path(PROJECT)/'KnowledgeBase/library-knowledge/connected-research/refresh/python-dependencies'

def bootstrap():
    if DEPENDENCIES.is_dir() and str(DEPENDENCIES) not in sys.path:sys.path.insert(0,str(DEPENDENCIES))

bootstrap()
