"""Put every chapter folder on sys.path so tests can `import <module>` directly.
Module names are unique across chapters, so running everything at once works too."""
import sys
from pathlib import Path

ROOT = Path(__file__).parent
for d in sorted(ROOT.glob("[0-9][0-9]-*")):
    sys.path.insert(0, str(d))
