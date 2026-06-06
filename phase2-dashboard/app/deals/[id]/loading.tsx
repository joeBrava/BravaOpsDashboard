import { Sidebar } from "@/components/sidebar";
import { SkeletonCard, SkeletonBlock } from "@/components/skeleton";

/**
 * Instant loading UI for the deal-detail route (`/deals/[id]`).
 *
 * Fallback shown while the async Server Component awaits
 * `getSource().getProject(id)`. Mirrors the detail layout: breadcrumb, header +
 * status pill, and the two-column timeline / metadata grid.
 */
export default function DealDetailLoading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />

      <main className="flex-1 bg-cream px-4 pb-[22px] pt-[72px] sm:px-[26px] lg:pt-[22px]">
        <SkeletonBlock className="mb-3 h-[0.8rem] w-32" />

        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-[11px]">
              <SkeletonBlock className="h-[1.6rem] w-52" />
              <SkeletonBlock className="h-[1.4rem] w-24 rounded-full" />
            </div>
            <SkeletonBlock className="mt-[7px] h-[0.7rem] w-44" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-[18px]">
            <section className="rounded-[15px] border border-[#eee8df] bg-white px-[18px] py-[16px]">
              <SkeletonBlock className="mb-3 h-[1rem] w-40" />
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-[0.8rem] w-full" />
                ))}
              </div>
            </section>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[18px]">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </main>
    </div>
  );
}
