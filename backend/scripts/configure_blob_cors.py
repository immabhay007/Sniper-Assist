#!/usr/bin/env python3
"""Apply allow-all-origins CORS on the Azure Blob Storage account (run once)."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.initialize_environment import load_environment
from app.services.blob_storage import configure_blob_cors_allow_all


def main() -> None:
    load_environment()
    configure_blob_cors_allow_all()
    print("Azure Blob Storage CORS updated: allowed_origins=* (GET, HEAD, OPTIONS)")


if __name__ == "__main__":
    main()
