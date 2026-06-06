"use client";

import { RouteError } from "@/components/route-error";

/**
 * Error boundary for the deal-detail route (`/deals/[id]`). Must be a Client
 * Component. A *missing* deal is handled by `not-found.tsx` (the page calls
 * `notFound()`); this boundary catches unexpected runtime errors during render.
 * `unstable_retry` (Next 16.2) re-fetches and re-renders the segment.
 */
export default function DealDetailError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteError
      error={error}
      retry={unstable_retry}
      title="Couldn't load this deal"
      description="Something went wrong loading the deal detail. This is usually temporary — try again, or head back to the pipeline."
    />
  );
}
