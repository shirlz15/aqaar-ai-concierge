"""PalmX-style compatibility wrapper for the Aqaar KB-Acq validator."""

from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "validate_dataset.mjs"


if __name__ == "__main__":
    try:
        raise SystemExit(subprocess.call(["node", str(SCRIPT)], cwd=ROOT.parent))
    except FileNotFoundError:
        print("Node.js is required to run the Aqaar KB-Acq validator.", file=sys.stderr)
        raise SystemExit(127)
