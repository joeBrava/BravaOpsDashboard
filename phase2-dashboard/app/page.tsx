import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { FilterChips } from "@/components/filter-chips";
import { ProjectCard } from "@/components/project-card";
import { UpdateToast } from "@/components/update-toast";
import { projects, summary, recentUpdate } from "@/lib/mock-data";

const PRODUCTION_FILTERS = ["All", "On track", "At risk", "Shipping"] as const;

export default function PipelinePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />

      <main className="flex-1 bg-cream px-[26px] py-[22px]">
        <Topbar
          title="Production Pipeline"
          sub={`Tuesday, June 2 · ${summary.inProduction} in production`}
        />

        <div className="mb-[22px] grid grid-cols-4 gap-[14px]">
          <StatCard
            value={String(summary.inProduction)}
            label="In production"
            icon="▦"
            iconClass="bg-[#efe7fb] text-purple"
          />
          <StatCard
            value={String(summary.onTrack)}
            label="On track"
            icon="↑"
            iconClass="bg-[#f1f5ce] text-[#7c8a00]"
          />
          <StatCard
            value={String(summary.needsAttention)}
            label="Needs attention"
            icon="!"
            iconClass="bg-[#ffe1e5] text-[#c20f2b]"
          />
          <StatCard
            value={String(summary.shipping)}
            label="Shipping"
            icon="→"
            iconClass="bg-[#d7f4f2] text-[#00726e]"
          />
        </div>

        <div className="mb-3 mt-1 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-ink">
            In production
          </h3>
          <FilterChips filters={PRODUCTION_FILTERS} />
        </div>

        <div className="flex flex-col gap-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>

        <UpdateToast message={recentUpdate} />
      </main>
    </div>
  );
}
