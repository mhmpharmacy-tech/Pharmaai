"""Restore the pinned openFDA drug label snapshot in the PharmaAI checkout."""
import hashlib
import json
import os
import tempfile
from pathlib import Path
from urllib.request import urlopen
from shutil import copyfileobj

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "public/openfda/manifest.json"
ARCHIVES = ROOT / "data/openfda/archives"


def verified(path, part):
    if not path.is_file() or path.stat().st_size != part["bytes"]:
        return False
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest() == part["sha256"]


def main():
    ARCHIVES.mkdir(parents=True, exist_ok=True)
    for part in json.loads(MANIFEST.read_text())["partitions"]:
        target = ARCHIVES / part["file"].rsplit("/", 1)[1]
        if verified(target, part):
            continue
        with tempfile.NamedTemporaryFile(dir=ARCHIVES, delete=False) as output:
            tmp = Path(output.name)
        try:
            with urlopen(part["file"], timeout=120) as response, tmp.open("wb") as output:
                copyfileobj(response, output)
            if not verified(tmp, part):
                raise ValueError(f"Snapshot mismatch for {target.name}")
            os.replace(tmp, target)
        finally:
            tmp.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
