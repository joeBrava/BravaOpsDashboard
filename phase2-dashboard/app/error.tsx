"use client";

import { RouteError } from "@/components/route-error";

/**
 * Error boundary for the Pipeline route (`/`). Must be a Client Component.
 * `unstable_retry` (Next 16.2) re-fetches and re-renders the segment.
 */
export default function PipelineError({
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
      title="Couldn't load the pipeline"
      description="Something went wrong fetching project status. This is usually temporary — try again, or head back to the pipeline."
    />
  );
}
