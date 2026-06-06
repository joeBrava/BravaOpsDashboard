"use client";

import { RouteError } from "@/components/route-error";

/**
 * Error boundary for the Invoices route (`/invoices`). Must be a Client
 * Component. `unstable_retry` (Next 16.2) re-fetches and re-renders the segment.
 */
export default function InvoicesError({
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
      title="Couldn't load invoices"
      description="Something went wrong fetching invoice status. This is usually temporary — try again, or head back to the pipeline."
    />
  );
}
