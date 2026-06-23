from dataclasses import dataclass

from .data_acquisition import load_knowledge_sources
from .schemas import ConciergeProfile


@dataclass(frozen=True)
class GraphEdge:
    source_type: str
    source: str
    relation: str
    target_type: str
    target: str
    confidence: float


def build_graph_edges() -> list[GraphEdge]:
    data = load_knowledge_sources()
    edges: list[GraphEdge] = []
    for project in data["projects"]:
        project_name = project["project_name"]
        location = project["location"]
        project_type = project["project_type"]
        edges.append(GraphEdge("PropertyType", project_type, "AVAILABLE_IN", "Project", project_name, 0.86))
        edges.append(GraphEdge("Project", project_name, "LOCATED_IN", "Location", location, 0.92))
        edges.append(GraphEdge("Project", project_name, "TARGETS", "Persona", project["target_customer"], 0.78))
    for signal in data["investment_signals"]:
        edges.append(
            GraphEdge(
                "Location",
                signal["location"],
                "HAS_INVESTMENT_SIGNAL",
                "InvestmentPotential",
                signal["signal_type"],
                0.72,
            )
        )
    return edges


def profile_graph_context(profile: ConciergeProfile) -> dict[str, list[str]]:
    data = load_knowledge_sources()
    related_projects = []
    related_signals = []
    related_locations = []
    for project in data["projects"]:
        if profile.location and profile.location.lower() in project["location"].lower():
            related_projects.append(project["project_name"])
            related_locations.append(project["location"])
        if profile.property_type and profile.property_type.lower() in project["project_type"].lower():
            related_projects.append(project["project_name"])
    for signal in data["investment_signals"]:
        if signal["project_name"] in related_projects or (profile.location and profile.location.lower() in signal["location"].lower()):
            related_signals.append(f"{signal['signal_type']}:{signal['signal_strength']}")
    return {
        "projects": sorted(set(related_projects)),
        "locations": sorted(set(related_locations)),
        "investment_signals": sorted(set(related_signals))[:10],
    }
