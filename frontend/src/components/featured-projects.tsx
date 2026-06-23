import { FeaturedProjectsClient } from "@/components/featured-projects-client";
import { getKnowledgeBase } from "@/lib/server/knowledge-base";

export function FeaturedProjects() {
  const knowledge = getKnowledgeBase();
  const projects = knowledge.projectsMaster.slice(0, 6);
  return <FeaturedProjectsClient projects={projects} />;
}
