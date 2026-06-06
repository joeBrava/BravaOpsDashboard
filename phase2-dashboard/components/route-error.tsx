"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

/**
 * Shared route-level error UI, rendered by each segment's `error.tsx`.
 *
 * Error boundaries must be Client Components (Next 16). This is a backstop for
 * truly unexpected runtime errors: the live data path degrades gracefully
 * (LiveSource returns `[]`/`null`, never throws), so in normal operation pages
 * fall back to friendly *empty* states rather than this boundary. When this
 * does render, it keeps the app shell (sidebar + cream canvas) and offers a
 * retry that re-fetches/re-renders the segment via `unstable_retry` (the v16.2
 * prop) plus a safe link back to the pipeline.
 *
 * `error.message` is the original text from Client Components but a generic
 * string from Server Components; `error.digest` matches the server log line.
 */
export function RouteError({
  error,
  retry,
  title,
  description,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title: string;
  description: string;
}) {
  useEffect(() => {
    // Surface to the server/browser console for debugging; production
    // observability would forward this to an error reporter.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />
      <main className="flex flex-1 items-center justify-center bg-cream px-4 py-[72px] sm:px-[26px] lg:py-[22px]">
        <div className="max-w-[34rem] rounded-[15px] border border-dashed border-[#ebe6dd] bg-white px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#ffe1e5] text-[1.2rem] text-[#c20f2b]">
            !
          </div>
          <h2 className="font-display text-xl font-extrabold text-ink">
            {title}
          </h2>
          <p className="mx-auto mt-2 max-w-[40ch] text-[0.85rem] font-medium leading-relaxed text-gray-mid">
            {description}
          </p>
          {error.digest && (
            <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.06em] text-gray-light">
              Reference {error.digest}
            </p>
          )}
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex rounded-[10px] bg-purple px-4 py-[9px] font-display text-[0.8rem] font-semibold text-white"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex rounded-[10px] border border-[#ebe6dd] bg-white px-4 py-[9px] font-display text-[0.8rem] font-semibold text-gray-dark"
            >
              Back to pipeline
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
