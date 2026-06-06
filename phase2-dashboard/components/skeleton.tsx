/**
 * Skeleton primitives for route-level `loading.tsx` fallbacks.
 *
 * These are server components (no interactivity) used to prerender an instant
 * loading state while a route's Server Component streams in (Next 16 wraps
 * `page.tsx` in a `<Suspense>` boundary whose fallback is `loading.tsx`). They
 * intentionally mirror the real card/stat dimensions so the swap-in is calm.
 *
 * Pulse uses a low-opacity cream-deep block animated with Tailwind's built-in
 * `animate-pulse`; nothing here reads data.
 */

/** A single shimmering placeholder block. `className` sets size/shape. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded bg-cream-deep/70 ${className}`}
    />
  );
}

/** Placeholder for a StatCard (icon tile + value + label). */
export function SkeletonStat() {
  return (
    <div className="flex items-center gap-[13px] rounded-[15px] border border-[#eee8df] bg-white px-4 py-[15px]">
      <SkeletonBlock className="h-10 w-10 flex-none rounded-[11px]" />
      <div className="flex-1">
        <SkeletonBlock className="h-[1.1rem] w-12" />
        <SkeletonBlock className="mt-[7px] h-[0.6rem] w-20" />
      </div>
    </div>
  );
}

/** Placeholder for a project/invoice list row card. */
export function SkeletonCard() {
  return (
    <div className="rounded-[15px] border border-[#eee8df] bg-white px-[18px] py-[16px]">
      <div className="flex items-center justify-between gap-4">
        <SkeletonBlock className="h-[0.95rem] w-40" />
        <SkeletonBlock className="h-[1.4rem] w-20 rounded-full" />
      </div>
      <SkeletonBlock className="mt-3 h-[0.7rem] w-3/4" />
      <SkeletonBlock className="mt-2 h-[0.7rem] w-1/2" />
    </div>
  );
}
