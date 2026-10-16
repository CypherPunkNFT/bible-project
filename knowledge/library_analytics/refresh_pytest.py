"""Existing pytest suites with real dependencies from the owned directory."""
from .refresh_environment import bootstrap
bootstrap()
import pytest
if __name__=='__main__':raise SystemExit(pytest.main())
