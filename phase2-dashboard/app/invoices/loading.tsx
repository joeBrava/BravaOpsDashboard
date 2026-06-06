import { Sidebar } from "@/components/sidebar";
import { SkeletonStat, SkeletonCard, SkeletonBlock } from "@/components/skeleton";

/**
 * Instant loading UI for the Invoices route (`/invoices`).
 *
 * Fallback shown while the async Server Component awaits the invoices +
 * projects fetch through `getSource()`. Mirrors the real page's 3-stat row and
 * invoice list so the layout doesn't shift when data streams in.
 */
export default function InvoicesLoading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />

      <main className="flex-1 bg-cream px-4 pb-[22px] pt-[72px] sm:px-[26px] lg:pt-[22px]">
        <div className="mb-5">
          <SkeletonBlock className="h-[1.6rem] w-40" />
          <SkeletonBlock className="mt-[7px] h-[0.7rem] w-44" />
        </div>

        <div className="mb-[22px] grid grid-cols-1 gap-[14px] sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>

        <SkeletonBlock className="mb-3 mt-1 h-[1rem] w-28" />

        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
