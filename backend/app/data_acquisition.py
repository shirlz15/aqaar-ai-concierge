import csv
import json
from functools import lru_cache
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]


def _read_csv(relative_path: str) -> list[dict[str, str]]:
    with (ROOT / relative_path).open(newline="", encoding="utf-8") as file:
        return [dict(row) for row in csv.DictReader(file)]


def _read_json(relative_path: str) -> Any:
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


@lru_cache
def load_knowledge_sources() -> dict[str, Any]:
    return {
        "projects": _read_csv("csv/projects_master.csv"),
        "project_inventory": _read_csv("csv/projects.csv"),
        "locations": _read_csv("csv/locations.csv"),
        "property_types": _read_csv("csv/property_types.csv"),
        "amenities": _read_csv("csv/amenities.csv"),
        "investment_signals": _read_csv("csv/investment_signals.csv"),
        "buyer_personas": _read_csv("csv/buyer_personas.csv"),
        "faqs": _read_csv("csv/faqs.csv"),
        "sales_language": _read_json("data/sales_language.json"),
        "conversation_flows": _read_json("data/conversation_flows.json"),
    }


def source_health() -> dict[str, int]:
    sources = load_knowledge_sources()
    return {
        key: len(value)
        for key, value in sources.items()
        if isinstance(value, list)
    }
