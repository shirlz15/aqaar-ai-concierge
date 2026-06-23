from collections import Counter

from .data_acquisition import load_knowledge_sources, source_health
from .schemas import DashboardAnalytics


def build_dashboard_analytics() -> DashboardAnalytics:
    data = load_knowledge_sources()
    project_counter = Counter(row["project_name"] for row in data["investment_signals"])
    location_counter = Counter(row["location"] for row in data["investment_signals"])
    persona_counter = Counter(row["persona"] for row in data["buyer_personas"])
    hot_signal_count = sum(1 for row in data["investment_signals"] if row["signal_strength"] == "very_high")
    return DashboardAnalytics(
        total_seed_leads=len(data["faqs"]) + len(data["buyer_personas"]),
        hot_signal_count=hot_signal_count,
        project_interest=dict(project_counter.most_common(8)),
        location_interest=dict(location_counter.most_common(8)),
        persona_distribution=dict(persona_counter.most_common(8)),
        source_health=source_health(),
    )
