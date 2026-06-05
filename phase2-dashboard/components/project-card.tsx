import Link from "next/link";
import { getProjectStatusMeta } from "@/lib/project-status";
import { dealHref } from "@/lib/deal-link";
import type { Project } from "@/lib/types";
import { StageChips } from "./stage-chips";
import { StatusPill } from "./status-pill";

interface ProjectCardProps {
  project: Project;
}

// The whole card links to the deal-detail page. The trailing action is a
// styled <span> (not a <button>) so there are no interactive descendants nested
// inside the <Link>'s <a> — valid HTML and the entire row is one click target.
export function ProjectCard({ project }: ProjectCardProps) {
  const meta = getProjectStatusMeta(project.status);
  const needsAction =
    project.status === "blocked" || project.status === "at_risk";
  const context = project.blocker
    ? project.blocker
    : [project.note, project.nextStep].filter(Boolean).join(" — ");

  return (
    <Link
      href={dealHref(project.id)}
      className={`flex items-center gap-[18px] rounded-[15px] border-l-[5px] bg-white px-[18px] py-4 shadow-[0_4px_14px_rgba(50,35,80,0.05)] transition-shadow hover:shadow-[0_6px_18px_rgba(50,35,80,0.1)] ${meta.edgeClass}`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-[9px] flex items-center gap-[11px]">
          <span className="font-display text-[1.02rem] font-bold text-ink">
            {project.name}
          </span>
          <StatusPill
            label={meta.label}
            pillClass={meta.pillClass}
            dotClass={meta.dotClass}
          />
        </div>
        <div className="flex flex-wrap items-center gap-[15px]">
          <StageChips stages={project.stages} />
          {context && (
            <span className="text-[0.78rem] font-medium text-gray-mid">
              · {context}
            </span>
          )}
        </div>
      </div>
      <span
        className={`flex-none whitespace-nowrap rounded-[10px] px-4 py-[9px] font-display text-[0.8rem] font-semibold ${
          needsAction
            ? "bg-purple text-white"
            : "border-[1.5px] border-[#ebe6dd] bg-white text-purple"
        }`}
      >
        {needsAction ? "Follow up" : "View"}
      </span>
    </Link>
  );
}
