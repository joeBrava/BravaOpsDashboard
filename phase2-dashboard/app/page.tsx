import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { OwnerFilterToggle } from "@/components/owner-filter-toggle";
import { UpdateToast } from "@/components/update-toast";
import { getSource } from "@/lib/data/source";
import { summary, recentUpdate } from "@/lib/mock-data";

export default async function PipelinePage() {
  // Project rows are read through the DashboardSource adapter (fixture today,
  // live later) so flipping data sources is a single env change. The summary
  // aggregates + recentUpdate banner remain derived presentation data.
  //
  // All projects are fetched on the server and handed to the client-side
  // OwnerFilterToggle, which defaults to the signed-in user's own pipeline with
  // a visible "All team" toggle (privacy waived per the design spec).
  const projects = await getSource().getProjects();

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

        <OwnerFilterToggle projects={projects} />

        <UpdateToast message={recentUpdate} />
      </main>
    </div>
  );
}
