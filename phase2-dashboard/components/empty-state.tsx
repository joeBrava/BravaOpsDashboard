import type { ReactNode } from "react";

/**
 * Shared friendly empty state for data lists (Pipeline projects, Invoices).
 *
 * Matches the dashed-card pattern already used by the deal-detail "no invoices"
 * panel and the not-found UI: a dashed cream border on white, centered display
 * heading + muted body copy, with optional supporting content (e.g. a switch
 * action or hint). Kept presentational (no data access) so it renders the same
 * in fixture mode and in the live graceful-degrade path (source returns `[]`).
 */
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[15px] border border-dashed border-[#ebe6dd] bg-white px-[18px] py-10 text-center">
      <h4 className="font-display text-base font-bold text-ink">{title}</h4>
      {children != null && (
        <p className="mx-auto mt-2 max-w-[34ch] text-[0.85rem] font-medium leading-relaxed text-gray-mid">
          {children}
        </p>
      )}
    </div>
  );
}
