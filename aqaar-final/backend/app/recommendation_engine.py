from .data_acquisition import load_knowledge_sources
from .knowledge_graph import profile_graph_context
from .schemas import ConciergeProfile, Recommendation


def generate_recommendations(profile: ConciergeProfile) -> list[Recommendation]:
    data = load_knowledge_sources()
    graph_context = profile_graph_context(profile)
    recommendations: list[Recommendation] = []
    for project in data["projects"]:
        keyword_text = " ".join(
            [
                project["project_name"],
                project["project_type"],
                project["location"],
                project["target_customer"],
                project["keywords"],
                project["investment_angle"],
            ]
        ).lower()
        score = 48
        reasons: list[str] = []
        if profile.project_name and profile.project_name == project["project_name"]:
            score += 30
            reasons.append("named project interest")
        if profile.location and profile.location.lower() in project["location"].lower():
            score += 20
            reasons.append("location match")
        if profile.property_type and profile.property_type.lower() in keyword_text:
            score += 15
            reasons.append("property type fit")
        if profile.investment_interest and any(word in keyword_text for word in ("investment", "rental", "roi", "yield", "capital")):
            score += 12
            reasons.append("investment alignment")
        if profile.intent == "commercial" and any(word in keyword_text for word in ("commercial", "office", "retail", "showroom")):
            score += 22
            reasons.append("commercial fit")
        if project["project_name"] in graph_context["projects"]:
            score += 8
            reasons.append("knowledge graph adjacency")

        signal = next((item for item in data["investment_signals"] if item["project_name"] == project["project_name"]), None)
        recommendations.append(
            Recommendation(
                project_name=project["project_name"],
                match_score=min(score, 99),
                why_recommended=project["description"],
                investment_potential=project["investment_angle"],
                estimated_roi=signal["roi_band"] if signal else "Advisor confirmation required",
                reasoning=reasons or ["general Aqaar fit"],
                project_type=project["project_type"],
                location=project["location"],
                sales_pitch=project["sales_pitch"],
            )
        )
    return sorted(recommendations, key=lambda item: item.match_score, reverse=True)[:3]
