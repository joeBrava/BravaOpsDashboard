"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { useCurrentUser } from "./current-user-provider";
import { ProjectCard } from "./project-card";
import {
  DEFAULT_OWNER_VIEW,
  countOwned,
  filterProjectsByOwner,
  type OwnerView,
} from "@/lib/owner-filter";

/**
 * Pipeline owner filter (client component).
 *
 * The page renders *all* projects on the server and hands them here; this
 * component owns the interactive "Mine / All team" toggle and filters the list
 * client-side. It reads the signed-in user from `useCurrentUser()` (resolved on
 * the server in the root layout and shared via context, or the dev stub when
 * `AUTH_DISABLED=true`).
 *
 * Default scope is the signed-in user's own projects (`DEFAULT_OWNER_VIEW =
 * "mine"`); "All team" reveals everyone (privacy is waived per the design
 * spec). When the user owns nothing under "Mine", a friendly empty state nudges
 * them to "All team" rather than showing a blank board.
 */
export function OwnerFilterToggle({ projects }: { projects: Project[] }) {
  const user = useCurrentUser();
  const [view, setView] = useState<OwnerView>(DEFAULT_OWNER_VIEW);

  const mineCount = countOwned(projects, user);
  const visible = filterProjectsByOwner(projects, view, user);

  return (
    <>
      <div className="mb-3 mt-1 flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-ink">
          {view === "mine" ? "My pipeline" : "In production"}
        </h3>
        <div
          role="group"
          aria-label="Filter by owner"
          className="flex gap-[7px]"
        >
          <ToggleChip
            active={view === "mine"}
            onClick={() => setView("mine")}
          >
            Mine ({mineCount})
          </ToggleChip>
          <ToggleChip active={view === "all"} onClick={() => setView("all")}>
            All team
          </ToggleChip>
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="flex flex-col gap-3">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-[15px] border border-dashed border-[#ebe6dd] bg-white px-[18px] py-8 text-center text-[0.85rem] font-medium text-gray-mid">
          {view === "mine"
            ? "No projects assigned to you right now. Switch to "
            : "No projects to show. "}
          {view === "mine" && (
            <button
              type="button"
              onClick={() => setView("all")}
              className="font-semibold text-purple underline underline-offset-2"
            >
              All team
            </button>
          )}
          {view === "mine" ? " to see the whole board." : ""}
        </div>
      )}
    </>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-[5px] font-display text-[0.74rem] font-semibold ${
        active
          ? "border border-purple bg-purple text-white"
          : "border border-[#ebe6dd] bg-white text-gray-dark"
      }`}
    >
      {children}
    </button>
  );
}
