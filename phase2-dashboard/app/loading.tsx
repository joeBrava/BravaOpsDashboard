import { Sidebar } from "@/components/sidebar";
import { SkeletonStat, SkeletonCard, SkeletonBlock } from "@/components/skeleton";

/**
 * Instant loading UI for the Pipeline route (`/`).
 *
 * Next 16 wraps `page.tsx` (and children) in a `<Suspense>` whose fallback is
 * this file while the async Server Component awaits `getSource().getProjects()`.
 * It renders the same app shell (sidebar + cream main) as the real page so the
 * swap-in is seamless — only the data regions are skeletons. The root layout
 * (and its CurrentUserProvider) is NOT replaced, so the sidebar profile slot
 * still resolves the signed-in user here.
 */
export default function PipelineLoading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />

      <main className="flex-1 bg-cream px-4 pb-[22px] pt-[72px] sm:px-[26px] lg:pt-[22px]">
        <div className="mb-5">
          <SkeletonBlock className="h-[1.6rem] w-56" />
          <SkeletonBlock className="mt-[7px] h-[0.7rem] w-40" />
        </div>

        <div className="mb-[22px] grid grid-cols-2 gap-[14px] lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>

        <SkeletonBlock className="mb-3 mt-1 h-[1rem] w-32" />

        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
