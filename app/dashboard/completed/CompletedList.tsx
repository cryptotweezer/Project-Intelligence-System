"use client";

import { useState } from "react";
import type { Project, ProjectStep, ProjectLog } from "@/lib/types";
import CompletedCard from "./CompletedCard";

type ProjectWithRelations = Project & {
  project_steps: ProjectStep[];
  project_logs: ProjectLog[];
};

export default function CompletedList({ projects }: { projects: ProjectWithRelations[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {projects.map((project) => (
        <CompletedCard
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
