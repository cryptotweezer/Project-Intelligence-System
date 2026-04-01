"use client";

import { useState } from "react";
import type { Project, ProjectStep, ProjectLog } from "@/lib/types";
import ProjectCard from "./ProjectCard";

type ProjectWithRelations = Project & {
  project_steps: ProjectStep[];
  project_logs: ProjectLog[];
};

export default function ProjectsList({ projects }: { projects: ProjectWithRelations[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          expanded={expandedId === project.id}
          dimmed={expandedId !== null && expandedId !== project.id}
          onToggle={() => setExpandedId((prev) => (prev === project.id ? null : project.id))}
        />
      ))}
    </div>
  );
}
