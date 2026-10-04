import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_content():
    data = {}
    for name in ("models", "products", "balance", "instructions", "workers", "tools"):
        data[name] = json.loads((ROOT / "content" / f"{name}.json").read_text(encoding="utf-8"))
    data["lesson"] = json.loads((ROOT / "lessons" / "lesson_01.json").read_text(encoding="utf-8"))
    return data
